import type { User } from "@/lib/store";
import { isWhatsAppConfigured } from "@/lib/server/whatsapp-api";
import { resolveWhatsAppRecipient } from "@/lib/server/whatsapp-bot/whatsapp-phone";

export type BotNotifyCategory = "booking" | "status" | "promo";

export function hasClientMessagingChannel(user: User): boolean {
  return !!(user.telegramChatId || resolveWhatsAppRecipient(user));
}

export function defaultBotNotifyPrefs(): Record<BotNotifyCategory, boolean> {
  return { booking: true, status: true, promo: true };
}

export function getBotNotifyPrefs(user: User): Record<BotNotifyCategory, boolean> {
  const d = defaultBotNotifyPrefs();
  const p = user.botNotifyPrefs;
  if (!p) return d;
  return {
    booking: p.booking !== false,
    status: p.status !== false,
    promo: p.promo !== false,
  };
}

/** Global mute (e.g. 7 days) — blocks all bot pushes except critical sign-required */
export function isBotGloballyMuted(user: User, now = new Date()): boolean {
  if (!user.botMuteUntil) return false;
  const until = new Date(user.botMuteUntil);
  return !Number.isNaN(until.getTime()) && until.getTime() > now.getTime();
}

export function canSendBotNotify(
  user: User,
  category: BotNotifyCategory,
  opts?: { critical?: boolean }
): boolean {
  const canTelegram = !!user.telegramChatId;
  const canWhatsApp = isWhatsAppConfigured() && !!resolveWhatsAppRecipient(user);

  if (opts?.critical) return canTelegram || canWhatsApp;
  if (!canTelegram && !canWhatsApp) return false;
  if (isBotGloballyMuted(user)) return false;
  return getBotNotifyPrefs(user)[category];
}

export function canSendWhatsAppNotify(
  user: User,
  category: BotNotifyCategory,
  opts?: { critical?: boolean }
): boolean {
  if (!isWhatsAppConfigured()) return false;
  if (!resolveWhatsAppRecipient(user)) return false;
  return canSendBotNotify(user, category, opts);
}

export function canSendTelegramNotify(
  user: User,
  category: BotNotifyCategory,
  opts?: { critical?: boolean }
): boolean {
  if (!user.telegramChatId) return false;
  if (opts?.critical) return true;
  if (isBotGloballyMuted(user)) return false;
  return getBotNotifyPrefs(user)[category];
}
