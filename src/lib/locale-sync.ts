import type { Locale } from "@/lib/i18n/types";

const LOCALES: Locale[] = ["pl", "ru", "en", "uk"];

export function siteLocaleFromTelegram(
  telegramLocale?: string | null
): Locale | null {
  if (!telegramLocale) return null;
  if (LOCALES.includes(telegramLocale as Locale)) return telegramLocale as Locale;
  return null;
}
