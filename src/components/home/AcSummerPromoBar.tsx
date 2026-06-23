"use client";

import Link from "next/link";
import { Snowflake, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";

/** Sticky summer A/C promo — homepage only, below header */
export function AcSummerPromoBar() {
  const { t } = useI18n();
  const s = t.seasonalAc;

  return (
    <div
      className="relative z-40 bg-gradient-to-r from-bm-red via-[#c80500] to-bm-red text-white border-b border-white/20 shadow-[0_4px_28px_rgba(225,6,0,0.45)]"
      role="region"
      aria-label={s.title}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-5 gap-y-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
          <Snowflake size={12} className="shrink-0" />
          {s.badge}
        </span>
        <span className="text-sm sm:text-base font-display font-bold uppercase tracking-wide">
          {s.title}
        </span>
        <span className="text-xs sm:text-sm font-semibold text-white/95 bg-black/20 rounded-lg px-2.5 py-1">
          {s.priceFrom}
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <Link
            href="/klimatyzacja"
            className="text-xs sm:text-sm font-semibold underline underline-offset-2 hover:text-white/90"
          >
            {s.ctaLearn}
          </Link>
          <BookingLink
            href="/booking"
            trackSource="ac_promo_bar"
            className="inline-flex items-center gap-1 rounded-full bg-white text-bm-red px-3.5 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide hover:bg-white/95 shadow-md"
          >
            {s.ctaBook}
            <ChevronRight size={14} />
          </BookingLink>
        </div>
      </div>
    </div>
  );
}
