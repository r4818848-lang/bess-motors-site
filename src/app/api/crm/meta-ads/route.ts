import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import { validateMetaAdsRows, type MetaAdsPayload } from "@/lib/meta-ads-costs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


/** All spend data is private to the owner, never sent to public pages. */
export async function GET(req: Request) {
  const bearer = req.headers.get("authorization");
  if (!bearer?.startsWith("Bearer ")) return NextResponse.json({ error:"unauthorized" },{status:401});
  const session = await verifyToken(bearer.slice(7).trim());
  if (!session || session.role !== "admin") return NextResponse.json({ error:"forbidden" },{status:403});

  const apiKey = process.env.WINDSOR_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({error:"windsor_not_configured"}, {status:503,headers:{"Cache-Control":"private, no-store"}});

  try {
    const end = new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Warsaw",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    const start = new Date(Date.parse(end+"T00:00:00Z") - 27*24*60*60*1000).toISOString().slice(0,10);
    const url = new URL("https://connectors.windsor.ai/facebook");
    url.searchParams.set("api_key",apiKey);
    url.searchParams.set("fields","date,account_id,account_name,account_currency,campaign,campaign_id,spend,clicks,impressions,actions_lead");
    url.searchParams.set("date_from",start);
    url.searchParams.set("date_to",end);
    const selectedAccounts=process.env.WINDSOR_META_ACCOUNT_IDS?.trim();
    if (selectedAccounts && /^[0-9,]{8,120}$/.test(selectedAccounts)) url.searchParams.set("select_accounts", selectedAccounts);
    url.searchParams.set("_max_rows","1000");
    const res=await fetch(url.toString(),{cache:"no-store",headers:{"Accept":"application/json","User-Agent":"BESS-MOTORS-CRM/1.0"},signal:AbortSignal.timeout(20000)});
    if (!res.ok) throw Error("windsor_http");
    const result: unknown=await res.json();
    if (!result || typeof result!=="object") throw Error("invalid_provider_payload");
    const payload=result as {data?:unknown; error?:unknown};
    if(payload.error) throw Error("windsor_error");
    const raw=Array.isArray(result)?result:payload.data;
    const rows=validateMetaAdsRows(raw);
    if (!rows.length) throw Error("provider_empty");
    const current:MetaAdsPayload={mode:"api",capturedAt:new Date().toISOString(),dateFrom:start,dateTo:end,currency:"PLN",rows,setupRequired:false};
    return NextResponse.json(current,{headers:{"Cache-Control":"private, no-store"}});
  } catch {
    // Never leak Windsor credentials, URLs, response bodies or raw account data to logs.
    return NextResponse.json({error:"windsor_read_failed"},{status:502,headers:{"Cache-Control":"private, no-store"}});
  }
}
