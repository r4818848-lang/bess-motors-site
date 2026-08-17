"use client";

import { MapPin, Clock, Navigation } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { Card } from "@/components/ui/Card";
import { WORKSHOP_DIRECTIONS_URL, WORKSHOP_MAP_EMBED } from "@/lib/maps";

export function ServiceLandingMap({ slug }: { slug: string }) {
  const { t } = useI18n();
  const sl = t.serviceLanding;

  return (
    <section className="mt-12" aria-labelledby="landing-map-heading">
      <h2 id="landing-map-heading" className="font-display text-xl uppercase mb-4">
        {sl.mapTitle}
      </h2>
      <p className="text-sm text-bm-muted mb-4">{sl.mapHint}</p>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card glow className="p-5 space-y-4">
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-bm-red shrink-0" />
            <div>
              <p className="text-xs uppercase text-bm-muted">{t.contacts.address}</p>
              <p className="font-medium mt-1">{siteConfig.address}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <PhoneLink
              trackSource={`landing_map_${slug}`}
              className="flex gap-3 hover:text-bm-red"
            >
              <span className="text-bm-red">📞</span>
              <span className="font-medium">{siteConfig.phone}</span>
            </PhoneLink>
          </div>
          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-bm-red shrink-0" />
            <div>
              <p className="text-xs uppercase text-bm-muted">{t.contacts.hours}</p>
              <p className="font-medium mt-1">{t.contacts.hoursValue}</p>
            </div>
          </div>
          <a
            href={WORKSHOP_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Navigation size={16} />
            {sl.directionsButton}
          </a>
        </Card>
        <div className="rounded-xl overflow-hidden border border-bm-border/50 min-h-[280px]">
          <iframe
            title="BESS MOTORS — mapa"
            src={WORKSHOP_MAP_EMBED}
            className="w-full h-full min-h-[280px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
