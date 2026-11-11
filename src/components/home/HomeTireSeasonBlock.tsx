"use client";

import Link from "next/link";
import Image from "next/image";
import { Circle, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import { BookingLink } from "@/components/analytics/BookingLink";
import { TIRE_AD_LANDING_PATH, TIRE_SERVICE_PHOTOS } from "@/lib/tire-media";
import {
  TIRE_PROMO_EXTRAS,
  TIRE_PROMO_LADDER_HOME,
} from "@/lib/tire-promo-prices";

/** Seasonal tyre ad on homepage — promo ladder + real workshop photos → booking landing */
export function HomeTireSeasonBlock() {
  const { t, locale } = useI18n();
  const h = t.homeTireBlock;
  const lang = contentLocale(locale);
  const photos = TIRE_SERVICE_PHOTOS.slice(0, 3);

  return (
    <section
      className="py-12 sm:py-16 border-t border-white/10"
      aria-labelledby="home-tires-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
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
            <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-sm">
              {TIRE_PROMO_LADDER_HOME.map((row) => (
                <li
                  key={row.label}
                  className="rounded-lg border border-white/10 bg-bm-card/60 px-3 py-2"
                >
                  <span className="text-bm-muted block text-xs">{row.label}</span>
                  <span className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-emerald-400">{row.nowZl} zł</span>
                    <span className="text-xs text-bm-muted line-through">{row.wasZl} zł</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-bm-muted">{h.priceNote}</p>
            <p className="mt-1 text-xs text-bm-muted">
              RunFlat +{TIRE_PROMO_EXTRAS.runFlatPerWheelZl} zł/koło · TPMS +
              {TIRE_PROMO_EXTRAS.tpmsPerWheelZl} zł/koło · utylizacja{" "}
              {TIRE_PROMO_EXTRAS.disposalPerWheelZl} zł/koło
            </p>
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
              <BookingLink
                href={`${TIRE_AD_LANDING_PATH}#zapis-opony`}
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

          <div className="grid grid-cols-2 gap-2 sm:gap-3" aria-label={h.imageAlt}>
            <div className="relative col-span-2 aspect-[16/10] rounded-xl overflow-hidden border border-white/10 min-h-[180px]">
              <Image
                src={photos[0].src}
                alt={photos[0].alt[lang] ?? h.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
                priority
              />
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10">
              <Image
                src={photos[1].src}
                alt={photos[1].alt[lang] ?? h.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 22vw"
              />
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10">
              <Image
                src={photos[2].src}
                alt={photos[2].alt[lang] ?? h.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 22vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
