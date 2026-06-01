import type { LocalizedText } from "@/lib/service-landing-content";
import { contentLocale } from "@/lib/i18n/locale-utils";
import type { Locale } from "@/lib/i18n/types";

export function pickLocalized(text: LocalizedText, locale: Locale): string {
  return contentLocale(locale) === "ru" ? text.ru : text.pl;
}
