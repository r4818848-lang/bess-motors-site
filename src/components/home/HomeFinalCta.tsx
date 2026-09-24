"use client";

import Link from "next/link";
import { ChevronRight, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { SITE_NAP } from "@/lib/site-nap";

export function HomeFinalCta() {
  const { t } = useI18n();
  const c = t.homeFinalCta;

  return (
    <section className="py-14 sm:py-18 border-t border-bm-red/30 bg-gradient-to-b from-bm-graphite to-bm-black">
      <div className="mx-auto max-w-3xl px-4 lg:px-8 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
          {c.title}
        </h2>
        <p className="mt-3 text-bm-silver/90">{c.subtitle}</p>
        <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <a href="#wyceń-po-vin" className="btn-primary inline-flex items-center justify-center gap-2 min-h-[44px]">
            {c.ctaVin}
            <ChevronRight size={16} />
          </a>
          <BookingLink
            trackSource="home_final_book"
            className="btn-outline inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            {c.ctaBook}
          </BookingLink>
          <PhoneLink
            trackSource="home_final_call"
            className="btn-outline inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Phone size={16} />
            {SITE_NAP.phoneDisplay}
          </PhoneLink>
        </div>
        <p className="mt-6 text-sm text-bm-muted">
          <Link href="/serwis-flot-warszawa" className="text-bm-red hover:underline">
            {c.fleetLink}
          </Link>
        </p>
      </div>
    </section>
  );
}
