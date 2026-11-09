import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { consumeTelegramSendError, getTelegramConfig, sendTelegramMessage } from "@/lib/server/telegram-api";
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

export type LeadNoticeDecision =
  | "deliver"
  | "historical_sent"
  | "already_sent"
  | "too_old"
  | "lease_active"
  | "attempts_exhausted";

/** Read-only reason a lead would or would not be sent. Does not write CRM. */
export function classifyLeadNotice(lead: ServiceLead, now: Date): LeadNoticeDecision {
  const age = now.getTime() - Date.parse(lead.createdAt);
  if (!Number.isFinite(age) || age < 0 || age > RETRY_WINDOW_MS) return "too_old";
  const rows = lead.notifyRecipients ?? [];
  if (rows.length > 0) {
    let pending = false;
    let leased = false;
    for (const row of rows) {
      if (row.status === "sent") continue;
      if (row.attempts >= MAX_ATTEMPTS) continue;
      if (row.status === "sending" && row.leaseUntil && Date.parse(row.leaseUntil) > now.getTime()) {
        leased = true;
        continue;
      }
      pending = true;
    }
    if (pending) return "deliver";
    if (leased) return "lease_active";
    if (rows.every((row) => row.status === "sent")) return "already_sent";
    return "attempts_exhausted";
  }
  if (lead.notifyStatus === "sent") return "historical_sent";
  if (leadNoticeLeaseActive(lead, now)) return "lease_active";
  if ((lead.notifyAttempts ?? 0) >= MAX_ATTEMPTS) return "attempts_exhausted";
  return "deliver";
}

export function leadNeedsNotice(lead: ServiceLead, now: Date): boolean {
  return classifyLeadNotice(lead, now) === "deliver";
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
  const errors = new Map<string, string>();
  for (const claim of claims) {
    const messageId = await sendTelegramMessage(claim.chatId, text);
    if (messageId == null) {
      failed.push(claim.chatId);
      errors.set(claim.chatId, consumeTelegramSendError() ?? "telegram_send_failed");
    } else {
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
          messageIds.get(claim.chatId),
          errors.get(claim.chatId)
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
