"use client";

import { Droplets, Gauge, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import {
  OIL_BRAKE_PROMO_CODE,
  OIL_BRAKE_PROMO_OFFERS,
  OIL_CHANGE_PROMO_BOOKING_ITEMS,
} from "@/lib/oil-brake-promo";
import { buildBookingUrl } from "@/lib/booking-url";
import { isPromoActive, OIL_BRAKE_PROMO_VALID_UNTIL } from "@/lib/service-prices";

/** Single oil promo block — 80 zł labour + free suspension (Final Polish v3 §2/§10) */
export function HomePromoBlock() {
  const { t } = useI18n();
  const h = t.homeLead;
  const oil = OIL_BRAKE_PROMO_OFFERS.find((o) => o.id === "oil_filter")!;

  if (!isPromoActive(undefined, OIL_BRAKE_PROMO_VALID_UNTIL)) return null;

  return (
    <section
      id="oferta-olej"
      className="relative z-20 border-y border-white/10 bg-bm-black"
      aria-labelledby="oil-offer-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 sm:py-10">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-bm-red mb-2 sm:mb-3">
          {h.offerBadge} · {OIL_BRAKE_PROMO_CODE}
        </p>

        <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-center">
          <div>
            <h2
              id="oil-offer-heading"
              className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight"
            >
              {h.oil}
            </h2>

            <p className="mt-3 sm:mt-4 flex items-baseline gap-3 flex-wrap">
              <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-none">
                {oil.nowZl}
                <span className="ml-1.5 text-2xl sm:text-3xl text-white/90 font-bold">zł</span>
              </span>
              {oil.wasZl > oil.nowZl ? (
                <span className="text-lg sm:text-xl text-bm-muted line-through decoration-bm-muted/80">
                  {oil.wasZl} zł
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-bm-silver">{h.labourLabel}</p>

            <ul className="mt-4 sm:mt-5 space-y-2 text-sm sm:text-[15px] text-bm-silver">
              <li className="flex items-start gap-2.5">
                <Droplets size={16} className="text-bm-red mt-0.5 shrink-0" aria-hidden />
                <span>{h.oilNote}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Gauge size={16} className="text-bm-red mt-0.5 shrink-0" aria-hidden />
                <span>
                  <span className="text-white font-semibold">{h.suspension}</span>
                  {" — "}
                  {h.suspensionFree}
                </span>
              </li>
            </ul>

            <p className="mt-3 text-xs text-bm-muted">{h.materialsNote}</p>
          </div>

          <BookingLink
            href={buildBookingUrl([...OIL_CHANGE_PROMO_BOOKING_ITEMS])}
            trackSource="home_promo_oil_package"
            className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto lg:min-w-[12.5rem] uppercase tracking-wide text-sm font-semibold px-8 py-3.5"
          >
            {h.bookSlot}
            <ChevronRight size={16} aria-hidden />
          </BookingLink>
        </div>
      </div>
    </section>
  );
}
