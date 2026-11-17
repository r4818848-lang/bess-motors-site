"use client";

import { HeroVideo } from "@/components/home/HeroVideo";
import { ChevronRight, Phone, FileSearch, Navigation } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { WORKSHOP_DIRECTIONS_URL } from "@/lib/maps";
import { trackGetDirectionsClick } from "@/lib/gtag";

/** Calm hero — brand + CTAs (Final Polish v3 §6–7) */
export function Hero() {
  const { t } = useI18n();
  const h = t.hero;

  return (
    <section className="relative flex items-center overflow-hidden bg-[#08090c] pt-2 pb-8 sm:pb-12 sm:min-h-[58vh]">
      <div className="absolute inset-0 z-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(8,8,8,0.94) 0%, rgba(8,8,8,0.78) 45%, rgba(8,8,8,0.35) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bm-black via-transparent to-bm-black/40" />
        <div className="bm-hero-sweep" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8 w-full py-8 sm:py-12">
        <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:items-center">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bm-red">BESS MOTORS</p>
          <h1 className="mt-3 font-display font-bold tracking-tight text-[2.125rem] leading-[1.1] sm:text-5xl md:text-[3.5rem] text-white">
            {h.h1Short}
          </h1>
          <div className="mt-4 h-1 w-16 bg-bm-red" />

          <p className="mt-4 text-base sm:text-lg text-white/90 max-w-xl leading-relaxed">
            {h.subtitleClean}
          </p>

          <p className="mt-3 text-sm text-bm-silver">{h.servicesLine}</p>

          <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
            <BookingLink
              trackSource="hero"
              className="btn-primary inline-flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              {h.ctaBook}
              <ChevronRight size={16} />
            </BookingLink>
            <a
              href="#wyceń-po-vin"
              className="btn-outline inline-flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <FileSearch size={16} />
              {h.ctaVinShort}
            </a>
            <PhoneLink
              trackSource="hero_cta"
              className="btn-outline inline-flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <Phone size={16} />
              {h.ctaCall}
            </PhoneLink>
            <a
              href={WORKSHOP_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGetDirectionsClick("hero")}
              className="btn-outline inline-flex items-center justify-center gap-2 uppercase tracking-wide"
            >
              <Navigation size={16} />
              {t.stickyBar.route}
            </a>
          </div>
        </div>
          <div className="order-first overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_24px_60px_rgba(0,0,0,0.45)] lg:order-last">
            <HeroVideo />
          </div>
        </div>
      </div>
    </section>
  );
}
