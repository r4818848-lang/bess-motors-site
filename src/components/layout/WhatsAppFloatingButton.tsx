"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { whatsappContactUrl, whatsappDefaultMessage } from "@/lib/whatsapp";

const hiddenPaths = ["/crm", "/mechanic", "/admin", "/sign"];

export function WhatsAppFloatingButton() {
  const { locale, t } = useI18n();
  const pathname = usePathname();

  if (
    hiddenPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/booking") ||
    pathname.startsWith("/cennik")
  ) {
    return null;
  }

  const href = whatsappContactUrl(whatsappDefaultMessage(locale));
  const label = t.integrations?.whatsapp ?? "WhatsApp";

  return (
    <SocialContactLink
      kind="whatsapp"
      href={href}
      trackSource="floating_whatsapp"
      aria-label={label}
      title={label}
      className="fixed z-[85] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] hover:scale-105 hover:shadow-[0_6px_28px_rgba(37,211,102,0.55)] transition-transform bottom-6 left-4 md:left-auto md:right-6"
    >
      <MessageCircle size={28} strokeWidth={2} aria-hidden />
    </SocialContactLink>
  );
}
