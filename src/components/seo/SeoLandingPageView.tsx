"use client";

import { useState, useEffect, useCallback } from "react";
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
import { localizeSeoLandingPage } from "@/lib/seo-landing-i18n";
import { BrandServiceBlock } from "@/components/seo/BrandServiceBlock";
import { SeoServiceFaq } from "@/components/seo/SeoServiceFaq";
import { ServiceLandingPrice } from "@/components/seo/landing/ServiceLandingPrice";
import { ServiceLandingSteps } from "@/components/seo/landing/ServiceLandingSteps";
import { ServiceLandingEducation } from "@/components/seo/landing/ServiceLandingEducation";
import { ServiceLandingPhotos } from "@/components/seo/landing/ServiceLandingPhotos";
import { ServiceLandingMap } from "@/components/seo/landing/ServiceLandingMap";
import { ServiceLandingBottomCta } from "@/components/seo/landing/ServiceLandingBottomCta";
import { ServiceLandingReviews } from "@/components/seo/landing/ServiceLandingReviews";
import { SeoLandingRelatedLinks } from "@/components/seo/landing/SeoLandingRelatedLinks";
import {
  resolveLandingBookServiceId,
  resolveLandingContentServiceId,
} from "@/lib/seo-landing-slug-profiles";
import { isBrandSeoLandingSlug } from "@/lib/seo-brand-slugs";

type Props = {
  page: SeoLandingPage;
};

export function SeoLandingPageView({ page }: Props) {
  useMetaViewContent(`Landing: ${page.slug}`);
  const { t, locale } = useI18n();
  const sl = t.seoLanding;
  const pageLoc = localizeSeoLandingPage(page, locale);
  const bookServiceId = resolveLandingBookServiceId(page.slug, page.serviceId);
  const contentServiceId = resolveLandingContentServiceId(page.slug, page.serviceId);
  const [bookingService, setBookingService] = useState<ServiceId | null>(null);
  const [scrollPromptShown, setScrollPromptShown] = useState(false);

  const openBooking = useCallback(() => {
    if (bookServiceId) {
      setBookingService(bookServiceId);
    }
  }, [bookServiceId]);

  const scrollToMap = () => {
    document.getElementById("landing-map-heading")?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!bookServiceId || scrollPromptShown) return;
    const onScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;
      if (nearBottom) {
        setScrollPromptShown(true);
        setBookingService(bookServiceId);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [bookServiceId, scrollPromptShown]);

  const heroTitle =
    pageLoc.title.toLowerCase().includes("warszawa") ||
    pageLoc.title.toLowerCase().includes("warsaw")
      ? pageLoc.title
      : `${pageLoc.title} — Warszawa`;

  return (
    <>
      <div className="pt-28 pb-20 min-h-[70vh]">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl metallic text-bm-red mb-6 shadow-neon-sm">
              <ServiceIcon name={page.icon} size={32} />
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold uppercase text-glow">
              {heroTitle}
            </h1>
            <p className="mt-4 text-xl md:text-2xl text-bm-red font-display uppercase tracking-wide">
              {pageLoc.line1}
            </p>
            <p className="mt-2 text-lg text-bm-muted">{pageLoc.line2}</p>
            {isBrandSeoLandingSlug(page.slug) ? (
              <p className="mt-4 mx-auto max-w-2xl text-sm text-bm-muted/90 border border-bm-border/60 rounded-lg px-4 py-3 bg-bm-card/40">
                {sl.brandNotice}
              </p>
            ) : null}
            <div className="mt-6 h-1 w-24 bg-bm-red shadow-neon-sm mx-auto" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-12 grid sm:grid-cols-2 gap-4"
          >
            <Card
              glow
              className="flex gap-3 items-start cursor-pointer hover:border-bm-red/40 transition-colors"
              onClick={scrollToMap}
            >
              <MapPin className="w-5 h-5 text-bm-red shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <p className="text-bm-muted uppercase text-[10px] tracking-wide">
                  {t.contacts.address}
                </p>
                <p className="font-medium mt-1">{siteConfig.address}</p>
              </div>
            </Card>
            <Card glow className="flex gap-3 items-start">
              <Phone className="w-5 h-5 text-bm-red shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <p className="text-bm-muted uppercase text-[10px] tracking-wide">
                  {t.contacts.phone}
                </p>
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
            {bookServiceId ? (
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

          {contentServiceId ? (
            <>
              <ServiceLandingPrice serviceId={contentServiceId} slug={page.slug} />
              <ServiceLandingSteps
                serviceId={contentServiceId}
                slug={page.slug}
                onBook={bookServiceId ? openBooking : undefined}
              />
              <ServiceLandingEducation serviceId={contentServiceId} slug={page.slug} />
              <ServiceLandingPhotos serviceId={contentServiceId} slug={page.slug} />
              <SeoServiceFaq serviceId={contentServiceId} slug={page.slug} />
              <ServiceLandingReviews serviceId={contentServiceId} />
              <ServiceLandingMap slug={page.slug} />
              <SeoLandingRelatedLinks slug={page.slug} />
              <ServiceLandingBottomCta
                slug={page.slug}
                serviceId={bookServiceId ?? contentServiceId}
                onBook={bookServiceId ? openBooking : undefined}
              />
            </>
          ) : (
            <>
              <ServiceLandingMap slug={page.slug} />
              <ServiceLandingBottomCta slug={page.slug} />
            </>
          )}

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
