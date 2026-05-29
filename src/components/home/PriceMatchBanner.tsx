"use client";

import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";

export function PriceMatchBanner() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="glass-red rounded-xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 neon-border">
        <p className="text-sm text-bm-silver">{t.priceMatch.text}</p>
        <BookingLink href="/booking" className="btn-primary text-xs shrink-0" trackSource="price_match">
          {t.nav.booking}
        </BookingLink>
      </div>
    </div>
  );
}
