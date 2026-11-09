import { notifyAdminTelegram } from "@/lib/server/telegram-api";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { claimLeadNotice, completeLeadNotice, formatLeadMessage, leadNoticeLeaseActive } from "@/lib/service-leads";
import type { ServiceLead } from "@/lib/store";

const RETRY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function leadNeedsNotice(lead: ServiceLead, now: Date): boolean {
  if (lead.notifyStatus === "sent") return false;
  if (leadNoticeLeaseActive(lead, now)) return false;
  if ((lead.notifyAttempts ?? 0) >= MAX_ATTEMPTS) return false;
  const age = now.getTime() - Date.parse(lead.createdAt);
  return Number.isFinite(age) && age >= 0 && age <= RETRY_WINDOW_MS;
}

/** Claim each fresh lead before Telegram. A second project sees "sending" and skips. */
export async function deliverPendingLeadNotices(now = new Date()): Promise<number> {
  const { cloudGetCrmStore } = await import("@/lib/server/crm-cloud");
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return 0;
  let sent = 0;
  for (const lead of snap.doc.leads ?? []) {
    if (!leadNeedsNotice(lead, now)) continue;
    const claim = await cloudMutateCrmStore((db) => {
      const row = (db.leads ?? []).find((item) => item.id === lead.id);
      if (!row || !leadNeedsNotice(row, now)) return "skip";
      return claimLeadNotice(row, now);
    }, { skipAutomation: true });
    if (!claim.ok || claim.result !== "send") continue;
    const ok = await notifyAdminTelegram(formatLeadMessage(lead));
    await cloudMutateCrmStore((db) => {
      const row = (db.leads ?? []).find((item) => item.id === lead.id);
      if (row) completeLeadNotice(row, ok, new Date());
    }, { skipAutomation: true });
    if (ok) sent += 1;
  }
  return sent;
}
