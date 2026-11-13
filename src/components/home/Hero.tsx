"use client";

import Link from "next/link";
import { ChevronRight, Phone, Navigation } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { WORKSHOP_DIRECTIONS_URL } from "@/lib/maps";
import { trackGetDirectionsClick } from "@/lib/gtag";
import { SITE_NAP } from "@/lib/site-nap";

/**
 * Full-bleed studio hero. The old ad banner and the boxed SVG car are gone.
 * A licensed realistic sedan is not in this scene — see docs/cinematic-hero-v2.md.
 */
export function Hero() {
  const { t } = useI18n();
  const h = t.hero;

  return (
    <section className="relative -mt-14 overflow-hidden pb-[calc(4.75rem+env(safe-area-inset-bottom))] pt-20 sm:-mt-16 md:pb-10 lg:flex lg:min-h-[70vh] lg:items-center lg:pb-16 lg:pt-24">
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[#07080b]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 70% at 78% 58%, rgba(186,196,210,0.16), transparent 62%), radial-gradient(ellipse 40% 45% at 12% 80%, rgba(225,6,0,0.16), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[42%]"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(255,255,255,0.035) 18%, rgba(255,255,255,0.02) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-[28%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-[#07080b]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-[#07080b]/70" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-4 pt-8 lg:px-8 lg:pb-8 lg:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bm-ink">BESS MOTORS</p>
        <h1 className="mt-4 max-w-4xl font-display text-[2.15rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-6xl md:text-[4.25rem]">
          {h.h1Short}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{h.subtitleClean}</p>
        <p className="mt-3 max-w-xl text-sm text-white/55">{h.servicesLine}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <BookingLink
            trackSource="hero"
            className="btn-primary inline-flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            {h.ctaBook}
            <ChevronRight size={16} />
          </BookingLink>
          <Link
            href="/services"
            className="btn-outline inline-flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            {h.ctaExplore}
          </Link>
        </div>

        <div className="mt-5 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 text-sm text-white/80">
          <PhoneLink
            trackSource="hero_cta"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 hover:text-white"
          >
            <Phone size={16} aria-hidden />
            {SITE_NAP.phoneDisplay}
          </PhoneLink>
          <a
            href={WORKSHOP_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGetDirectionsClick("hero")}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 hover:text-white"
          >
            <Navigation size={16} aria-hidden />
            {t.stickyBar.route}
          </a>
          <a href="#wyceń-po-vin" className="inline-flex min-h-[44px] items-center rounded-lg px-2 hover:text-white">
            {h.ctaVinShort}
          </a>
        </div>
      </div>
    </section>
  );
}
