"use client";

import { MessageCircle, Send } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { workshopTelegramChatUrl, workshopWhatsAppChatUrl } from "@/lib/chat-cta";

const hiddenPaths = ["/crm", "/mechanic", "/admin", "/sign"];

export function ChatFloatingButtons() {
  const { locale, t } = useI18n();
  const pathname = usePathname();

  if (
    hiddenPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/booking") ||
    pathname.startsWith("/cennik")
  ) {
    return null;
  }

  const h = t.homeLead;

  return (
    <div className="fixed z-[85] hidden md:flex flex-col gap-2 md:bottom-6 md:right-6">
      <SocialContactLink
        kind="telegram"
        href={workshopTelegramChatUrl()}
        trackSource="floating_telegram"
        aria-label={h.chatTelegram}
        title={h.chatTitle}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2AABEE] text-white shadow-[0_4px_20px_rgba(42,171,238,0.45)] hover:scale-105 transition-transform"
      >
        <Send size={22} strokeWidth={2} aria-hidden />
      </SocialContactLink>
      <SocialContactLink
        kind="whatsapp"
        href={workshopWhatsAppChatUrl(locale)}
        trackSource="floating_whatsapp"
        aria-label={h.chatWhatsapp}
        title={h.chatTitle}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] hover:scale-105 transition-transform"
      >
        <MessageCircle size={28} strokeWidth={2} aria-hidden />
      </SocialContactLink>
    </div>
  );
}
