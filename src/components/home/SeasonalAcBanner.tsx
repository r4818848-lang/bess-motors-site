"use client";

import Link from "next/link";
import Image from "next/image";
import { Snowflake, ChevronRight, Wind } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";

export function SeasonalAcBanner() {
  const { t } = useI18n();
  const s = t.seasonalAc;

  return (
    <section
      className="relative border-y border-bm-red/50 bg-gradient-to-r from-bm-red/25 via-bm-card to-bm-red/15 overflow-hidden"
      aria-labelledby="seasonal-ac-heading"
    >
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_80%_50%,rgba(225,6,0,0.35),transparent_55%)]" />
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 sm:py-10 relative">
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-bm-red/60 bg-bm-red/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-bm-red mb-4">
              <Snowflake size={12} />
              {s.badge}
            </p>
            <h2 id="seasonal-ac-heading" className="font-display text-2xl sm:text-3xl font-bold uppercase text-glow leading-tight">
              {s.title}
              <span className="block sm:inline sm:ml-3 mt-1 sm:mt-0 text-bm-red text-xl sm:text-2xl">
                {s.priceFrom}
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-bm-silver/90 max-w-2xl leading-relaxed">
              {s.subtitle}
            </p>
            <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-xs text-bm-muted">
              {s.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Wind size={14} className="text-bm-red shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <BookingLink
                href="/booking"
                trackSource="seasonal_ac_banner"
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                {s.ctaBook}
                <ChevronRight size={16} />
              </BookingLink>
              <Link href="/klimatyzacja" className="btn-outline text-sm inline-flex items-center gap-2">
                {s.ctaLearn}
              </Link>
              <PhoneLink trackSource="seasonal_ac_banner" className="btn-outline text-sm">
                {s.ctaCall}
              </PhoneLink>
            </div>
          </div>
          <Link
            href="/klimatyzacja"
            className="hidden lg:block relative w-44 xl:w-52 aspect-[9/16] rounded-2xl overflow-hidden border border-bm-red/40 shadow-neon-sm hover:scale-[1.02] transition-transform"
          >
            <Image
              src="/images/works/ac-service-cover.png"
              alt={s.imageAlt}
              fill
              sizes="208px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 right-3 text-[10px] font-bold uppercase text-white text-center">
              {s.watchVideo}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
