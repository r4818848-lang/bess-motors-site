"use client";

import Link from "next/link";
import { Calendar, Phone, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import type { ServiceId } from "@/lib/services-catalog";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { SocialContactLink } from "@/components/analytics/SocialContactLink";

type Props = {
  slug: string;
  serviceId?: ServiceId;
  onBook?: () => void;
};

export function ServiceLandingBottomCta({ slug, serviceId, onBook }: Props) {
  const { t } = useI18n();
  const sl = t.serviceLanding;

  return (
    <section className="mt-12 rounded-2xl border border-bm-red/30 bg-gradient-to-br from-bm-red/10 to-transparent p-6 md:p-8 text-center">
      <h2 className="font-display text-xl uppercase text-glow">{sl.bottomCtaTitle}</h2>
      <p className="text-bm-muted text-sm mt-2 max-w-lg mx-auto">{sl.bottomCtaSubtitle}</p>
      <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
        {serviceId && onBook ? (
          <button
            type="button"
            className="btn-primary inline-flex justify-center items-center gap-2"
            data-fbq-track="InitiateCheckout"
            onClick={onBook}
          >
            <Calendar size={18} />
            {t.cabinet.bookVisit}
          </button>
        ) : (
          <Link href="/booking" className="btn-primary inline-flex justify-center items-center gap-2">
            <Calendar size={18} />
            {t.cabinet.bookVisit}
          </Link>
        )}
        <PhoneLink
          trackSource={`landing_bottom_${slug}`}
          className="btn-outline inline-flex justify-center items-center gap-2"
        >
          <Phone size={18} />
          {t.stickyBar.call}
        </PhoneLink>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <SocialContactLink kind="whatsapp" trackSource={`landing_bottom_${slug}`} className="btn-outline text-xs">
          <MessageCircle size={14} />
          WhatsApp
        </SocialContactLink>
        <SocialContactLink kind="telegram" trackSource={`landing_bottom_${slug}`} className="btn-outline text-xs">
          Telegram
        </SocialContactLink>
        <a href={siteConfig.viber} className="btn-outline text-xs">
          Viber
        </a>
      </div>
    </section>
  );
}
