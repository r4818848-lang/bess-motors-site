import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { getTelegramConfig, sendTelegramMessage } from "@/lib/server/telegram-api";
import {
  claimLeadNotice,
  completeLeadNotice,
  formatLeadMessage,
  leadNoticeLeaseActive,
  type LeadNoticeClaim,
} from "@/lib/service-leads";
import type { ServiceLead } from "@/lib/store";

const RETRY_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function productionLeadChatIds(): string[] {
  const cfg = getTelegramConfig();
  return cfg ? [...cfg.adminChatIds] : [];
}

export function leadNeedsNotice(lead: ServiceLead, now: Date): boolean {
  const age = now.getTime() - Date.parse(lead.createdAt);
  if (!Number.isFinite(age) || age < 0 || age > RETRY_WINDOW_MS) return false;
  const rows = lead.notifyRecipients ?? [];
  if (rows.length > 0) {
    return rows.some((row) => {
      if (row.status === "sent" || row.attempts >= MAX_ATTEMPTS) return false;
      if (row.status === "sending" && row.leaseUntil && Date.parse(row.leaseUntil) > now.getTime()) return false;
      return true;
    });
  }
  if (lead.notifyStatus === "sent") return false;
  if (leadNoticeLeaseActive(lead, now)) return false;
  if ((lead.notifyAttempts ?? 0) >= MAX_ATTEMPTS) return false;
  return true;
}

export async function finishClaimedLeadNotice(
  leadId: string,
  text: string,
  claims: LeadNoticeClaim[],
  now = new Date()
): Promise<{ delivered: string[]; failed: string[] }> {
  const delivered: string[] = [];
  const failed: string[] = [];
  const messageIds = new Map<string, number>();
  for (const claim of claims) {
    const messageId = await sendTelegramMessage(claim.chatId, text);
    if (messageId == null) failed.push(claim.chatId);
    else {
      delivered.push(claim.chatId);
      messageIds.set(claim.chatId, messageId);
    }
  }
  if (claims.length > 0) {
    await cloudMutateCrmStore((db) => {
      const row = (db.leads ?? []).find((item) => item.id === leadId);
      if (!row) return;
      for (const claim of claims) {
        completeLeadNotice(
          row,
          claim.chatId,
          claim.token,
          delivered.includes(claim.chatId),
          now,
          messageIds.get(claim.chatId)
        );
      }
    }, { skipAutomation: true });
  }
  return { delivered, failed };
}

export async function releaseClaimedLeadNotice(leadId: string, claims: LeadNoticeClaim[], now = new Date()): Promise<void> {
  if (claims.length === 0) return;
  await cloudMutateCrmStore((db) => {
    const row = (db.leads ?? []).find((item) => item.id === leadId);
    if (!row) return;
    for (const claim of claims) completeLeadNotice(row, claim.chatId, claim.token, false, now);
  }, { skipAutomation: true });
}

/** Claim each unfinished admin chat, send, then close only that chat's claim. */
export async function deliverPendingLeadNotices(now = new Date(), chatIds = productionLeadChatIds()): Promise<number> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc || chatIds.length === 0) return 0;
  let sent = 0;
  for (const lead of snap.doc.leads ?? []) {
    if (!leadNeedsNotice(lead, now)) continue;
    let claims: LeadNoticeClaim[] = [];
    const claim = await cloudMutateCrmStore((db) => {
      const row = (db.leads ?? []).find((item) => item.id === lead.id);
      if (!row || !leadNeedsNotice(row, now)) return "skip";
      claims = claimLeadNotice(row, now, chatIds);
      return claims.length > 0 ? "send" : "skip";
    }, { skipAutomation: true });
    if (!claim.ok || claim.result !== "send" || claims.length === 0) continue;
    const result = await finishClaimedLeadNotice(lead.id, formatLeadMessage(lead), claims, now);
    if (result.delivered.length > 0) sent += result.delivered.length;
  }
  return sent;
}
