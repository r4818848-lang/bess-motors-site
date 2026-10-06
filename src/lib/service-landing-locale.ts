import type { LocalizedText } from "@/lib/service-landing-content";
import type { Locale } from "@/lib/i18n/types";

/** Prefer exact locale string; fall back en→pl, uk→ru, else pl. */
export function pickLocalized(text: LocalizedText, locale: Locale): string {
  if (locale === "pl") return text.pl;
  if (locale === "ru") return text.ru;
  if (locale === "en") return text.en || text.pl;
  if (locale === "uk") return text.uk || text.ru;
  return text.pl;
}
