"use client";

import { Calendar } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";

export function BookNowSticky() {
  const { t } = useI18n();
  const pathname = usePathname();

  if (pathname.startsWith("/cabinet") || pathname.startsWith("/crm")) return null;

  return (
    <div className="fixed bottom-[4.75rem] right-3 z-40 md:hidden safe-area-pb">
      <BookingLink
        href="/booking"
        trackSource="sticky_mobile"
        className="btn-primary shadow-neon flex items-center gap-2 rounded-full px-5 py-3"
      >
        <Calendar size={18} />
        {t.bookSticky.label}
      </BookingLink>
    </div>
  );
}
