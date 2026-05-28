import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import type { BotNotifyCategory } from "./bot-notify-guard";
import { defaultBotNotifyPrefs, getBotNotifyPrefs } from "./bot-notify-guard";
import type { BotLocale } from "./client-i18n";
import { getClientBotLabels } from "./client-i18n";
import type { Database, User } from "@/lib/store";

function toggleLabel(on: boolean, locale: BotLocale, key: BotNotifyCategory): string {
  const mark = on ? "✅" : "⬜";
  const names: Record<BotNotifyCategory, Record<BotLocale, string>> = {
    booking: { pl: "Wizyty", ru: "Записи", uk: "Записи", en: "Appointments" },
    status: { pl: "Status naprawy", ru: "Статус ремонта", uk: "Статус ремонту", en: "Repair status" },
    promo: { pl: "Promocje", ru: "Акции", uk: "Акції", en: "Promos" },
  };
  return `${mark} ${names[key][locale]}`;
}

export function notifyPrefsKeyboard(locale: BotLocale, user: User): InlineKeyboardMarkup {
  const p = getBotNotifyPrefs(user);
  const L = getClientBotLabels(locale);
  const muted = user.botMuteUntil && new Date(user.botMuteUntil) > new Date();
  return {
    inline_keyboard: [
      [{ text: toggleLabel(p.booking, locale, "booking"), callback_data: "cl:np:booking" }],
      [{ text: toggleLabel(p.status, locale, "status"), callback_data: "cl:np:status" }],
      [{ text: toggleLabel(p.promo, locale, "promo"), callback_data: "cl:np:promo" }],
      [
        { text: muted ? "🔔 24h" : "🔕 24h", callback_data: "cl:np:mute24" },
        { text: muted ? L.muteWeekOff : L.muteWeekOn, callback_data: "cl:np:mute7" },
      ],
      [{ text: L.menu, callback_data: "cl:menu" }],
    ],
  };
}

export function formatNotifyPrefsIntro(locale: BotLocale): string {
  const L = getClientBotLabels(locale);
  return L.notifySettingsIntro;
}

async function updateUser(chatKey: string, fn: (u: User) => void): Promise<User | null> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return null;
  const db = structuredClone(snap.doc) as Database;
  const user = db.users.find((u) => u.telegramChatId === chatKey && u.role === "client");
  if (!user) return null;
  fn(user);
  await cloudPutCrmStore(db);
  return user;
}

export async function toggleNotifyCategory(
  chatKey: string,
  category: BotNotifyCategory
): Promise<User | null> {
  return updateUser(chatKey, (u) => {
    const cur = { ...defaultBotNotifyPrefs(), ...u.botNotifyPrefs };
    u.botNotifyPrefs = { ...cur, [category]: !cur[category] };
  });
}

export async function toggleMute24h(chatKey: string): Promise<boolean> {
  let muted = false;
  await updateUser(chatKey, (u) => {
    const now = new Date();
    if (u.botMuteUntil && new Date(u.botMuteUntil) > now) {
      u.botMuteUntil = undefined;
      muted = false;
    } else {
      const until = new Date(now);
      until.setHours(until.getHours() + 24);
      u.botMuteUntil = until.toISOString();
      muted = true;
    }
  });
  return muted;
}

export async function toggleMuteWeek(chatKey: string): Promise<boolean> {
  let muted = false;
  await updateUser(chatKey, (u) => {
    const now = new Date();
    if (u.botMuteUntil && new Date(u.botMuteUntil) > now) {
      u.botMuteUntil = undefined;
      muted = false;
    } else {
      const until = new Date(now);
      until.setDate(until.getDate() + 7);
      u.botMuteUntil = until.toISOString();
      muted = true;
    }
  });
  return muted;
}
