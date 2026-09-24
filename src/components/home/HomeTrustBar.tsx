"use client";

import { MapPin, Clock, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { SITE_NAP } from "@/lib/site-nap";

/** Trust strip — only facts we can stand behind (no invented ratings). */
export function HomeTrustBar() {
  const { t } = useI18n();
  const x = t.homeTrust;

  return (
    <section className="border-b border-bm-border/40 bg-bm-black/80" aria-label={x.aria}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4 sm:py-5">
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <li className="flex items-start gap-3">
            <MapPin className="text-bm-red shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold text-white">{x.addressLabel}</p>
              <p className="text-bm-muted mt-0.5">{SITE_NAP.addressLine}</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Clock className="text-bm-red shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold text-white">{x.hoursLabel}</p>
              <p className="text-bm-muted mt-0.5">{SITE_NAP.workingHoursLabel}</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <ShieldCheck className="text-bm-red shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold text-white">{x.warrantyLabel}</p>
              <p className="text-bm-muted mt-0.5">{x.warrantyText}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
