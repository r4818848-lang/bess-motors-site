import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import type { Database } from "@/lib/store";
import { findClientByTelegramChat } from "./client-telegram-link";
import {
  type BotLocale,
  getClientBotLabels,
  isBotLocale,
  LANGUAGE_NAMES,
} from "./client-i18n";
import {
  getTelegramSession,
  setTelegramSession,
  type TelegramSession,
} from "@/lib/server/telegram-sessions";

export type { BotLocale };

export async function getClientLocale(chatKey: string): Promise<BotLocale | null> {
  const session = await getTelegramSession(chatKey);
  const fromSession = session.data?.locale;
  if (fromSession && isBotLocale(fromSession)) return fromSession;

  const snap = await cloudGetCrmStore();
  if (snap?.doc) {
    const user = findClientByTelegramChat(snap.doc as Database, chatKey);
    if (user?.telegramLocale && isBotLocale(user.telegramLocale)) {
      return user.telegramLocale;
    }
  }
  return null;
}

export async function saveClientLocale(
  chatKey: string,
  locale: BotLocale
): Promise<void> {
  const session = await getTelegramSession(chatKey);
  await setTelegramSession(chatKey, {
    step: session.step,
    data: { ...(session.data ?? {}), locale },
  });

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return;

  const db = structuredClone(snap.doc) as Database;
  const user = findClientByTelegramChat(db, chatKey);
  if (user) {
    user.telegramLocale = locale;
    await cloudPutCrmStore(db);
  }
}

/** Keeps `data.locale` when updating wizard steps */
export async function setClientTelegramSession(
  chatKey: string,
  session: TelegramSession
): Promise<void> {
  const locale = await getClientLocale(chatKey);
  const data = { ...(session.data ?? {}) };
  if (locale) data.locale = locale;
  await setTelegramSession(chatKey, { ...session, data });
}

export async function clearTelegramSessionKeepLocale(chatKey: string): Promise<void> {
  const locale = await getClientLocale(chatKey);
  if (locale) {
    await setTelegramSession(chatKey, { data: { locale } });
  } else {
    await setTelegramSession(chatKey, null);
  }
}

export function languageDisplayName(locale: BotLocale): string {
  return LANGUAGE_NAMES[locale];
}

export { getClientBotLabels };
