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

export function pickName<T extends { namePl: string; nameRu: string }>(
  item: T,
  locale: Locale
): string {
  return contentLocale(locale) === "ru" ? item.nameRu : item.namePl;
}

export function pickTitle<T extends { titlePl: string; titleRu: string }>(
  block: T,
  locale: Locale
): string {
  return contentLocale(locale) === "ru" ? block.titleRu : block.titlePl;
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
