"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import { TIRE_SERVICE_PHOTOS } from "@/lib/tire-media";

/** Real workshop shots under tire-ad / seasonal landing hero */
export function TirePromoPhotoStrip({ className = "" }: { className?: string }) {
  const { locale } = useI18n();
  const lang = contentLocale(locale);
  const photos = TIRE_SERVICE_PHOTOS.slice(0, 3);

  return (
    <div className={`grid grid-cols-3 gap-2 sm:gap-3 ${className}`.trim()}>
      {photos.map((photo, i) => (
        <div
          key={photo.src}
          className={`relative overflow-hidden rounded-xl border border-white/10 bg-bm-surface/50 ${
            i === 0 ? "aspect-[4/3] col-span-3 sm:col-span-1 sm:aspect-[3/4]" : "aspect-[4/3] sm:aspect-[3/4]"
          }`}
        >
          <Image
            src={photo.src}
            alt={photo.alt[lang] ?? photo.alt.pl}
            fill
            className="object-cover"
            sizes={i === 0 ? "(max-width: 640px) 92vw, 33vw" : "(max-width: 640px) 46vw, 33vw"}
            priority={i === 0}
            fetchPriority={i === 0 ? "high" : "low"}
            decoding={i === 0 ? "sync" : "async"}
          />
        </div>
      ))}
    </div>
  );
}
