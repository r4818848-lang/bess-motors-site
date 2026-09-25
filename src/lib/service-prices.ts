/**
 * Central service pricing for display / SEO / promos.
 * Catalog numbers live in price-list.ts; labour promos in oil-brake-promo.ts.
 * Use this module for any customer-facing price string so oil/brakes/AC never drift.
 */
import { getPriceItem } from "@/lib/price-list";
import {
  FREE_SUSPENSION_DIAG,
  getOilBrakePromoOffer,
  OIL_BRAKE_PROMO_CODE,
  OIL_BRAKE_PROMO_VALID_UNTIL,
  OIL_CHANGE_PROMO_BOOKING_ITEMS,
} from "@/lib/oil-brake-promo";
import { acHookupPricePln, acRechargeFromPln } from "@/lib/ac-recharge-prices";

export type ServicePriceId =
  | "oil_filter"
  | "brake_pads_front"
  | "brake_disc_front"
  | "brake_pads_rear"
  | "brake_disc_rear"
  | "suspension_diag"
  | "ac_hookup"
  | "computer_diag";

export type ServicePriceRecord = {
  id: ServicePriceId;
  slug: string;
  namePl: string;
  category: string;
  basePrice: number;
  promoPrice?: number;
  pricePrefix: "od" | "fixed";
  durationHintPl?: string;
  descriptionPl?: string;
  promotionStart?: string;
  promotionEnd?: string;
  active: boolean;
  bookingServiceId?: string;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isPromoActive(start?: string, end?: string, today = todayIsoDate()): boolean {
  if (start && today < start) return false;
  if (end && today > end) return false;
  return true;
}

function oilLabour(): ServicePriceRecord {
  const offer = getOilBrakePromoOffer("oil_filter");
  const catalog = getPriceItem("oil_filter");
  const promoActive = isPromoActive(undefined, OIL_BRAKE_PROMO_VALID_UNTIL);
  const promoPrice = promoActive ? (offer?.nowZl ?? catalog?.basePrice ?? 80) : undefined;
  const basePrice = offer?.wasZl ?? catalog?.listPrice ?? catalog?.basePrice ?? 150;
  return {
    id: "oil_filter",
    slug: "wymiana-oleju",
    namePl: "Wymiana oleju i filtra oleju",
    category: "oil",
    basePrice,
    promoPrice,
    pricePrefix: "fixed",
    durationHintPl: "ok. 1 godziny",
    descriptionPl: `Robocizna. Olej i filtr osobno pod VIN. Kod ${OIL_BRAKE_PROMO_CODE}.`,
    promotionEnd: OIL_BRAKE_PROMO_VALID_UNTIL,
    active: true,
    bookingServiceId: "oil_filter",
  };
}

function brake(id: "brake_pads_front" | "brake_disc_front" | "brake_pads_rear" | "brake_disc_rear", slug: string, namePl: string): ServicePriceRecord {
  const offer = getOilBrakePromoOffer(id);
  const catalog = getPriceItem(id);
  const promoActive = isPromoActive(undefined, OIL_BRAKE_PROMO_VALID_UNTIL);
  return {
    id,
    slug,
    namePl,
    category: "brakes",
    basePrice: offer?.wasZl ?? catalog?.listPrice ?? catalog?.basePrice ?? 0,
    promoPrice: promoActive ? offer?.nowZl : undefined,
    pricePrefix: "fixed",
    durationHintPl: "1–2 godziny",
    promotionEnd: OIL_BRAKE_PROMO_VALID_UNTIL,
    active: true,
    bookingServiceId: id,
  };
}

/**
 * Seasonal A/C −50% promo retired (Final Polish v3).
 * Kept as API stubs so callers compile; always inactive.
 */
export const AC_SUMMER_PROMO_END = "2020-01-01";

export function isAcSummerPromoActive(_today = todayIsoDate()): boolean {
  return false;
}

export const SERVICE_PRICES: ServicePriceRecord[] = [
  oilLabour(),
  brake("brake_pads_front", "hamulce", "Klocki hamulcowe przód"),
  brake("brake_disc_front", "hamulce", "Tarcze + klocki przód"),
  brake("brake_pads_rear", "hamulce", "Klocki hamulcowe tył"),
  brake("brake_disc_rear", "hamulce", "Tarcze + klocki tył"),
  {
    id: "suspension_diag",
    slug: "zawieszenie",
    namePl: "Diagnostyka zawieszenia",
    category: "suspension",
    basePrice: FREE_SUSPENSION_DIAG.wasZl,
    /** Free only in package with oil — standalone uses catalog */
    promoPrice: undefined,
    pricePrefix: "fixed",
    durationHintPl: "ok. 30–40 min",
    descriptionPl: "Gratis tylko razem z wymianą oleju w promocji.",
    promotionEnd: OIL_BRAKE_PROMO_VALID_UNTIL,
    active: true,
    bookingServiceId: "suspension_diag",
  },
  {
    id: "ac_hookup",
    slug: "klimatyzacja",
    namePl: "Podłączenie stacji klimatyzacji",
    category: "ac",
    basePrice: acHookupPricePln(),
    pricePrefix: "fixed",
    durationHintPl: "ok. 1 godziny",
    active: true,
    bookingServiceId: "ac_hookup",
  },
  {
    id: "computer_diag",
    slug: "diagnostyka",
    namePl: "Diagnostyka komputerowa",
    category: "diagnostic",
    basePrice: getPriceItem("computer_diag")?.basePrice ?? 150,
    pricePrefix: "od",
    durationHintPl: "ok. 30–60 min",
    active: true,
    bookingServiceId: "computer_diag",
  },
];

export function getServicePrice(id: ServicePriceId): ServicePriceRecord | undefined {
  return SERVICE_PRICES.find((s) => s.id === id);
}

export function displayPriceZl(record: ServicePriceRecord): number {
  return record.promoPrice ?? record.basePrice;
}

export function formatServicePricePl(record: ServicePriceRecord): string {
  const price = displayPriceZl(record);
  if (record.pricePrefix === "od") return `od ${price} zł`;
  return `${price} zł`;
}

/** Canonical oil labour promo for any UI/SEO string */
export function oilLabourPromoZl(): number {
  return displayPriceZl(oilLabour());
}

export function oilLabourWasZl(): number {
  return oilLabour().basePrice;
}

export function oilChangeBookingItems(): string[] {
  return [...OIL_CHANGE_PROMO_BOOKING_ITEMS];
}

export function acFromPriceDisplayZl(): number {
  return acRechargeFromPln();
}

export { OIL_BRAKE_PROMO_CODE, OIL_BRAKE_PROMO_VALID_UNTIL };
