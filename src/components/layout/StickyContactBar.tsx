"use client";

import Link from "next/link";
import { Phone, Calendar } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";

const hiddenPaths = ["/crm", "/mechanic", "/admin", "/sign"];

export function StickyContactBar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const sc = t.stickyBar;

  if (hiddenPaths.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] md:hidden border-t border-bm-red/40 bg-bm-black/95 backdrop-blur-md safe-area-pb">
      <div className="grid grid-cols-2 gap-0">
        <PhoneLink
          trackSource="sticky_bar"
          className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold uppercase bg-bm-red text-white"
        >
          <Phone size={18} /> {sc.call}
        </PhoneLink>
        <BookingLink
          trackSource="sticky_bar"
          className="flex items-center justify-center gap-2 py-3.5 text-sm font-bold uppercase border-l border-bm-red/30 text-white"
        >
          <Calendar size={18} /> {sc.book}
        </BookingLink>
      </div>
    </div>
  );
}
