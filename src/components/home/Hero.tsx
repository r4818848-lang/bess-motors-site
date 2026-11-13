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
    <section className="relative -mt-14 overflow-hidden pb-12 pt-24 sm:-mt-16 sm:flex sm:min-h-[100svh] sm:items-center sm:pb-16 sm:pt-28">
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

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-28 lg:px-8 sm:pt-32">
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

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70">
          <PhoneLink trackSource="hero_cta" className="inline-flex items-center gap-2 hover:text-white">
            <Phone size={14} aria-hidden />
            {SITE_NAP.phoneDisplay}
          </PhoneLink>
          <a
            href={WORKSHOP_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGetDirectionsClick("hero")}
            className="inline-flex items-center gap-2 hover:text-white"
          >
            <Navigation size={14} aria-hidden />
            {t.stickyBar.route}
          </a>
          <a href="#wyceń-po-vin" className="hover:text-white">
            {h.ctaVinShort}
          </a>
        </div>
      </div>
    </section>
  );
}
