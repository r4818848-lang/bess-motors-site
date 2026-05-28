"use client";

import { Calendar } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";

export function BookNowSticky() {
  const { locale } = useI18n();
  const label = locale === "ru" ? "Запись" : locale === "en" ? "Book" : "Umów";

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      <BookingLink
        href="/booking"
        trackSource="sticky_mobile"
        className="btn-primary shadow-neon flex items-center gap-2 rounded-full px-5 py-3"
      >
        <Calendar size={18} />
        {label}
      </BookingLink>
    </div>
  );
}
