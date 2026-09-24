"use client";

import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";

export function FleetTeaser() {
  const { t } = useI18n();
  const f = t.fleetTeaser;

  return (
    <section className="py-12 border-t border-bm-border/40" aria-labelledby="fleet-teaser-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="border border-bm-border/60 bg-bm-black/50 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-bm-red mb-3">
              <Building2 size={14} />
              {f.badge}
            </p>
            <h2 id="fleet-teaser-heading" className="font-display text-xl sm:text-2xl font-bold uppercase text-white">
              {f.title}
            </h2>
            <p className="mt-2 text-sm text-bm-muted">{f.subtitle}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/serwis-flot-warszawa" className="btn-primary inline-flex items-center justify-center gap-2 min-h-[44px]">
              {f.cta}
              <ChevronRight size={16} />
            </Link>
            <BookingLink
              trackSource="fleet_teaser_book"
              className="btn-outline inline-flex items-center justify-center min-h-[44px]"
            >
              {f.book}
            </BookingLink>
          </div>
        </div>
      </div>
    </section>
  );
}
