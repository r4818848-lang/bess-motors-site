"use client";

import Link from "next/link";
import Image from "next/image";
import { Circle, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { TIRE_SERVICE_POSTER_SRC } from "@/lib/tire-media";

/** Seasonal tyre change — real price ladder, no fake queue claims */
export function HomeTireSeasonBlock() {
  const { t } = useI18n();
  const h = t.homeTireBlock;

  return (
    <section
      className="py-12 sm:py-16 border-t border-white/10"
      aria-labelledby="home-tires-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bm-red font-bold mb-2">
              {h.badge}
            </p>
            <h2
              id="home-tires-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight"
            >
              {h.title}
            </h2>
            <p className="mt-3 text-sm text-bm-muted max-w-xl leading-relaxed">{h.subtitle}</p>
            <ul className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <li className="rounded-lg border border-white/10 bg-bm-card/60 px-3 py-2">
                <span className="text-bm-muted block text-xs">R13–R17</span>
                <span className="font-bold text-white">200 zł</span>
              </li>
              <li className="rounded-lg border border-white/10 bg-bm-card/60 px-3 py-2">
                <span className="text-bm-muted block text-xs">R18</span>
                <span className="font-bold text-white">260 zł</span>
              </li>
              <li className="rounded-lg border border-white/10 bg-bm-card/60 px-3 py-2">
                <span className="text-bm-muted block text-xs">R19</span>
                <span className="font-bold text-white">300 zł</span>
              </li>
              <li className="rounded-lg border border-white/10 bg-bm-card/60 px-3 py-2">
                <span className="text-bm-muted block text-xs">R20</span>
                <span className="font-bold text-white">350 zł</span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-bm-muted">{h.priceNote}</p>
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
              <BookingLink
                href="/wymiana-opon-warszawa"
                trackSource="home_tires_season"
                className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
              >
                <Circle size={16} aria-hidden />
                {h.ctaAsk}
              </BookingLink>
              <Link
                href="/wulkanizacja-warszawa"
                className="btn-outline inline-flex items-center justify-center gap-1 text-sm"
              >
                {h.ctaMore}
                <ChevronRight size={14} aria-hidden />
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 min-h-[220px]">
            <Image
              src={TIRE_SERVICE_POSTER_SRC}
              alt={h.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
