"use client";

import { Phone, Calendar, MessageCircle, Navigation } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { workshopWhatsAppChatUrl } from "@/lib/chat-cta";
import { WORKSHOP_DIRECTIONS_URL } from "@/lib/maps";
import { trackGetDirectionsClick } from "@/lib/gtag";

const hiddenPaths = [
  "/crm",
  "/mechanic",
  "/admin",
  "/sign",
  "/cabinet",
  "/booking",
  "/cennik",
];

export function StickyContactBar() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const sc = t.stickyBar;

  if (hiddenPaths.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] md:hidden border-t border-white/10 bg-bm-black/95 backdrop-blur-md safe-area-pb">
      <div className="grid grid-cols-4 gap-0">
        <PhoneLink
          trackSource="sticky_bar"
          className="flex items-center justify-center gap-1 min-h-[52px] py-3 text-[10px] font-bold uppercase bg-bm-red text-white"
        >
          <Phone size={15} /> {sc.call}
        </PhoneLink>
        <SocialContactLink
          kind="whatsapp"
          href={workshopWhatsAppChatUrl(locale)}
          trackSource="sticky_bar_whatsapp"
          className="flex items-center justify-center gap-1 min-h-[52px] py-3 text-[10px] font-bold uppercase bg-[#25D366] text-white border-x border-white/10"
        >
          <MessageCircle size={15} /> {sc.whatsapp}
        </SocialContactLink>
        <a
          href={WORKSHOP_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={sc.route}
          onClick={() => trackGetDirectionsClick("sticky_bar")}
          className="flex items-center justify-center gap-1 min-h-[52px] py-3 text-[10px] font-bold uppercase text-white bg-bm-card border-r border-white/10"
        >
          <Navigation size={15} /> Trasa
        </a>
        <BookingLink
          trackSource="sticky_bar"
          aria-label={t.hero.ctaBook}
          className="flex items-center justify-center gap-1 min-h-[52px] py-3 text-[10px] font-bold uppercase text-white bg-bm-black"
        >
          <Calendar size={15} /> {sc.book}
        </BookingLink>
      </div>
    </div>
  );
}
