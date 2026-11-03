"use client";

import Image from "next/image";
import Link from "next/link";
import { Circle, ChevronRight } from "lucide-react";
import { BookingLink } from "@/components/analytics/BookingLink";
import {
  TIRE_AD_LANDING_PATH,
  TIRE_BMW_FRONT_SRC,
  TIRE_BMW_X3_JACK_SRC,
  TIRE_MERCEDES_BAY_SRC,
} from "@/lib/tire-media";

/** Compact tyre-season promo for /promocje and ad surfaces */
export function TirePromoBanner() {
  return (
    <section
      className="border-y border-white/10 bg-bm-black"
      aria-labelledby="tire-promo-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 sm:py-10">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-10 items-center">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-bm-red mb-2">
              Sezon opon
            </p>
            <h2
              id="tire-promo-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight"
            >
              Sezonowa wymiana opon od 200 zł
            </h2>
            <p className="mt-3 text-sm text-bm-silver max-w-xl leading-relaxed">
              Komplet 4 kół z wyważaniem — R13–R17 200 zł, R18 260, R19 300, R20 350.
              Umów termin online w BESS MOTORS (Włochy).
            </p>
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
              <BookingLink
                href={TIRE_AD_LANDING_PATH}
                trackSource="promocje_tire_banner"
                className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
              >
                <Circle size={16} aria-hidden />
                Umów wymianę opon
              </BookingLink>
              <Link
                href={TIRE_AD_LANDING_PATH}
                className="btn-outline inline-flex items-center justify-center gap-1 text-sm"
              >
                Strona oferty
                <ChevronRight size={14} aria-hidden />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[TIRE_BMW_FRONT_SRC, TIRE_BMW_X3_JACK_SRC, TIRE_MERCEDES_BAY_SRC].map((src) => (
              <div
                key={src}
                className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10"
              >
                <Image
                  src={src}
                  alt="Wymiana opon BESS MOTORS Warszawa"
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
