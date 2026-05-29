import { NextRequest, NextResponse } from "next/server";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import { runInactiveClientsReport } from "@/lib/server/telegram-cron/inactive-clients";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = cleanEnvValue(process.env.CRON_SECRET);
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = await loadCrmFromCloud();
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });

  const { count } = await runInactiveClientsReport(db);
  return NextResponse.json({ ok: true, count });
}
