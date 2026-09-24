"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Droplets, Gauge, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PromoPriceDisplay } from "@/components/pricing/PromoPriceDisplay";
import {
  FREE_SUSPENSION_DIAG,
  OIL_BRAKE_PROMO_CODE,
  OIL_BRAKE_PROMO_OFFERS,
} from "@/lib/oil-brake-promo";
import { buildBookingUrl } from "@/lib/booking-url";

export function HomePromoBlock() {
  const { t } = useI18n();
  const h = t.homeLead;
  const oil = OIL_BRAKE_PROMO_OFFERS.find((o) => o.id === "oil_filter")!;

  return (
    <section
      className="relative overflow-hidden border-y border-bm-red/35"
      aria-labelledby="home-promo-heading"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 15% 50%, rgba(225,6,0,0.22), transparent 55%), radial-gradient(ellipse 60% 70% at 90% 40%, rgba(16,185,129,0.14), transparent 50%), linear-gradient(180deg, #0c0c0c 0%, #141414 50%, #0a0a0a 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.04) 12px, rgba(255,255,255,0.04) 13px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="inline-flex items-center gap-2 border border-bm-red/50 bg-bm-red/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-bm-red mb-4">
            <Tag size={12} />
            {h.promoBadge} · {OIL_BRAKE_PROMO_CODE}
          </p>
          <h2
            id="home-promo-heading"
            className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white"
          >
            {h.promoTitle}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-bm-silver/90 max-w-2xl leading-relaxed">
            {h.promoSubtitle}
          </p>
        </motion.div>

        <div className="mt-8 grid md:grid-cols-2 gap-4 sm:gap-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="group relative overflow-hidden border border-emerald-500/35 bg-bm-black/55 p-5 sm:p-7"
          >
            <div
              className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-emerald-500/15 blur-2xl transition-opacity group-hover:opacity-100 opacity-70"
              aria-hidden
            />
            <div className="relative">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                <Droplets size={16} />
                {h.oil}
              </p>
              <p className="mt-4 font-display text-5xl sm:text-6xl font-black text-white tracking-tight">
                {oil.nowZl}
                <span className="ml-1 text-2xl sm:text-3xl text-emerald-400">zł</span>
              </p>
              <div className="mt-2">
                <PromoPriceDisplay
                  priceZl={oil.nowZl}
                  compareAtZl={oil.wasZl}
                  priceFrom={false}
                  size="md"
                />
              </div>
              <p className="mt-3 text-sm text-bm-muted">{h.oilNote}</p>
              <BookingLink
                href={buildBookingUrl(["oil_filter"])}
                trackSource="home_promo_oil"
                className="btn-primary mt-6 text-sm inline-flex items-center gap-2"
              >
                {h.promoCtaOil}
                <ChevronRight size={16} />
              </BookingLink>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="group relative overflow-hidden border border-bm-red/40 bg-bm-black/55 p-5 sm:p-7"
          >
            <div
              className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-bm-red/20 blur-2xl transition-opacity group-hover:opacity-100 opacity-70"
              aria-hidden
            />
            <div className="relative">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-bm-red">
                <Gauge size={16} />
                {h.suspension}
              </p>
              <p className="mt-4 font-display text-4xl sm:text-5xl font-black uppercase text-bm-red text-glow tracking-tight">
                {h.suspensionFree}
              </p>
              <div className="mt-2">
                <PromoPriceDisplay
                  priceZl={0}
                  compareAtZl={FREE_SUSPENSION_DIAG.wasZl}
                  priceFrom={false}
                  size="md"
                  priceSuffix=" zł"
                />
              </div>
              <p className="mt-3 text-sm text-bm-muted">{h.suspensionNote}</p>
              <BookingLink
                href={buildBookingUrl([FREE_SUSPENSION_DIAG.bookingItems])}
                trackSource="home_promo_suspension"
                className="btn-outline mt-6 text-sm inline-flex items-center gap-2"
              >
                {h.promoCtaSuspension}
                <ChevronRight size={16} />
              </BookingLink>
            </div>
          </motion.div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href="/promocje"
            className="text-sm font-semibold text-bm-silver hover:text-white transition-colors inline-flex items-center gap-1"
          >
            {h.promoMore}
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
