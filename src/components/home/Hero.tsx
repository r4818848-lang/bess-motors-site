"use client";

import Image from "next/image";
import { ChevronRight, Phone, FileSearch } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { SITE_NAP } from "@/lib/site-nap";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";

/** Calm hero — one photo, one H1, 2–3 CTAs (TZ §10–12) */
export function Hero() {
  const { t } = useI18n();
  const h = t.hero;

  return (
    <section className="relative flex items-end sm:items-center overflow-hidden pt-2 pb-8 sm:pb-12 sm:min-h-[62vh]">
      <div className="absolute inset-0 z-0" aria-hidden>
        <Image
          src={siteConfig.bannerImage}
          alt="BESS MOTORS — serwis samochodowy Warszawa Włochy"
          fill
          priority
          className="object-cover object-[72%_42%] sm:object-[75%_40%]"
          sizes="100vw"
          quality={85}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(8,8,8,0.94) 0%, rgba(8,8,8,0.78) 45%, rgba(8,8,8,0.35) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bm-black via-transparent to-bm-black/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-8 w-full py-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-sm text-bm-silver mb-3">
            {SITE_NAP.addressLine} · {SITE_NAP.workingHoursLabel}
          </p>

          <h1 className="font-display font-bold tracking-tight text-[2.125rem] leading-[1.1] sm:text-5xl md:text-[3.5rem] text-white">
            {h.h1Short}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-white/90 max-w-xl leading-relaxed">
            {h.subtitleClean}
          </p>

          <p className="mt-3 text-sm text-bm-silver">{h.servicesLine}</p>
          <p className="mt-2 text-sm font-medium text-bm-silver/90">{h.highlightAirport}</p>

          <PhoneLink
            trackSource="hero_phone"
            className="mt-5 inline-block text-2xl sm:text-3xl font-bold text-white hover:text-bm-red transition-colors tracking-wide"
          >
            {SITE_NAP.phoneDisplay}
          </PhoneLink>

          <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
            <BookingLink
              trackSource="hero"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              {h.ctaBook}
              <ChevronRight size={16} />
            </BookingLink>
            <a
              href="#wyceń-po-vin"
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <FileSearch size={16} />
              {h.ctaVinShort}
            </a>
            <PhoneLink
              trackSource="hero_cta"
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <Phone size={16} />
              {h.ctaCall}
            </PhoneLink>
          </div>
        </div>
      </div>
    </section>
  );
}
