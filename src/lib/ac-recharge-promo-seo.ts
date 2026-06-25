import {
  acHookupPricePln,
  acR134aPer100gPln,
  acRechargeFromPln,
} from "@/lib/ac-recharge-prices";

/** Strikethrough “was” prices shown in summer promo */
export const AC_HOOKUP_PROMO_OLD_PLN = 150;
export const AC_R134A_PROMO_OLD_PLN = 80;

export function acPromoMetaTitlePl(): string {
  return `Promocja nabijania klimatyzacji Warszawa — ${acHookupPricePln()} zł zamiast ${AC_HOOKUP_PROMO_OLD_PLN} zł`;
}

export function acPromoMetaDescriptionPl(): string {
  return `PROMOCJA letnia na nabijanie klimatyzacji w BESS MOTORS: podłączenie ${acHookupPricePln()} zł zamiast ${AC_HOOKUP_PROMO_OLD_PLN} zł, freon R134a ${acR134aPer100gPln()} zł/100 g zamiast ${AC_R134A_PROMO_OLD_PLN} zł. Od ${acRechargeFromPln()} zł. Włochy, Aleja Krakowska — zapis online.`;
}

export function acPromoHeroLinePl(): string {
  return `PROMOCJA: podłączenie ${acHookupPricePln()} zł (było ${AC_HOOKUP_PROMO_OLD_PLN} zł) · freon ${acR134aPer100gPln()} zł/100 g (było ${AC_R134A_PROMO_OLD_PLN} zł)`;
}

export function acPromoMetaTitleRu(): string {
  return `Акция — заправка кондиционера Варшава: ${acHookupPricePln()} zł вместо ${AC_HOOKUP_PROMO_OLD_PLN} zł`;
}

export function acPromoMetaDescriptionRu(): string {
  return `Скидка на заправку кондиционера в BESS MOTORS: подключение ${acHookupPricePln()} zł вместо ${AC_HOOKUP_PROMO_OLD_PLN} zł, фреон R134a ${acR134aPer100gPln()} zł/100 г вместо ${AC_R134A_PROMO_OLD_PLN} zł. От ${acRechargeFromPln()} zł. Онлайн-запись.`;
}

export function acPromoHeroLineRu(): string {
  return `АКЦИЯ: подключение ${acHookupPricePln()} zł (было ${AC_HOOKUP_PROMO_OLD_PLN} zł) · фреон ${acR134aPer100gPln()} zł/100 г (было ${AC_R134A_PROMO_OLD_PLN} zł)`;
}

export function acPromoMetaTitleEn(): string {
  return `A/C recharge promo Warsaw — ${acHookupPricePln()} PLN instead of ${AC_HOOKUP_PROMO_OLD_PLN} PLN`;
}

export function acPromoMetaDescriptionEn(): string {
  return `Summer A/C promo at BESS MOTORS: hook-up ${acHookupPricePln()} PLN (was ${AC_HOOKUP_PROMO_OLD_PLN}), R134a ${acR134aPer100gPln()} PLN/100g (was ${AC_R134A_PROMO_OLD_PLN}). From ${acRechargeFromPln()} PLN. Book online.`;
}

export function acPromoHeroLineEn(): string {
  return `PROMO: hook-up ${acHookupPricePln()} PLN (was ${AC_HOOKUP_PROMO_OLD_PLN}) · refrigerant ${acR134aPer100gPln()} PLN/100g (was ${AC_R134A_PROMO_OLD_PLN})`;
}

export const acPromoSeoKeywords = [
  "promocja klimatyzacji Warszawa",
  "promocja nabijanie klimatyzacji",
  "tanie nabijanie klimatyzacji Warszawa",
  "zniżka klimatyzacja samochodowa",
  "nabijanie klimatyzacji promocja",
  "скидка заправка кондиционера Варшава",
  "акция заправка кондиционера",
  "промо заправка кондиционера",
] as const;
