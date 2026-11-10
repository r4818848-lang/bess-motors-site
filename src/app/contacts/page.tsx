"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { WORKSHOP_HERO_PHOTO } from "@/lib/workshop-photos";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { trackLead } from "@/lib/gtag";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";
import { Card } from "@/components/ui/Card";
import { OfflinePriceBanner } from "@/components/pwa/OfflinePriceBanner";
import { Button } from "@/components/ui/Button";
import { LocalServiceAreaSection } from "@/components/seo/LocalServiceAreaSection";
import { WORKSHOP_DIRECTIONS_URL, WORKSHOP_MAP_EMBED } from "@/lib/maps";
import { gbpKeyPricesPl } from "@/lib/google-business-facts";
import { workshopTelegramChatUrl, workshopWhatsAppChatUrl } from "@/lib/chat-cta";

const sendingLabels = {
  pl: "Wysyłanie…",
  ru: "Отправляем…",
  en: "Sending…",
  uk: "Надсилаємо…",
} as const;

const privacyLabels = {
  pl: "Polityka prywatności",
  ru: "Политика конфиденциальности",
  en: "Privacy policy",
  uk: "Політика конфіденційності",
} as const;

export default function ContactsPage() {
  const { t, locale } = useI18n();
  const [submission, setSubmission] = useState<"idle" | "sending" | "success" | "error">("idle");
  const clientRequestIdRef = useRef<string | null>(null);

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submission === "sending") return;

    const form = event.currentTarget;
    const values = new FormData(form);
    const clientName = String(values.get("clientName") ?? "").trim();
    const phone = String(values.get("phone") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();
    if (!clientName || !phone || !message) return;

    // Stable across retries: duplicate submissions must not create duplicate CRM leads.
    if (!clientRequestIdRef.current) {
      clientRequestIdRef.current = crypto.randomUUID();
    }

    setSubmission("sending");
    try {
      const response = await fetch("/api/call-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          phone,
          serviceLabel: "Formularz kontaktowy",
          comment: [message, email ? `E-mail: ${email}` : ""].filter(Boolean).join("\n"),
          source: "contacts_form",
          sourceUrl: "/contacts",
          siteLocale: locale,
          clientRequestId: clientRequestIdRef.current,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error("lead_not_saved");

      // Count a conversion only after CRM persistence succeeds, without sending any PII.
      trackLead("call_request", { source: "contacts_form" });
      clientRequestIdRef.current = null;
      form.reset();
      setSubmission("success");
    } catch {
      setSubmission("error");
    }
  }

  const items = [
    { icon: MapPin, label: t.contacts.address, value: siteConfig.address, href: undefined },
    {
      icon: Phone,
      label: t.contacts.phone,
      value: siteConfig.phone,
      href: siteConfig.phoneHref,
    },
    {
      icon: Mail,
      label: t.contacts.email,
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
    },
    { icon: Clock, label: t.contacts.hours, value: t.contacts.hoursValue, href: undefined },
  ];

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h1 className="font-display text-4xl font-bold uppercase text-glow">{t.contacts.title}</h1>
        <p className="mt-2 text-bm-red font-display uppercase tracking-wide text-sm">
          {t.hero.ctaCall}
        </p>

        <div className="mt-6">
          <OfflinePriceBanner />
        </div>

        <div className="mt-12 grid lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            {items.map((item, i) => (
              <Card key={i} glow className="flex gap-4 items-start">
                <item.icon className="w-6 h-6 text-bm-red shrink-0" />
                <div>
                  <p className="text-xs uppercase text-bm-muted tracking-wide">{item.label}</p>
                  {item.href === siteConfig.phoneHref ? (
                    <PhoneLink
                      trackSource="contacts"
                      className="mt-1 font-medium block hover:text-bm-red"
                    >
                      {item.value}
                    </PhoneLink>
                  ) : item.href ? (
                    <a href={item.href} className="mt-1 font-medium block hover:text-bm-red">
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-medium">{item.value}</p>
                  )}
                </div>
              </Card>
            ))}
            <p className="text-xs text-bm-muted px-1">{t.contacts.gbpNote}</p>
            <ul className="text-xs text-bm-muted space-y-1 px-1">
              {gbpKeyPricesPl().slice(0, 3).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>

            <Card glow>
              <p className="text-xs uppercase text-bm-muted mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-bm-red" />
                {t.integrations.telegram} / {t.integrations.whatsapp}
              </p>
              <div className="flex flex-wrap gap-3">
                <SocialContactLink
                  kind="telegram"
                  href={workshopTelegramChatUrl()}
                  trackSource="contacts"
                  className="btn-outline text-xs"
                >
                  {t.homeLead.chatTelegram}
                </SocialContactLink>
                <SocialContactLink
                  kind="whatsapp"
                  href={workshopWhatsAppChatUrl(locale)}
                  trackSource="contacts"
                  className="btn-outline text-xs"
                >
                  {t.homeLead.chatWhatsapp}
                </SocialContactLink>
                <a href={siteConfig.viber} className="btn-outline text-xs">
                  Viber
                </a>
              </div>
            </Card>
          </div>

          <Card glow>
            <form onSubmit={submitContact} className="space-y-4" onChange={() => {
              if (submission === "success" || submission === "error") setSubmission("idle");
            }}>
              <input className="input-premium" name="clientName" autoComplete="name" placeholder={t.contacts.name} required maxLength={120} />
              <input className="input-premium" name="phone" type="tel" autoComplete="tel" placeholder={t.cabinet.phone} required minLength={9} maxLength={32} />
              <input className="input-premium" name="email" type="email" autoComplete="email" placeholder={t.contacts.email} maxLength={254} />
              <textarea className="input-premium min-h-[120px]" name="message" placeholder={t.contacts.message} required maxLength={2500} />
              <p className="text-xs text-bm-muted">
                <a href="/privacy" className="underline hover:text-bm-red">{privacyLabels[locale]}</a>
              </p>
              <Button type="submit" className="w-full" disabled={submission === "sending"}>
                {submission === "sending" ? sendingLabels[locale] : t.contacts.send}
              </Button>
              {submission === "success" && (
                <p role="status" className="text-sm text-green-400">{t.contacts.messageSent}</p>
              )}
              {submission === "error" && (
                <p role="alert" className="text-sm text-bm-red">{t.homeLead.callbackError}</p>
              )}
            </form>
          </Card>
        </div>

        <div className="mt-10 rounded-2xl overflow-hidden border border-bm-border/50 min-h-[360px]">
          <iframe
            title="BESS MOTORS — mapa, 5 min od Okęcia"
            src={WORKSHOP_MAP_EMBED}
            className="w-full h-[360px] md:h-[420px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <a
          href={WORKSHOP_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-bm-red hover:underline"
        >
          <MapPin className="w-4 h-4" />
          {siteConfig.address} — Google Maps
        </a>

        <div className="mt-8 relative aspect-[21/9] rounded-xl overflow-hidden border border-bm-border/40">
          <Image
            src={WORKSHOP_HERO_PHOTO.src}
            alt={t.workshopPhotos.exterior.alt}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        <LocalServiceAreaSection variant="compact" />
      </div>
    </div>
  );
}
