import type { Locale } from "@/lib/i18n/types";
import { contentLocale } from "@/lib/i18n/locale-utils";
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import {
  acPromoHeroLineEn,
  acPromoHeroLineRu,
  acPromoMetaDescriptionEn,
  acPromoMetaDescriptionRu,
  acPromoMetaTitleEn,
  acPromoMetaTitleRu,
} from "@/lib/ac-recharge-promo-seo";

type SeoText = Pick<SeoLandingPage, "title" | "line1" | "line2" | "metaTitle" | "metaDescription">;

const SEO_RU: Partial<Record<string, SeoText>> = {
  diagnostyka: {
    title: "Компьютерная диагностика",
    line1: "Быстрая диагностика авто",
    line2: "Точное выявление неисправностей",
    metaTitle: "Компьютерная диагностика Варшава",
    metaDescription:
      "Компьютерная диагностика в BESS MOTORS — быстро и точно. Ошибки двигателя, электрика. Варшава, Aleja Krakowska.",
  },
  "wymiana-oleju": {
    title: "Замена масла",
    line1: "Масло и фильтры за 1 час",
    line2: "Расходники OEM/OES",
    metaTitle: "Замена масла Варшава",
    metaDescription: "Замена масла и фильтров в BESS MOTORS — быстро, качественно. Сервис Варшава.",
  },
  hamulce: {
    title: "Тормозная система",
    line1: "Колодки, диски, суппорты",
    line2: "Безопасность на дороге",
    metaTitle: "Сервис тормозов Варшава",
    metaDescription: "Ремонт тормозов — колодки, диски. BESS MOTORS Варшава.",
  },
  klimatyzacja: {
    title: "Автокондиционер",
    line1: acPromoHeroLineRu(),
    line2: "Вакуум, герметичность — сезонная акция",
    metaTitle: acPromoMetaTitleRu(),
    metaDescription: acPromoMetaDescriptionRu(),
  },
  zawieszenie: {
    title: "Ремонт подвески",
    line1: "Стуки и люфт в подвеске?",
    line2: "Профессиональный сервис Варшава",
    metaTitle: "Ремонт подвески Варшава",
    metaDescription: "Ремонт подвески — амортизаторы, рычаги, стуки. BESS MOTORS.",
  },
  "check-engine": {
    title: "Check Engine — диагностика",
    line1: "Горит лампа Check Engine?",
    line2: "Компьютерная диагностика",
    metaTitle: "Check Engine Варшава — BESS MOTORS",
    metaDescription: "Диагностика Check Engine — считывание ошибок, ремонт. BESS MOTORS.",
  },
};

const SEO_EN: Partial<Record<string, SeoText>> = {
  diagnostyka: {
    title: "Computer Diagnostics",
    line1: "Fast car diagnostics",
    line2: "Accurate fault detection",
    metaTitle: "Computer diagnostics Warsaw",
    metaDescription: "Computer diagnostics at BESS MOTORS — engine faults, electrics. Warsaw.",
  },
  "wymiana-oleju": {
    title: "Oil Change",
    line1: "Oil and filters in 1 hour",
    line2: "Quality parts and fluids",
    metaTitle: "Oil change Warsaw",
    metaDescription: "Oil and filter change at BESS MOTORS — fast service in Warsaw.",
  },
  hamulce: {
    title: "Brake Service",
    line1: "Pads, discs, calipers",
    line2: "Safety on the road",
    metaTitle: "Brake service Warsaw",
    metaDescription: "Brake repair — pads and discs. BESS MOTORS Warsaw.",
  },
  klimatyzacja: {
    title: "Car A/C Service",
    line1: acPromoHeroLineEn(),
    line2: "Vacuum, leak check — summer promo",
    metaTitle: acPromoMetaTitleEn(),
    metaDescription: acPromoMetaDescriptionEn(),
  },
  zawieszenie: {
    title: "Suspension Repair",
    line1: "Knocks or play in suspension?",
    line2: "Professional service in Warsaw",
    metaTitle: "Suspension repair Warsaw",
    metaDescription: "Suspension repair — shocks, arms, noises. BESS MOTORS.",
  },
  "check-engine": {
    title: "Check Engine diagnostics",
    line1: "Engine warning light on?",
    line2: "Computer diagnostics",
    metaTitle: "Check Engine Warsaw — BESS MOTORS",
    metaDescription: "Check Engine diagnostics and repair at BESS MOTORS.",
  },
};

export function localizeSeoLandingPage(page: SeoLandingPage, locale: Locale): SeoLandingPage {
  if (locale === "en") {
    const en = SEO_EN[page.slug];
    if (en) return { ...page, ...en };
  }
  if (contentLocale(locale) === "ru") {
    const ru = SEO_RU[page.slug];
    if (ru) return { ...page, ...ru };
  }
  return page;
}
