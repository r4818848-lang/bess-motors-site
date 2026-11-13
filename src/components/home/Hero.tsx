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
 * Studio posters for the three-car test on this branch. The film is not wired in.
 * The phone loads the wide frame. Desktop loads its own frame. See docs/cinematic-hero-v2.md.
 */
export function Hero() {
  const { t } = useI18n();
  const h = t.hero;

  return (
    <section className="relative isolate -mt-14 flex flex-col overflow-hidden bg-[#07080b] pb-[calc(4.75rem+env(safe-area-inset-bottom))] pt-16 sm:-mt-16 sm:pt-20 lg:block lg:min-h-[78vh] lg:pb-16 lg:pt-24">
      <picture className="order-2 px-4 lg:absolute lg:inset-0 lg:z-0 lg:px-0">
        <source media="(min-width: 1024px)" srcSet="/hero/v8-desktop.webp" type="image/webp" />
        <img
          src="/hero/v8-wide.webp"
          alt=""
          width={1600}
          height={900}
          fetchPriority="high"
          className="mt-4 h-auto w-full lg:mt-0 lg:h-full lg:origin-right lg:scale-[0.86] lg:object-cover lg:object-[72%_16%]"
        />
      </picture>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-[min(30rem,34%)] bg-gradient-to-r from-[#07080b] from-8% via-[#07080b]/55 via-42% to-transparent lg:block"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden h-16 bg-gradient-to-t from-[#07080b] to-transparent lg:block" aria-hidden />

      <div className="relative z-10 order-1 w-full px-4 pt-6 lg:px-10 lg:pt-10">
        <div className="max-w-xl lg:max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-bm-ink">BESS MOTORS</p>
          <h1 className="mt-4 max-w-[12ch] font-display text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:max-w-none sm:text-5xl lg:text-[3.15rem]">
            {h.h1Short}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{h.subtitleClean}</p>
          <p className="mt-3 max-w-xl text-sm text-white/55">{h.servicesLine}</p>
        </div>
      </div>

      <div className="relative z-10 order-3 w-full px-4 pb-2 lg:px-10 lg:pb-6">
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row lg:mt-8">
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

        <div className="mt-5 hidden flex-col gap-1 text-sm text-white/80 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 lg:flex">
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
