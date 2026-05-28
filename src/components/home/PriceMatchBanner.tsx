"use client";

import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";

export function PriceMatchBanner() {
  const { locale } = useI18n();
  const text =
    locale === "ru"
      ? "Нашли дешевле? Покажите смету — постараемся сопоставить цену на аналогичные работы."
      : locale === "en"
        ? "Found a lower quote? Show us — we will try to match comparable work."
        : "Znalazłeś taniej? Pokaż wycenę — dopasujemy cenę przy podobnym zakresie prac.";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="glass-red rounded-xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 neon-border">
        <p className="text-sm text-bm-silver">{text}</p>
        <BookingLink href="/booking" className="btn-primary text-xs shrink-0" trackSource="price_match">
          {locale === "ru" ? "Записаться" : "Umów wizytę"}
        </BookingLink>
      </div>
    </div>
  );
}
