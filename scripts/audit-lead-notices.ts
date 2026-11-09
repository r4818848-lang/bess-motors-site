/**
 * Count how a saved lead export would be treated by the lead-notice cron.
 * Reads one local JSON file. Does not connect to Supabase and does not write.
 *
 *   tsx scripts/audit-lead-notices.ts ./leads.json
 *
 * The file is either an array of leads or `{ "leads": [...] }`.
 * Output is counts only: no phone, VIN, name or message text.
 */
import { readFileSync } from "node:fs";
import { classifyLeadNotice, type LeadNoticeDecision } from "../src/lib/server/telegram-cron/lead-notifications";
import type { ServiceLead } from "../src/lib/store";

const decisions: LeadNoticeDecision[] = [
  "deliver",
  "historical_sent",
  "already_sent",
  "too_old",
  "lease_active",
  "attempts_exhausted",
];

function refuseLiveConnection(): void {
  const url = process.env.SUPABASE_URL ?? "";
  if (/supabase\.co/i.test(url)) {
    console.error("refusing: SUPABASE_URL points at Supabase. This check reads a local file only.");
    process.exit(3);
  }
}

function loadLeads(path: string): ServiceLead[] {
  const parsed = JSON.parse(readFileSync(path, "utf8")) as { leads?: ServiceLead[] } | ServiceLead[];
  const leads = Array.isArray(parsed) ? parsed : parsed.leads;
  if (!Array.isArray(leads)) throw new Error("JSON must be a lead array or { leads: [] }");
  return leads;
}

function main(): void {
  refuseLiveConnection();
  const path = process.argv[2];
  if (!path || path.startsWith("http")) {
    console.error("usage: tsx scripts/audit-lead-notices.ts <local-leads.json>");
    process.exit(2);
  }
  const now = new Date();
  const counts = Object.fromEntries(decisions.map((key) => [key, 0])) as Record<LeadNoticeDecision, number>;
  const leads = loadLeads(path);
  for (const lead of leads) counts[classifyLeadNotice(lead, now)] += 1;
  console.log(JSON.stringify({ checked: leads.length, counts, sends: counts.deliver }, null, 2));
}

main();
