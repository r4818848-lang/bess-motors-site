"use client";

import { MessageCircle, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { workshopTelegramChatUrl, workshopWhatsAppChatUrl } from "@/lib/chat-cta";

export function ChatNeedHelp() {
  const { t, locale } = useI18n();
  const h = t.homeLead;

  return (
    <section className="py-10 border-t border-bm-border/40" aria-labelledby="chat-need-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2 id="chat-need-heading" className="font-display text-2xl font-bold uppercase text-glow">
          {h.chatTitle}
        </h2>
        <p className="mt-2 text-sm text-bm-muted max-w-2xl">{h.chatSubtitle}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <SocialContactLink
            kind="whatsapp"
            href={workshopWhatsAppChatUrl(locale)}
            trackSource="home_chat_whatsapp"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <MessageCircle size={18} />
            {h.chatWhatsapp}
          </SocialContactLink>
          <SocialContactLink
            kind="telegram"
            href={workshopTelegramChatUrl()}
            trackSource="home_chat_telegram"
            className="btn-outline inline-flex items-center gap-2 text-sm"
          >
            <Send size={18} />
            {h.chatTelegram}
          </SocialContactLink>
        </div>
      </div>
    </section>
  );
}
