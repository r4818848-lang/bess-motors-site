import {
  acHookupPricePln,
  acR1234yfPer100gPln,
  acR134aPer100gPln,
  acRechargeFromPln,
} from "@/lib/ac-recharge-prices";

/** Strikethrough “was” prices — summer promo −50% */
export const AC_PROMO_DISCOUNT_PERCENT = 50;
export const AC_HOOKUP_PROMO_OLD_PLN = 160;
export const AC_R134A_PROMO_OLD_PLN = 120;
export const AC_R1234YF_PROMO_OLD_PLN = 160;

function acRefrigerantPromoLinePl(): string {
  return `R134a ${acR134aPer100gPln()} zł/100 g (było ${AC_R134A_PROMO_OLD_PLN} zł) · R1234yf ${acR1234yfPer100gPln()} zł/100 g (było ${AC_R1234YF_PROMO_OLD_PLN} zł)`;
}

function acRefrigerantPromoLineRu(): string {
  return `R134a ${acR134aPer100gPln()} zł/100 г (было ${AC_R134A_PROMO_OLD_PLN} zł) · R1234yf ${acR1234yfPer100gPln()} zł/100 г (было ${AC_R1234YF_PROMO_OLD_PLN} zł)`;
}

function acRefrigerantPromoLineEn(): string {
  return `R134a ${acR134aPer100gPln()} PLN/100g (was ${AC_R134A_PROMO_OLD_PLN}) · R1234yf ${acR1234yfPer100gPln()} PLN/100g (was ${AC_R1234YF_PROMO_OLD_PLN})`;
}

export function acPromoMetaTitlePl(): string {
  return `Promocja −50% nabijanie klimatyzacji Warszawa — od ${acRechargeFromPln()} zł`;
}

export function acPromoMetaDescriptionPl(): string {
  return `PROMOCJA −50% na nabijanie klimatyzacji w BESS MOTORS: podłączenie ${acHookupPricePln()} zł zamiast ${AC_HOOKUP_PROMO_OLD_PLN} zł, ${acRefrigerantPromoLinePl()}. Od ${acRechargeFromPln()} zł. Włochy, Aleja Krakowska — zapis online.`;
}

export function acPromoHeroLinePl(): string {
  return `PROMOCJA −50%: podłączenie ${acHookupPricePln()} zł (było ${AC_HOOKUP_PROMO_OLD_PLN} zł) · ${acRefrigerantPromoLinePl()}`;
}

export function acPromoMetaTitleRu(): string {
  return `Акция −50% — заправка кондиционера Варшава от ${acRechargeFromPln()} zł`;
}

export function acPromoMetaDescriptionRu(): string {
  return `Скидка −50% на заправку кондиционера в BESS MOTORS: подключение ${acHookupPricePln()} zł вместо ${AC_HOOKUP_PROMO_OLD_PLN} zł, ${acRefrigerantPromoLineRu()}. От ${acRechargeFromPln()} zł. Онлайн-запись.`;
}

export function acPromoHeroLineRu(): string {
  return `АКЦИЯ −50%: подключение ${acHookupPricePln()} zł (было ${AC_HOOKUP_PROMO_OLD_PLN} zł) · ${acRefrigerantPromoLineRu()}`;
}

export function acPromoMetaTitleEn(): string {
  return `A/C recharge −50% promo Warsaw — from ${acRechargeFromPln()} PLN`;
}

export function acPromoMetaDescriptionEn(): string {
  return `Summer −50% A/C promo at BESS MOTORS: hook-up ${acHookupPricePln()} PLN (was ${AC_HOOKUP_PROMO_OLD_PLN}), ${acRefrigerantPromoLineEn()}. From ${acRechargeFromPln()} PLN. Book online.`;
}

export function acPromoHeroLineEn(): string {
  return `−50% PROMO: hook-up ${acHookupPricePln()} PLN (was ${AC_HOOKUP_PROMO_OLD_PLN}) · ${acRefrigerantPromoLineEn()}`;
}

export const acPromoSeoKeywords = [
  "promocja klimatyzacji Warszawa",
  "promocja nabijanie klimatyzacji",
  "tanie nabijanie klimatyzacji Warszawa",
  "zniżka klimatyzacja samochodowa",
  "nabijanie klimatyzacji promocja",
  "R1234yf Warszawa promocja",
  "скидка заправка кондиционера Варшава",
  "акция заправка кондиционера",
  "промо заправка кондиционера R1234yf",
] as const;
