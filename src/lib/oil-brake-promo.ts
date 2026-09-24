import { SITE_PROMO_DISPLAY } from "@/lib/promo-codes";

/** Fixed labour promo — code BessMotors. Oil & brakes. */
export const OIL_BRAKE_PROMO_CODE = SITE_PROMO_DISPLAY;

export type OilBrakePromoId =
  | "oil_filter"
  | "brake_pads_front"
  | "brake_disc_front"
  | "brake_pads_rear"
  | "brake_disc_rear";

export type OilBrakePromoOffer = {
  id: OilBrakePromoId;
  /** Regular / previous labour price (crossed out) */
  wasZl: number;
  /** Promo labour price now */
  nowZl: number;
  bookingItems: string;
};

export const OIL_BRAKE_PROMO_OFFERS: OilBrakePromoOffer[] = [
  {
    id: "oil_filter",
    wasZl: 150,
    nowZl: 80,
    bookingItems: "oil_filter",
  },
  {
    id: "brake_pads_front",
    wasZl: 120,
    nowZl: 100,
    bookingItems: "brake_pads_front",
  },
  {
    id: "brake_disc_front",
    wasZl: 220,
    nowZl: 150,
    bookingItems: "brake_disc_front",
  },
  {
    id: "brake_pads_rear",
    wasZl: 150,
    nowZl: 120,
    bookingItems: "brake_pads_rear",
  },
  {
    id: "brake_disc_rear",
    wasZl: 280,
    nowZl: 180,
    bookingItems: "brake_disc_rear",
  },
];

const BY_ID = Object.fromEntries(
  OIL_BRAKE_PROMO_OFFERS.map((o) => [o.id, o])
) as Record<OilBrakePromoId, OilBrakePromoOffer>;

export function isOilBrakePromoItem(id: string): id is OilBrakePromoId {
  return id in BY_ID;
}

export function getOilBrakePromoOffer(id: string): OilBrakePromoOffer | undefined {
  return isOilBrakePromoItem(id) ? BY_ID[id] : undefined;
}

/** Free suspension diagnostics only together with oil-change promo booking */
export const FREE_SUSPENSION_DIAG = {
  id: "suspension_diag" as const,
  wasZl: 150,
  nowZl: 0,
  bookingItems: "suspension_diag",
};

/** Package: oil labour promo + free suspension check */
export const OIL_CHANGE_PROMO_BOOKING_ITEMS = [
  "oil_filter",
  FREE_SUSPENSION_DIAG.id,
] as const;

/** Comment line for CRM / Telegram when client books promo services */
export function oilBrakePromoBookingNote(itemIds: string[]): string | null {
  const hasOil = itemIds.includes("oil_filter");
  const hit = itemIds.some((id) => isOilBrakePromoItem(id));
  if (!hit && !hasOil) return null;
  if (hasOil) {
    return `PROMO ${OIL_BRAKE_PROMO_CODE}: wymiana oleju 80 zł robocizna + diagnostyka zawieszenia BEZPŁATNIE (w pakiecie z olejem). Hamulce: klocki przód 100 / tarcze+klocki 150 / klocki tył 120 / tarcze+klocki tył 180 zł.`;
  }
  return `PROMO ${OIL_BRAKE_PROMO_CODE}: olej/hamulce — klient prosi o ceny promocji (olej 80 / klocki przód 100 / tarcze+klocki przód 150 / klocki tył 120 / tarcze+klocki tył 180 zł robocizna)`;
}

export function oilBrakePromoMetaTitlePl(): string {
  return `Wymiana oleju 80 zł · zawieszenie gratis przy oleju — kod ${OIL_BRAKE_PROMO_CODE} Warszawa`;
}

export function oilBrakePromoMetaDescriptionPl(): string {
  return `Promocja kod ${OIL_BRAKE_PROMO_CODE}: wymiana oleju i filtra 80 zł (było 150) + bezpłatna diagnostyka zawieszenia przy wymianie oleju. Klocki od 100 zł. BESS MOTORS Warszawa Włochy.`;
}

export function brakesPromoMetaTitlePl(): string {
  return `Klocki i tarcze w promocji — kod ${OIL_BRAKE_PROMO_CODE} | Warszawa`;
}

export function brakesPromoMetaDescriptionPl(): string {
  return `Promocja ${OIL_BRAKE_PROMO_CODE}: klocki przednie 100 zł (było 120), tarcze+klocki przód 150 zł (było 220), klocki tył 120 zł (było 150), tarcze+klocki tył 180 zł (było 280). Serwis hamulców BESS MOTORS Warszawa.`;
}

export function oilPromoMetaTitlePl(): string {
  return `Wymiana oleju Warszawa 80 zł | filtr + zawieszenie gratis`;
}

export function oilPromoMetaDescriptionPl(): string {
  return `Wymiana oleju i filtra w Warszawie (Włochy, Aleja Krakowska 48/52): 80 zł robocizny zamiast 150 zł. Diagnostyka zawieszenia gratis przy wymianie oleju. Olej pod VIN. Kod ${OIL_BRAKE_PROMO_CODE}. Zapis online.`;
}

export const OIL_BRAKE_PROMO_VALID_UNTIL = "2026-12-31";

const OFFER_NAMES_PL: Record<OilBrakePromoId, string> = {
  oil_filter: "Wymiana oleju i filtra oleju",
  brake_pads_front: "Wymiana klocków przednich",
  brake_disc_front: "Wymiana tarcz i klocków przednich",
  brake_pads_rear: "Wymiana klocków tylnych",
  brake_disc_rear: "Wymiana tarcz i klocków tylnych",
};

export function oilBrakePromoOfferSchema(siteUrl: string, offer: OilBrakePromoOffer) {
  return {
    "@type": "Offer" as const,
    name: OFFER_NAMES_PL[offer.id],
    description: `Promocja kod ${OIL_BRAKE_PROMO_CODE}: ${offer.nowZl} zł (było ${offer.wasZl} zł) — robocizna`,
    price: offer.nowZl,
    priceCurrency: "PLN",
    availability: "https://schema.org/InStock",
    url: `${siteUrl}/booking?items=${offer.bookingItems}`,
    priceValidUntil: OIL_BRAKE_PROMO_VALID_UNTIL,
  };
}

export function oilBrakePromoCatalogSchema(siteUrl: string) {
  return {
    "@type": "OfferCatalog" as const,
    name: `Promocja olej i hamulce — kod ${OIL_BRAKE_PROMO_CODE}`,
    itemListElement: OIL_BRAKE_PROMO_OFFERS.map((offer, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      item: oilBrakePromoOfferSchema(siteUrl, offer),
    })),
  };
}
