"use client";

import Link from "next/link";
import { ChevronRight, Droplets, Disc, Snowflake, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PromoPriceDisplay } from "@/components/pricing/PromoPriceDisplay";
import { OIL_BRAKE_PROMO_CODE, OIL_BRAKE_PROMO_OFFERS } from "@/lib/oil-brake-promo";
import { acRechargeFromPln } from "@/lib/ac-recharge-prices";
import { buildBookingUrl } from "@/lib/booking-url";

export function HomePromoBlock() {
  const { t } = useI18n();
  const h = t.homeLead;
  const oil = OIL_BRAKE_PROMO_OFFERS.find((o) => o.id === "oil_filter")!;
  const pads = OIL_BRAKE_PROMO_OFFERS.find((o) => o.id === "brake_pads_front")!;

  return (
    <section
      className="border-y border-bm-red/40 bg-gradient-to-r from-emerald-950/30 via-bm-card to-bm-red/20"
      aria-labelledby="home-promo-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 sm:py-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-bm-red/50 bg-bm-red/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-bm-red mb-4">
          <Tag size={12} />
          {h.promoBadge} · {OIL_BRAKE_PROMO_CODE}
        </p>
        <h2
          id="home-promo-heading"
          className="font-display text-2xl sm:text-3xl font-bold uppercase text-glow leading-tight"
        >
          {h.promoTitle}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-bm-silver/90 max-w-2xl">{h.promoSubtitle}</p>

        <ul className="mt-6 grid sm:grid-cols-3 gap-3">
          <li className="rounded-xl border border-emerald-500/30 bg-bm-black/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Droplets size={16} className="text-emerald-400" />
              {h.oil}
            </p>
            <div className="mt-2">
              <PromoPriceDisplay
                priceZl={oil.nowZl}
                compareAtZl={oil.wasZl}
                priceFrom={false}
                size="md"
              />
            </div>
          </li>
          <li className="rounded-xl border border-bm-border/60 bg-bm-black/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Disc size={16} className="text-bm-red" />
              {h.pads}
            </p>
            <div className="mt-2">
              <PromoPriceDisplay
                priceZl={pads.nowZl}
                compareAtZl={pads.wasZl}
                priceFrom={true}
                size="md"
              />
            </div>
          </li>
          <li className="rounded-xl border border-sky-500/30 bg-bm-black/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Snowflake size={16} className="text-sky-400" />
              {h.ac}
            </p>
            <div className="mt-2">
              <PromoPriceDisplay
                priceZl={acRechargeFromPln()}
                compareAtZl={260}
                priceFrom={true}
                size="md"
              />
            </div>
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <BookingLink
            href={buildBookingUrl(["oil_filter"])}
            trackSource="home_promo_book"
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            {h.promoCta}
            <ChevronRight size={16} />
          </BookingLink>
          <Link href="/promocje" className="btn-outline text-sm">
            {h.promoMore}
          </Link>
        </div>
      </div>
    </section>
  );
}
