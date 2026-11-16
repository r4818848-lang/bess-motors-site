"use client";

import { MapPin, Clock, Star, Plane } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { SITE_NAP } from "@/lib/site-nap";
import { siteConfig } from "@/lib/site";

/** Compact trust strip — real NAP + Google + airport (Final Polish v3 §8) */
export function HomeTrustBar() {
  const { t } = useI18n();
  const x = t.homeTrust;

  return (
    <section className="border-b border-white/10 bg-[#0c0d10]" aria-label={x.aria}>
      <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 py-3 text-sm sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:px-8">
        <li className="flex items-start gap-3 lg:pr-6">
          <MapPin className="mt-0.5 shrink-0 text-bm-red" size={16} aria-hidden />
          <div>
            <p className="font-semibold text-white">{x.addressLabel}</p>
            <p className="mt-0.5 text-bm-silver">{SITE_NAP.addressLine}</p>
          </div>
        </li>
        <li className="flex items-start gap-3 lg:border-l lg:border-white/10 lg:px-6">
          <Clock className="mt-0.5 shrink-0 text-bm-red" size={16} aria-hidden />
          <div>
            <p className="font-semibold text-white">{x.hoursLabel}</p>
            <p className="mt-0.5 text-bm-silver">{SITE_NAP.workingHoursLabel}</p>
          </div>
        </li>
        <li className="flex items-start gap-3 lg:border-l lg:border-white/10 lg:px-6">
          <Star className="mt-0.5 shrink-0 text-bm-red" size={16} aria-hidden />
          <div>
            <p className="font-semibold text-white">{x.reviewsLabel}</p>
            <a
              href={siteConfig.googleMapsReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-block text-bm-silver transition-colors hover:text-white"
            >
              {x.reviewsText}
            </a>
          </div>
        </li>
        <li className="flex items-start gap-3 lg:border-l lg:border-white/10 lg:pl-6">
          <Plane className="mt-0.5 shrink-0 text-bm-red" size={16} aria-hidden />
          <div>
            <p className="font-semibold text-white">{x.airportLabel}</p>
            <p className="mt-0.5 text-bm-silver">{x.airportText}</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
