"use client";

import { CalendarDays, MessageCircle, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { workshopWhatsAppChatUrl } from "@/lib/chat-cta";

const hiddenPaths = ["/crm", "/mechanic", "/admin", "/sign", "/cabinet", "/booking", "/cennik", "/telegram"];

export function StickyContactBar() {
  const { t, locale } = useI18n();
  const pathname = usePathname() ?? "";
  if (hiddenPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

  return (
    <nav aria-label={t.hero.ctaBook} className="bm-sticky-contact fixed inset-x-0 bottom-0 z-[90] border-t border-white/15 bg-[#11151b]/95 px-2 pt-2 shadow-[0_-16px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl safe-area-pb md:hidden" data-testid="mobile-action-bar">
      <div className="mx-auto grid max-w-lg grid-cols-[1fr_1fr_1.6fr] gap-2">
        <PhoneLink
          trackSource="sticky_2026_call"
          className="inline-flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.065] px-1 text-[11px] font-bold text-white"
        >
          <Phone size={19} aria-hidden />{t.stickyBar.call}
        </PhoneLink>
        <SocialContactLink
          kind="whatsapp"
          href={workshopWhatsAppChatUrl(locale)}
          trackSource="sticky_2026_whatsapp"
          className="inline-flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.065] px-1 text-[11px] font-bold text-white"
        >
          <MessageCircle size={19} className="text-[#45dc83]" aria-hidden />
          WhatsApp
        </SocialContactLink>
        <BookingLink
          trackSource="sticky_2026_booking"
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-bm-red px-3 text-sm font-bold text-white shadow-[0_3px_15px_rgba(225,6,0,.2)]"
        >
          <CalendarDays size={19} aria-hidden />{t.hero.ctaBook}
        </BookingLink>
      </div>
    </nav>
  );
}
