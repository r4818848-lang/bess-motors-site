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
    <section className="border-t border-white/10 bg-gradient-to-br from-[#241820] via-[#11151c] to-[#080b10] py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 lg:px-8 text-center">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {c.title}
        </h2>
        <p className="mt-3 text-bm-silver/90">{c.subtitle}</p>
        <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <a href="#wyceń-po-vin" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 text-sm font-bold text-white transition-colors hover:border-white/60">
            {c.ctaVin}
            <ChevronRight size={16} />
          </a>
          <BookingLink
            trackSource="home_final_book"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-bm-red px-5 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            {c.ctaBook}
          </BookingLink>
          <PhoneLink
            trackSource="home_final_call"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 text-sm font-bold text-white transition-colors hover:border-white/60"
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
