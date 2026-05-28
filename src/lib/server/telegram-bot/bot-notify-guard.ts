import type { User } from "@/lib/store";

export type BotNotifyCategory = "booking" | "status" | "promo";

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
  if (opts?.critical) return !!user.telegramChatId;
  if (!user.telegramChatId) return false;
  if (isBotGloballyMuted(user)) return false;
  return getBotNotifyPrefs(user)[category];
}
