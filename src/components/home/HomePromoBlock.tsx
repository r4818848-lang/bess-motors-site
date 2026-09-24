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

/** Special offer — oil 80 zł labour + free suspension with oil (TZ §14–16) */
export function HomePromoBlock() {
  const { t } = useI18n();
  const h = t.homeLead;
  const oil = OIL_BRAKE_PROMO_OFFERS.find((o) => o.id === "oil_filter")!;

  if (!isPromoActive(undefined, OIL_BRAKE_PROMO_VALID_UNTIL)) return null;

  return (
    <section className="py-12 sm:py-16 border-y border-white/10 bg-bm-surface" aria-labelledby="oil-offer-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bm-red mb-3">
          {h.offerBadge} · {OIL_BRAKE_PROMO_CODE}
        </p>
        <div className="grid lg:grid-cols-[1.2fr_auto] gap-8 items-center">
          <div>
            <h2
              id="oil-offer-heading"
              className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight"
            >
              {h.oil}
            </h2>
            <p className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
                {oil.nowZl}
                <span className="ml-1 text-2xl text-bm-silver">zł</span>
              </span>
              <span className="text-lg text-bm-muted line-through">{oil.wasZl} zł</span>
            </p>
            <p className="mt-1 text-sm text-bm-silver">{h.labourLabel}</p>
            <ul className="mt-5 space-y-2 text-sm text-bm-silver">
              <li className="flex items-start gap-2">
                <Droplets size={16} className="text-bm-red mt-0.5 shrink-0" />
                {h.oilNote}
              </li>
              <li className="flex items-start gap-2">
                <Gauge size={16} className="text-bm-red mt-0.5 shrink-0" />
                <span>
                  <span className="text-white font-medium">{h.suspension}</span>
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
            className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {h.bookSlot}
            <ChevronRight size={16} />
          </BookingLink>
        </div>
      </div>
    </section>
  );
}
