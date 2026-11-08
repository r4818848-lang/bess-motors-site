import { notifyAdminTelegram } from "@/lib/server/telegram-api";
import { formatLeadMessage } from "@/lib/service-leads";
import type { Database, ServiceLead } from "@/lib/store";
import { cloudPutCrmStore } from "@/lib/server/crm-cloud";

const RETRY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function leadNeedsNotice(lead: ServiceLead, now: Date): boolean {
  if (lead.notifyStatus === "sent") return false;
  if ((lead.notifyAttempts ?? 0) >= MAX_ATTEMPTS) return false;
  const age = now.getTime() - Date.parse(lead.createdAt);
  return Number.isFinite(age) && age >= 0 && age <= RETRY_WINDOW_MS;
}

/** Retry only recent unsent leads. Older rows stay quiet after a deploy. */
export async function deliverPendingLeadNotices(db: Database, now = new Date()): Promise<number> {
  let sent = 0;
  for (const lead of db.leads ?? []) {
    if (!leadNeedsNotice(lead, now)) continue;
    lead.notifyAttempts = (lead.notifyAttempts ?? 0) + 1;
    const ok = await notifyAdminTelegram(formatLeadMessage(lead));
    if (!ok) continue;
    lead.notifyStatus = "sent";
    sent += 1;
    await cloudPutCrmStore(db);
  }
  return sent;
}
