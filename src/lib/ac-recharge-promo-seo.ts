import {
  acHookupPricePln,
  acR1234yfPer100gPln,
  acR134aPer100gPln,
  acRechargeFromPln,
} from "@/lib/ac-recharge-prices";

/** Strikethrough “was” prices — summer promo −50% */
export const AC_PROMO_DISCOUNT_PERCENT = 50;
export const AC_HOOKUP_PROMO_OLD_PLN = 160;
export const AC_R134A_PROMO_OLD_PLN = 100;
export const AC_R1234YF_PROMO_OLD_PLN = 100;

function acRefrigerantPromoLinePl(): string {
  return `R134a ${acR134aPer100gPln()} zł/100 g (było ${AC_R134A_PROMO_OLD_PLN} zł) · R1234yf ${acR1234yfPer100gPln()} zł/100 g (było ${AC_R1234YF_PROMO_OLD_PLN} zł)`;
}

function acRefrigerantPromoLineRu(): string {
  return `R134a ${acR134aPer100gPln()} zł/100 г (было ${AC_R134A_PROMO_OLD_PLN} zł) · R1234yf ${acR1234yfPer100gPln()} zł/100 г (было ${AC_R1234YF_PROMO_OLD_PLN} zł)`;
}

function acRefrigerantPromoLineEn(): string {
  return `R134a ${acR134aPer100gPln()} PLN/100g (was ${AC_R134A_PROMO_OLD_PLN}) · R1234yf ${acR1234yfPer100gPln()} PLN/100g (was ${AC_R1234YF_PROMO_OLD_PLN})`;
}

function acRefrigerantPromoLineUk(): string {
  return `R134a ${acR134aPer100gPln()} zł/100 г (було ${AC_R134A_PROMO_OLD_PLN} zł) · R1234yf ${acR1234yfPer100gPln()} zł/100 г (було ${AC_R1234YF_PROMO_OLD_PLN} zł)`;
}

export function acPromoMetaTitlePl(): string {
  return `Nabijanie klimatyzacji bez kolejki Warszawa −50% — od ${acRechargeFromPln()} zł`;
}

export function acPromoMetaDescriptionPl(): string {
  return `Nabijanie klimatyzacji w BESS MOTORS Warszawa: wszystkie marki aut, bez kolejki — od razu na miejscu. Promocja −50% — podłączenie ${acHookupPricePln()} zł zamiast ${AC_HOOKUP_PROMO_OLD_PLN} zł, ${acRefrigerantPromoLinePl()}. R134a i R1234yf. Od ${acRechargeFromPln()} zł. Aleja Krakowska — zapis online.`;
}

export function acPromoHeroLinePl(): string {
  return `PROMOCJA −50%: podłączenie ${acHookupPricePln()} zł (było ${AC_HOOKUP_PROMO_OLD_PLN} zł) · ${acRefrigerantPromoLinePl()}`;
}

export function acPromoAccentLinePl(): string {
  return "Wszystkie marki aut · bez kolejki · nabijanie od razu na miejscu";
}

export function acPromoMetaTitleRu(): string {
  return `Заправка кондиционера без очереди Варшава −50% — от ${acRechargeFromPln()} zł`;
}

export function acPromoMetaDescriptionRu(): string {
  return `Заправка кондиционера в BESS MOTORS Варшава: все марки авто, без очереди — сразу на месте. Акция −50% — подключение ${acHookupPricePln()} zł вместо ${AC_HOOKUP_PROMO_OLD_PLN} zł, ${acRefrigerantPromoLineRu()}. R134a и R1234yf. От ${acRechargeFromPln()} zł. Aleja Krakowska — онлайн-запись.`;
}

export function acPromoHeroLineRu(): string {
  return `АКЦИЯ −50%: подключение ${acHookupPricePln()} zł (было ${AC_HOOKUP_PROMO_OLD_PLN} zł) · ${acRefrigerantPromoLineRu()}`;
}

export function acPromoAccentLineRu(): string {
  return "Все марки авто · без очереди · заправка сразу на месте";
}

export function acPromoMetaTitleEn(): string {
  return `A/C recharge no queue Warsaw −50% — from ${acRechargeFromPln()} PLN`;
}

export function acPromoMetaDescriptionEn(): string {
  return `A/C recharge at BESS MOTORS Warsaw: all car makes, no queue — on the spot. Summer −50% promo — hook-up ${acHookupPricePln()} PLN (was ${AC_HOOKUP_PROMO_OLD_PLN}), ${acRefrigerantPromoLineEn()}. R134a and R1234yf. From ${acRechargeFromPln()} PLN. Aleja Krakowska — book online.`;
}

export function acPromoHeroLineEn(): string {
  return `−50% PROMO: hook-up ${acHookupPricePln()} PLN (was ${AC_HOOKUP_PROMO_OLD_PLN}) · ${acRefrigerantPromoLineEn()}`;
}

export function acPromoAccentLineEn(): string {
  return "All car makes · no queue · recharge on the spot";
}

export function acPromoMetaTitleUk(): string {
  return `Заправка кондиціонера без черги Варшава −50% — від ${acRechargeFromPln()} zł`;
}

export function acPromoMetaDescriptionUk(): string {
  return `Заправка кондиціонера в BESS MOTORS Варшава: усі марки авто, без черги — одразу на місці. Акція −50% — підключення ${acHookupPricePln()} zł замість ${AC_HOOKUP_PROMO_OLD_PLN} zł, ${acRefrigerantPromoLineUk()}. R134a і R1234yf. Від ${acRechargeFromPln()} zł. Aleja Krakowska — онлайн-запис.`;
}

export function acPromoHeroLineUk(): string {
  return `АКЦІЯ −50%: підключення ${acHookupPricePln()} zł (було ${AC_HOOKUP_PROMO_OLD_PLN} zł) · ${acRefrigerantPromoLineUk()}`;
}

export function acPromoAccentLineUk(): string {
  return "Усі марки авто · без черги · заправка одразу на місці";
}

export function acRepairMetaTitlePl(): string {
  return "Naprawa klimatyzacji samochodowej Warszawa — BESS MOTORS";
}

export function acRepairMetaDescriptionPl(): string {
  return "Naprawa klimatyzacji samochodowej w Warszawie Włochy: diagnostyka, szczelność obiegu, spawanie przewodów, wymiana sprężarki, chłodnicy i osuszacza. Po naprawie — nabijanie R134a / R1234yf bez kolejki, od razu na miejscu. BESS MOTORS, Aleja Krakowska 48/52.";
}

export const acPromoSeoKeywords = [
  "promocja klimatyzacji Warszawa",
  "promocja nabijanie klimatyzacji",
  "tanie nabijanie klimatyzacji Warszawa",
  "zniżka klimatyzacja samochodowa",
  "nabijanie klimatyzacji promocja",
  "R1234yf Warszawa promocja",
  "nabijanie klimatyzacji samochodowej Warszawa",
  "zaprawa klimatyzacji samochodowej",
  "napełnianie klimatyzacji R134a",
  "napełnianie klimatyzacji R1234yf",
  "nabijanie klimatyzacji bez kolejki",
  "nabijanie klimatyzacji wszystkie marki",
  "nabijanie klimatyzacji od razu",
  "klimatyzacja bez kolejki Warszawa",
  "заправка кондиционера без очереди",
  "заправка кондиционера сразу на месте",
  "заправка кондиционера все марки",
  "заправка кондиционера Варшава без очереди",
  "A/C recharge no queue Warsaw",
  "A/C recharge on the spot",
  "car A/C refill all makes",
  "заправка кондиціонера без черги",
  "заправка кондиціонера одразу на місці",
  "скидка заправка кондиционера Варшава",
  "акция заправка кондиционера",
  "промо заправка кондиционера R1234yf",
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
