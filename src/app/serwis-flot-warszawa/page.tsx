"use client";

import Link from "next/link";
import { Building2, ChevronRight, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { SITE_NAP } from "@/lib/site-nap";

export default function FleetServicePage() {
  const { t } = useI18n();
  const f = t.fleetPage;

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-bm-red mb-4">
          <Building2 size={14} />
          BESS MOTORS
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-black uppercase text-white leading-tight">
          {f.h1}
        </h1>
        <p className="mt-4 text-bm-silver/90 leading-relaxed">{f.intro}</p>

        <h2 className="mt-10 font-display text-xl font-bold uppercase text-white">
          {f.servicesTitle}
        </h2>
        <ul className="mt-4 grid sm:grid-cols-2 gap-2">
          {f.services.map((item) => (
            <li
              key={item}
              className="border border-bm-border/50 bg-bm-black/40 px-4 py-3 text-sm text-white"
            >
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-bm-muted">{f.contactHint}</p>

        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <a
            href="/#wyceń-po-vin"
            className="btn-primary inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            {f.cta}
            <ChevronRight size={16} />
          </a>
          <BookingLink
            trackSource="fleet_page_book"
            className="btn-outline inline-flex items-center justify-center min-h-[44px]"
          >
            {f.ctaBook}
          </BookingLink>
          <PhoneLink
            trackSource="fleet_page_call"
            className="btn-outline inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Phone size={16} />
            {SITE_NAP.phoneDisplay}
          </PhoneLink>
        </div>

        <p className="mt-10 text-sm text-bm-muted">
          {SITE_NAP.addressLine} · {SITE_NAP.workingHoursLabel}
          {" · "}
          <Link href="/contacts" className="text-bm-red hover:underline">
            Kontakt
          </Link>
        </p>
      </div>
    </div>
  );
}
