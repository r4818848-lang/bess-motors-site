import { buildCartLine, type CartLine } from "@/lib/booking-cart";
import { getPriceItem } from "@/lib/price-list";
import { itemLabel } from "@/lib/service-price-map";
import type { Locale } from "@/lib/i18n/types";

export const AC_HOOKUP_PRICE_ID = "ac_hookup";
export const AC_R134A_PRICE_ID = "ac_r134a";

export function acHookupPricePln(): number {
  return getPriceItem(AC_HOOKUP_PRICE_ID)?.basePrice ?? 80;
}

export function acR134aPer100gPln(): number {
  return getPriceItem(AC_R134A_PRICE_ID)?.basePrice ?? 60;
}

/** Minimum estimate: connection + 100 g R134a */
export function acRechargeFromPln(): number {
  return acHookupPricePln() + acR134aPer100gPln();
}

export function defaultAcRechargeCartLines(locale: Locale): CartLine[] {
  const lines: CartLine[] = [];
  const hookup = getPriceItem(AC_HOOKUP_PRICE_ID);
  const gas = getPriceItem(AC_R134A_PRICE_ID);
  if (hookup) {
    lines.push(buildCartLine(hookup, itemLabel(hookup, locale), 1));
  }
  if (gas) {
    lines.push(buildCartLine(gas, itemLabel(gas, locale), 1));
  }
  return lines;
}

export const AC_RECHARGE_PRICE_ITEM_IDS = [AC_HOOKUP_PRICE_ID, AC_R134A_PRICE_ID] as const;
