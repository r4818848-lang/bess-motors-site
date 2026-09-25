import {
  acHookupPricePln,
  acR1234yfPer100gPln,
  acR134aPer100gPln,
  acRechargeFromPln,
} from "@/lib/ac-recharge-prices";

/** Legacy constants — seasonal −50% retired; kept for import compatibility. */
export const AC_PROMO_DISCOUNT_PERCENT = 0;
export const AC_HOOKUP_PROMO_OLD_PLN = acHookupPricePln();
export const AC_R134A_PROMO_OLD_PLN = acR134aPer100gPln();
export const AC_R1234YF_PROMO_OLD_PLN = acR1234yfPer100gPln();

function acRefrigerantLinePl(): string {
  return `R134a ${acR134aPer100gPln()} zł/100 g · R1234yf ${acR1234yfPer100gPln()} zł/100 g`;
}

function acRefrigerantLineRu(): string {
  return `R134a ${acR134aPer100gPln()} zł/100 г · R1234yf ${acR1234yfPer100gPln()} zł/100 г`;
}

function acRefrigerantLineEn(): string {
  return `R134a ${acR134aPer100gPln()} PLN/100g · R1234yf ${acR1234yfPer100gPln()} PLN/100g`;
}

function acRefrigerantLineUk(): string {
  return `R134a ${acR134aPer100gPln()} zł/100 г · R1234yf ${acR1234yfPer100gPln()} zł/100 г`;
}

export function acPromoMetaTitlePl(): string {
  return `Nabijanie klimatyzacji Warszawa — od ${acRechargeFromPln()} zł | BESS MOTORS`;
}

export function acPromoMetaDescriptionPl(): string {
  return `Nabijanie klimatyzacji w BESS MOTORS Warszawa Włochy: podłączenie ${acHookupPricePln()} zł, ${acRefrigerantLinePl()}. R134a i R1234yf. Od ${acRechargeFromPln()} zł. Aleja Krakowska 48/52 — zapis online.`;
}

export function acPromoHeroLinePl(): string {
  return `Podłączenie ${acHookupPricePln()} zł · ${acRefrigerantLinePl()}`;
}

export function acPromoAccentLinePl(): string {
  return "Wszystkie marki aut · R134a i R1234yf · zapis online";
}

export function acPromoMetaTitleRu(): string {
  return `Заправка кондиционера Варшава — от ${acRechargeFromPln()} zł | BESS MOTORS`;
}

export function acPromoMetaDescriptionRu(): string {
  return `Заправка кондиционера в BESS MOTORS Варшава: подключение ${acHookupPricePln()} zł, ${acRefrigerantLineRu()}. R134a и R1234yf. От ${acRechargeFromPln()} zł. Aleja Krakowska 48/52 — онлайн-запись.`;
}

export function acPromoHeroLineRu(): string {
  return `Подключение ${acHookupPricePln()} zł · ${acRefrigerantLineRu()}`;
}

export function acPromoAccentLineRu(): string {
  return "Все марки авто · R134a и R1234yf · онлайн-запись";
}

export function acPromoMetaTitleEn(): string {
  return `A/C recharge Warsaw — from ${acRechargeFromPln()} PLN | BESS MOTORS`;
}

export function acPromoMetaDescriptionEn(): string {
  return `A/C recharge at BESS MOTORS Warsaw: hook-up ${acHookupPricePln()} PLN, ${acRefrigerantLineEn()}. R134a and R1234yf. From ${acRechargeFromPln()} PLN. Aleja Krakowska 48/52 — book online.`;
}

export function acPromoHeroLineEn(): string {
  return `Hook-up ${acHookupPricePln()} PLN · ${acRefrigerantLineEn()}`;
}

export function acPromoAccentLineEn(): string {
  return "All car makes · R134a and R1234yf · book online";
}

export function acPromoMetaTitleUk(): string {
  return `Заправка кондиціонера Варшава — від ${acRechargeFromPln()} zł | BESS MOTORS`;
}

export function acPromoMetaDescriptionUk(): string {
  return `Заправка кондиціонера в BESS MOTORS Варшава: підключення ${acHookupPricePln()} zł, ${acRefrigerantLineUk()}. R134a і R1234yf. Від ${acRechargeFromPln()} zł. Aleja Krakowska 48/52 — онлайн-запис.`;
}

export function acPromoHeroLineUk(): string {
  return `Підключення ${acHookupPricePln()} zł · ${acRefrigerantLineUk()}`;
}

export function acPromoAccentLineUk(): string {
  return "Усі марки авто · R134a і R1234yf · онлайн-запис";
}

export function acRepairMetaTitlePl(): string {
  return "Naprawa klimatyzacji samochodowej Warszawa — BESS MOTORS";
}

export function acRepairMetaDescriptionPl(): string {
  return "Naprawa klimatyzacji samochodowej w Warszawie Włochy: diagnostyka, szczelność obiegu, spawanie przewodów, wymiana sprężarki, chłodnicy i osuszacza. Po naprawie — nabijanie R134a / R1234yf. BESS MOTORS, Aleja Krakowska 48/52.";
}

/** Commercial A/C keywords — no seasonal discount phrases */
export const acPromoSeoKeywords = [
  "nabijanie klimatyzacji Warszawa",
  "nabijanie klimatyzacji samochodowej Warszawa",
  "zaprawa klimatyzacji samochodowej",
  "napełnianie klimatyzacji R134a",
  "napełnianie klimatyzacji R1234yf",
  "serwis klimatyzacji Warszawa Włochy",
  "заправка кондиционера Варшава",
  "A/C recharge Warsaw",
  "заправка кондиціонера Варшава",
] as const;

export const acRepairSeoKeywords = [
  "naprawa klimatyzacji samochodowej Warszawa",
  "naprawa klimatyzacji Warszawa",
  "serwis klimatyzacji naprawa",
  "wymiana sprężarki klimatyzacji Warszawa",
  "wymiana chłodnicy klimatyzacji",
  "nieszczelność klimatyzacji naprawa",
  "spawanie przewodów klimatyzacji",
  "diagnostyka klimatyzacji samochodowej",
  "ремонт автокондиционера Варшава",
  "замена компрессора кондиционера",
  "устранение утечки фреона",
] as const;
