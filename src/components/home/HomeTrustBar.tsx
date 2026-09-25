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
    <section className="border-b border-white/10 bg-bm-surface" aria-label={x.aria}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4 sm:py-5">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <li className="flex items-start gap-3">
            <MapPin className="text-bm-red shrink-0 mt-0.5" size={18} aria-hidden />
            <div>
              <p className="font-semibold text-white">{x.addressLabel}</p>
              <p className="text-bm-silver mt-0.5">{SITE_NAP.addressLine}</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Clock className="text-bm-red shrink-0 mt-0.5" size={18} aria-hidden />
            <div>
              <p className="font-semibold text-white">{x.hoursLabel}</p>
              <p className="text-bm-silver mt-0.5">{SITE_NAP.workingHoursLabel}</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Star className="text-bm-red shrink-0 mt-0.5" size={18} aria-hidden />
            <div>
              <p className="font-semibold text-white">{x.reviewsLabel}</p>
              <a
                href={siteConfig.googleMapsReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-bm-silver mt-0.5 hover:text-white transition-colors inline-block"
              >
                {x.reviewsText}
              </a>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Plane className="text-bm-red shrink-0 mt-0.5" size={18} aria-hidden />
            <div>
              <p className="font-semibold text-white">{x.airportLabel}</p>
              <p className="text-bm-silver mt-0.5">{x.airportText}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
