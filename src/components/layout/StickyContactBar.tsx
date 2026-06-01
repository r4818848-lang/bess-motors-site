"use client";

import { Phone, Calendar, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { whatsappContactUrl, whatsappDefaultMessage } from "@/lib/whatsapp";

const hiddenPaths = ["/crm", "/mechanic", "/admin", "/sign", "/cabinet"];

export function StickyContactBar() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const sc = t.stickyBar;

  if (hiddenPaths.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] md:hidden border-t border-bm-red/40 bg-bm-black/95 backdrop-blur-md safe-area-pb">
      <div className="grid grid-cols-3 gap-0">
        <PhoneLink
          trackSource="sticky_bar"
          className="flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-bold uppercase bg-bm-red text-white"
        >
          <Phone size={16} /> {sc.call}
        </PhoneLink>
        <SocialContactLink
          kind="whatsapp"
          href={whatsappContactUrl(whatsappDefaultMessage(locale))}
          trackSource="sticky_bar_whatsapp"
          className="flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-bold uppercase bg-[#25D366] text-white border-x border-white/10"
        >
          <MessageCircle size={16} /> {sc.whatsapp}
        </SocialContactLink>
        <BookingLink
          trackSource="sticky_bar"
          className="flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-bold uppercase text-white bg-bm-black"
        >
          <Calendar size={16} /> {sc.book}
        </BookingLink>
      </div>
    </div>
  );
}