"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Droplets, Disc, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PromoPriceDisplay } from "@/components/pricing/PromoPriceDisplay";
import {
  OIL_BRAKE_PROMO_CODE,
  OIL_BRAKE_PROMO_OFFERS,
} from "@/lib/oil-brake-promo";
import { OIL_CHANGE_DRAIN_POSTER_SRC } from "@/lib/oil-media";
import { BRAKE_PADS_CHANGE_PHOTO_SRC } from "@/lib/brake-media";
import { buildBookingUrl } from "@/lib/booking-url";

export function OilBrakePromoBanner() {
  const { t } = useI18n();
  const p = t.oilBrakePromo;

  const labels: Record<string, string> = {
    oil_filter: p.oil,
    brake_pads_front: p.padsFront,
    brake_disc_front: p.discFront,
    brake_pads_rear: p.padsRear,
    brake_disc_rear: p.discRear,
  };

  return (
    <section
      className="relative border-y border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-bm-card to-bm-red/15 overflow-hidden"
      aria-labelledby="oil-brake-promo-heading"
    >
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_20%_40%,rgba(16,185,129,0.25),transparent_50%)]" />
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 sm:py-10 relative">
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-4">
              <Tag size={12} />
              {p.badge}
            </p>
            <h2
              id="oil-brake-promo-heading"
              className="font-display text-2xl sm:text-3xl font-bold uppercase text-glow leading-tight"
            >
              {p.title}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-bm-silver/90 max-w-2xl leading-relaxed">
              {p.subtitle.replace("{code}", OIL_BRAKE_PROMO_CODE)}
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-bm-red/50 bg-bm-red/15 px-3 py-2 text-sm font-bold text-white">
              <span className="text-bm-muted font-normal uppercase text-[10px] tracking-wider">
                {p.codeLabel}
              </span>
              <span className="text-bm-red tracking-wide">{OIL_BRAKE_PROMO_CODE}</span>
            </p>

            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {OIL_BRAKE_PROMO_OFFERS.map((offer) => (
                <li
                  key={offer.id}
                  className="rounded-xl border border-bm-border/60 bg-bm-black/40 p-3 sm:p-4"
                >
                  <div className="flex items-start gap-2 mb-2">
                    {offer.id === "oil_filter" ? (
                      <Droplets size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Disc size={16} className="text-bm-red shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-semibold text-white leading-snug">
                      {labels[offer.id]}
                    </p>
                  </div>
                  <PromoPriceDisplay
                    priceZl={offer.nowZl}
                    compareAtZl={offer.wasZl}
                    priceFrom={false}
                    size="md"
                  />
                  <BookingLink
                    href={buildBookingUrl([offer.bookingItems])}
                    trackSource={`oil_brake_promo_${offer.id}`}
                    className="mt-3 inline-flex text-xs font-bold uppercase text-bm-red hover:underline items-center gap-1"
                  >
                    {p.bookItem}
                    <ChevronRight size={12} />
                  </BookingLink>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs text-bm-muted max-w-2xl">{p.note}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <BookingLink
                href={buildBookingUrl(["oil_filter"])}
                trackSource="oil_brake_promo_banner"
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                {p.ctaBook}
                <ChevronRight size={16} />
              </BookingLink>
              <Link href="/wymiana-oleju" className="btn-outline text-sm">
                {p.ctaOil}
              </Link>
              <Link href="/hamulce" className="btn-outline text-sm">
                {p.ctaBrakes}
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-3 w-44 xl:w-52">
            <Link
              href="/wymiana-oleju"
              className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-emerald-500/30 shadow-neon-sm hover:scale-[1.02] transition-transform"
            >
              <Image
                src={OIL_CHANGE_DRAIN_POSTER_SRC}
                alt={p.oil}
                fill
                sizes="208px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 text-[10px] font-bold uppercase text-white text-center">
                {p.oil} · 100 zł
              </span>
            </Link>
            <Link
              href="/hamulce"
              className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-bm-red/40 shadow-neon-sm hover:scale-[1.02] transition-transform"
            >
              <Image
                src={BRAKE_PADS_CHANGE_PHOTO_SRC}
                alt={p.padsFront}
                fill
                sizes="208px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 text-[10px] font-bold uppercase text-white text-center">
                {p.padsFront} · 100 zł
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
