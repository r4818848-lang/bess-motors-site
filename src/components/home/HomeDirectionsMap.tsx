"use client";

import { Clock, MapPin, Navigation } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { WORKSHOP_DIRECTIONS_URL, WORKSHOP_MAP_EMBED } from "@/lib/maps";
import { PhoneLink } from "@/components/analytics/PhoneLink";

export function HomeDirectionsMap() {
  const { t } = useI18n();
  const h = t.homeLead;

  return (
    <section className="py-12 border-t border-bm-border/40" aria-labelledby="home-map-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-start gap-3 mb-6">
          <MapPin className="w-7 h-7 text-bm-red shrink-0 mt-0.5" aria-hidden />
          <div>
            <h2
              id="home-map-heading"
              className="font-display text-2xl md:text-3xl font-bold uppercase text-glow"
            >
              {h.mapTitle}
            </h2>
            <p className="mt-2 text-sm text-bm-muted max-w-2xl leading-relaxed">{h.mapSubtitle}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 items-stretch">
          <div className="rounded-2xl border border-bm-border/60 bg-bm-card/50 p-5 space-y-4">
            <p className="font-medium">{siteConfig.address}</p>
            <PhoneLink trackSource="home_map" className="block font-display text-lg font-bold hover:text-bm-red">
              {siteConfig.phone}
            </PhoneLink>
            <p className="inline-flex items-center gap-2 text-sm text-bm-muted">
              <Clock size={16} className="text-bm-red" />
              {h.mapHours}
            </p>
            <a
              href={WORKSHOP_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Navigation size={16} />
              {h.mapCta}
            </a>
          </div>
          <div className="rounded-2xl overflow-hidden border border-bm-border/50 min-h-[320px] md:min-h-[420px]">
            <iframe
              title="BESS MOTORS — 5 min od Okęcia, Aleja Krakowska"
              src={WORKSHOP_MAP_EMBED}
              className="w-full h-full min-h-[320px] md:min-h-[420px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
