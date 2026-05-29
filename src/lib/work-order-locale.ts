import type { Locale } from "@/lib/i18n/types";
import { pdfLocale } from "@/lib/i18n/locale-utils";
import type { DocLocale } from "@/lib/work-order-document";
import type { WorkOrder } from "@/lib/store";

export type { DocLocale };

export function isDocLocale(v: string | null | undefined): v is DocLocale {
  return v === "pl" || v === "ru" || v === "en";
}

/** Document language: order setting → URL ?lang= → UI locale */
export function resolveOrderDocumentLocale(
  order: Pick<WorkOrder, "documentLocale">,
  uiLocale?: Locale,
  urlLang?: string | null
): DocLocale {
  if (order.documentLocale && isDocLocale(order.documentLocale)) {
    return order.documentLocale;
  }
  if (isDocLocale(urlLang ?? undefined)) return urlLang as DocLocale;
  if (uiLocale) return pdfLocale(uiLocale);
  return "pl";
}

export function getPremiumWoContent(locale: DocLocale): {
  slogan: string;
  badges: [string, string, string, string];
} {
  if (locale === "ru") {
    return {
      slogan: "ВАШ АВТОМОБИЛЬ В НАДЁЖНЫХ РУКАХ!",
      badges: ["БЫСТРО", "ПРОФЕССИОНАЛЬНО", "ГАРАНТИЯ", "PREMIUM SERVICE"],
    };
  }
  if (locale === "en") {
    return {
      slogan: "YOUR CAR IN TRUSTED HANDS!",
      badges: ["FAST", "PROFESSIONAL", "WARRANTY", "PREMIUM SERVICE"],
    };
  }
  return {
    slogan: "TWÓJ SAMOCHÓD W DOBRYCH RĘKACH!",
    badges: ["SZYBKO", "PROFESJONALNIE", "GWARANCJA", "PREMIUM SERVICE"],
  };
}
