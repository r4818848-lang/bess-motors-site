"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, MapPin, Phone } from "lucide-react";
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import type { ServiceId } from "@/lib/services-catalog";
import { siteConfig } from "@/lib/site";
import { useI18n } from "@/lib/i18n/context";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { BookingLink } from "@/components/analytics/BookingLink";
import { LazySmartBookingModal } from "@/components/booking/LazySmartBookingModal";
import { Card } from "@/components/ui/Card";
import { useMetaViewContent } from "@/hooks/useMetaViewContent";
import { BrandServiceBlock } from "@/components/seo/BrandServiceBlock";
import { SeoServiceFaq } from "@/components/seo/SeoServiceFaq";
import { SeoHowItWorks } from "@/components/seo/SeoHowItWorks";

type Props = {
  page: SeoLandingPage;
};

export function SeoLandingPageView({ page }: Props) {
  useMetaViewContent(`Landing: ${page.slug}`);
  const { t } = useI18n();
  const sl = t.seoLanding;
  const [bookingService, setBookingService] = useState<ServiceId | null>(
    page.serviceId ?? null
  );

  const openBooking = () => {
    if (page.serviceId) {
      setBookingService(page.serviceId);
    }
  };

  return (
    <>
      <div className="pt-28 pb-20 min-h-[70vh]">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl metallic text-bm-red mb-6 shadow-neon-sm">
              <ServiceIcon name={page.icon} size={32} />
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold uppercase text-glow">
              {page.title}
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-bm-red font-display uppercase tracking-wide">
              {page.line1}
            </p>
            <p className="mt-2 text-lg text-bm-muted">{page.line2}</p>
            <div className="mt-6 h-1 w-24 bg-bm-red shadow-neon-sm mx-auto" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-12 grid sm:grid-cols-2 gap-4"
          >
            <Card glow className="flex gap-3 items-start">
              <MapPin className="w-5 h-5 text-bm-red shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <p className="text-bm-muted uppercase text-[10px] tracking-wide">{t.contacts.address}</p>
                <p className="font-medium mt-1">{siteConfig.address}</p>
              </div>
            </Card>
            <Card glow className="flex gap-3 items-start">
              <Phone className="w-5 h-5 text-bm-red shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <p className="text-bm-muted uppercase text-[10px] tracking-wide">{t.contacts.phone}</p>
                <PhoneLink
                  trackSource={`landing_${page.slug}`}
                  className="font-medium mt-1 block hover:text-bm-red"
                >
                  {siteConfig.phone}
                </PhoneLink>
              </div>
            </Card>
          </motion.div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            {page.serviceId ? (
              <button
                type="button"
                className="btn-primary inline-flex justify-center items-center gap-2"
                data-fbq-track="InitiateCheckout"
                data-fbq-params={JSON.stringify({ content_name: `landing_${page.slug}` })}
                onClick={openBooking}
              >
                <Calendar size={18} />
                {t.cabinet.bookVisit}
                <ChevronRight size={18} />
              </button>
            ) : (
              <BookingLink
                trackSource={`landing_${page.slug}`}
                className="btn-primary inline-flex justify-center items-center gap-2"
              >
                <Calendar size={18} />
                {sl.bookOnline}
                <ChevronRight size={18} />
              </BookingLink>
            )}
            <PhoneLink
              trackSource={`landing_${page.slug}`}
              className="btn-outline inline-flex justify-center items-center gap-2"
            >
              <Phone size={18} />
              {t.stickyBar.call}
            </PhoneLink>
          </div>

          <BrandServiceBlock slug={page.slug} />

          <SeoHowItWorks serviceId={page.serviceId} />
          <SeoServiceFaq serviceId={page.serviceId} />

          <p className="mt-8 text-center text-sm text-bm-muted">
            <Link href="/services" className="hover:text-bm-red transition-colors">
              {sl.allServices}
            </Link>
            {" · "}
            <Link href="/status" className="hover:text-bm-red transition-colors">
              {t.nav.repairStatus}
            </Link>
            {" · "}
            <Link href="/contacts" className="hover:text-bm-red transition-colors">
              {t.nav.contacts}
            </Link>
          </p>
        </div>
      </div>

      {bookingService && (
        <LazySmartBookingModal
          serviceId={bookingService}
          onClose={() => setBookingService(null)}
        />
      )}
    </>
  );
}
