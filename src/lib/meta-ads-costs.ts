export interface MetaAdsDay {
  date: string;
  account_id: string;
  account_name: string;
  currency: "PLN";
  campaign: string;
  campaign_id: string;
  spend: number;
  clicks: number;
  impressions: number;
  meta_leads: number;
}
export interface MetaAdsPayload {
  mode: "api" | "snapshot";
  capturedAt: string;
  dateFrom: string;
  dateTo: string;
  currency: "PLN";
  rows: MetaAdsDay[];
  setupRequired: boolean;
  syncError?: boolean;
}

const ACCOUNT_IDS = new Set(["1543185617320087", "2174667433400820"]);
const VALID_DATE = /^20\d{2}-[01]\d-[0-3]\d$/;

function safeUnsignedNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= 100_000_000 ? n : null;
}

/** Source data is controlled by the Windsor connector; validate before showing or summing it. */
export function validateMetaAdsRows(value: unknown): MetaAdsDay[] {
  if (!Array.isArray(value) || value.length > 1000) throw Error("invalid_rows");
  const out: MetaAdsDay[] = [];
  const keys = new Set<string>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw Error("invalid_row");
    const row = raw as Record<string, unknown>;
    const account_id = String(row.account_id ?? "");
    const date = String(row.date ?? "");
    const campaign_id = String(row.campaign_id ?? "");
    const campaign = String(row.campaign ?? "");
    const account_name = String(row.account_name ?? "");
    if (!ACCOUNT_IDS.has(account_id) || row.account_currency && row.account_currency !== "PLN") continue;
    if (!VALID_DATE.test(date) || !/^\d{12,25}$/.test(campaign_id) || !campaign.trim() || campaign.length > 180 || account_name.length > 140) throw Error("bad_meta_dimension");
    const currency = row.currency ?? row.account_currency;
    if (currency !== "PLN") throw Error("unexpected_currency");
    const spend = safeUnsignedNumber(row.spend);
    const clicks = safeUnsignedNumber(row.clicks);
    const impressions = safeUnsignedNumber(row.impressions);
    const meta_leads = safeUnsignedNumber(row.meta_leads ?? row.actions_lead);
    if ([spend, clicks, impressions, meta_leads].some(n => n === null)) throw Error("invalid_meta_metric");
    const key = `${date}:${account_id}:${campaign_id}`;
    if (keys.has(key)) throw Error("duplicate_meta_day");
    keys.add(key);
    out.push({date,account_id,account_name,currency:"PLN",campaign,campaign_id,
      spend: Math.round(spend! * 100) / 100,clicks:clicks!,impressions:impressions!,meta_leads:meta_leads!});
  }
  return out;
}

export interface MetaCampaignTotals {
  id: string;
  name: string;
  account: string;
  spend: number;
  leads: number;
  clicks: number;
  impressions: number;
  costPerMetaLead: number | null;
}

export function summarizeMetaAds(rows: MetaAdsDay[]) {
  const spend = Math.round(rows.reduce((s, r) => s + r.spend, 0)*100)/100;
  const leads = rows.reduce((s,r)=>s+r.meta_leads,0);
  const clicks = rows.reduce((s,r)=>s+r.clicks,0);
  const impressions = rows.reduce((s,r)=>s+r.impressions,0);
  const byId = new Map<string, MetaCampaignTotals>();
  for(const r of rows) {
    const key = `${r.account_id}:${r.campaign_id}`;
    const c=byId.get(key)??{id:r.campaign_id,name:r.campaign,account:r.account_name,spend:0,leads:0,clicks:0,impressions:0,costPerMetaLead:null};
    c.spend += r.spend;
    c.leads += r.meta_leads;
    c.clicks += r.clicks;
    c.impressions += r.impressions;
    byId.set(key,c);
  }
  const campaigns = [...byId.values()].map(r=>({...r,spend:Math.round(r.spend*100)/100,costPerMetaLead:r.leads>0?Math.round(r.spend/r.leads*100)/100:null})).sort((a,b)=>b.spend-a.spend);
  return {spend,leads,clicks,impressions,costPerMetaLead:leads?Math.round(spend/leads*100)/100:null,campaigns};
}
