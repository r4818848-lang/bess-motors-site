"use client";

import Link from "next/link";
import { ChevronRight, Droplets, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { OIL_BRAKE_PROMO_CODE } from "@/lib/oil-brake-promo";
import { buildBookingUrl } from "@/lib/booking-url";

/** Sticky oil/brake promo — homepage, below header (always visible) */
export function OilBrakePromoBar() {
  const { t } = useI18n();
  const p = t.oilBrakePromo;

  return (
    <div
      className="relative z-40 bg-gradient-to-r from-emerald-800 via-emerald-700 to-bm-red text-white border-b border-white/20 shadow-[0_4px_24px_rgba(16,185,129,0.35)]"
      role="region"
      aria-label={p.title}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
          <Tag size={12} className="shrink-0" />
          {p.badge}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm sm:text-base font-display font-bold uppercase tracking-wide">
          <Droplets size={16} className="shrink-0" />
          {p.title}
        </span>
        <span className="hidden md:inline text-xs sm:text-sm font-semibold">
          {p.oil} <span className="line-through opacity-70">150</span>{" "}
          <span className="text-yellow-200">100 zł</span>
          <span className="mx-1.5 opacity-50">·</span>
          {p.padsFront} <span className="line-through opacity-70">120</span>{" "}
          <span className="text-yellow-200">100 zł</span>
        </span>
        <span className="rounded bg-black/25 px-2 py-0.5 text-[10px] sm:text-xs font-bold tracking-wide">
          {p.codeLabel}: {OIL_BRAKE_PROMO_CODE}
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <Link
            href="/promocje"
            className="text-xs sm:text-sm font-semibold underline underline-offset-2 hover:text-white/90"
          >
            {t.promoBanner.cta}
          </Link>
          <BookingLink
            href={buildBookingUrl(["oil_filter"])}
            trackSource="oil_brake_promo_bar"
            className="inline-flex items-center gap-1 rounded-full bg-white text-emerald-800 px-3.5 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide hover:bg-white/95 shadow-md"
          >
            {p.ctaBook}
            <ChevronRight size={14} />
          </BookingLink>
        </div>
      </div>
    </div>
  );
}
