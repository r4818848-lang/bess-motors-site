import type { Locale } from "./types";

/** Pick PL vs RU content from bilingual data (namePl / nameRu). */
export function contentLocale(locale: Locale): "pl" | "ru" {
  return locale === "ru" || locale === "uk" ? "ru" : "pl";
}

/** Locale for PDFs and work-order documents. */
export function documentLocale(locale: Locale): "pl" | "ru" | "en" {
  if (locale === "ru" || locale === "uk") return "ru";
  if (locale === "en") return "en";
  return "pl";
}

/** Locale for PDFs and work-order documents (pl/ru/en). */
export function pdfLocale(locale: Locale): "pl" | "ru" | "en" {
  return documentLocale(locale);
}

export function pickName<
  T extends { namePl: string; nameRu: string; nameEn?: string; nameUk?: string },
>(item: T, locale: Locale): string {
  if (locale === "en") return item.nameEn || item.namePl;
  if (locale === "uk") return item.nameUk || item.nameRu;
  if (locale === "ru") return item.nameRu;
  return item.namePl;
}

export function pickTitle<
  T extends { titlePl: string; titleRu: string; titleEn?: string; titleUk?: string },
>(block: T, locale: Locale): string {
  if (locale === "en") return block.titleEn || block.titlePl;
  if (locale === "uk") return block.titleUk || block.titleRu;
  if (locale === "ru") return block.titleRu;
  return block.titlePl;
}

export function fillTemplate(
  template: string,
  vars: Record<string, string | number>
): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template
  );
}
