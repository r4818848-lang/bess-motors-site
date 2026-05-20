"use client";

import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ContactsPage() {
  const { t } = useI18n();

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

        <div className="mt-12 grid lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            {items.map((item, i) => (
              <Card key={i} glow className="flex gap-4 items-start">
                <item.icon className="w-6 h-6 text-bm-red shrink-0" />
                <div>
                  <p className="text-xs uppercase text-bm-muted tracking-wide">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="mt-1 font-medium block hover:text-bm-red">
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 font-medium">{item.value}</p>
                  )}
                </div>
              </Card>
            ))}

            <Card glow>
              <p className="text-xs uppercase text-bm-muted mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-bm-red" />
                {t.integrations.telegram} / {t.integrations.whatsapp}
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={siteConfig.telegram} className="btn-outline text-xs" target="_blank" rel="noopener noreferrer">
                  Telegram @bessmotors
                </a>
                <a href={siteConfig.whatsapp} className="btn-outline text-xs" target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
                <a href={siteConfig.viber} className="btn-outline text-xs">
                  Viber
                </a>
              </div>
            </Card>
          </div>

          <Card glow>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(t.contacts.messageSent);
              }}
              className="space-y-4"
            >
              <input className="input-premium" placeholder={t.contacts.name} required />
              <input className="input-premium" type="email" placeholder={t.contacts.email} required />
              <input className="input-premium" placeholder={t.cabinet.phone} />
              <textarea className="input-premium min-h-[120px]" placeholder={t.contacts.message} required />
              <Button type="submit" className="w-full">
                {t.contacts.send}
              </Button>
            </form>
          </Card>
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 block aspect-[21/9] rounded-xl glass-red neon-border overflow-hidden relative group"
        >
          <div className="absolute inset-0 flex items-center justify-center bg-bm-graphite group-hover:bg-bm-red/10 transition-colors">
            <MapPin className="w-8 h-8 text-bm-red mr-2" />
            <span className="text-bm-muted group-hover:text-white transition-colors">
              {siteConfig.address} — Google Maps
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}
