"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, MapPin, Phone, FileSearch, Navigation } from "lucide-react";
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
import { ServiceWorkVideo, BookingWorkVideoTeaser } from "@/components/gallery/OurWorksSection";
import { ServiceLandingMap } from "@/components/seo/landing/ServiceLandingMap";
import { ServiceLandingBottomCta } from "@/components/seo/landing/ServiceLandingBottomCta";
import { ServiceLandingReviews } from "@/components/seo/landing/ServiceLandingReviews";
import { ServiceLandingPackageOffer } from "@/components/seo/landing/ServiceLandingPackageOffer";
import { SeoLandingRelatedLinks } from "@/components/seo/landing/SeoLandingRelatedLinks";
import { AcPromoAccentPills } from "@/components/home/AcPromoAccentPills";
import { SeoLandingBreadcrumbs } from "@/components/seo/SeoLandingBreadcrumbs";
import { WhyBessMotors } from "@/components/home/WhyBessMotors";
import {
  resolveLandingBookServiceId,
  resolveLandingContentServiceId,
} from "@/lib/seo-landing-slug-profiles";
import { isBrandSeoLandingSlug } from "@/lib/seo-brand-slugs";
import { CallbackRequestCta } from "@/components/callback/CallbackRequestCta";
import { isCallbackLandingSlug } from "@/lib/callback-landing-slugs";
import { TireQuickBookForm } from "@/components/booking/TireQuickBookForm";
import { isTireQuickBookSlug, TIRE_QUICK_FORM_ID } from "@/lib/tire-quick-book";
import { WORKSHOP_DIRECTIONS_URL } from "@/lib/maps";
import { trackBookingOpen, trackGetDirectionsClick } from "@/lib/gtag";
import { EXTRA_SEO_SERVICE_PAGES } from "@/lib/seo-extra-service-pages";
import { TirePromoPhotoStrip } from "@/components/seo/landing/TirePromoPhotoStrip";
import { ModelServiceHero } from "@/components/seo/landing/ModelServiceHero";
import { TIRE_AD_LANDING_SLUG } from "@/lib/tire-media";
import { getModelHeroForSlug } from "@/lib/model-service-media";

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

  const tireQuick = isTireQuickBookSlug(page.slug);
  const bookFromPage = () => {
    trackBookingOpen(`landing_${page.slug}`);
    if (tireQuick) {
      document.getElementById(TIRE_QUICK_FORM_ID)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    openBooking();
  };

  const scrollToMap = () => {
    document.getElementById("landing-map-heading")?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (tireQuick || !bookServiceId || scrollPromptShown) return;
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
  }, [bookServiceId, scrollPromptShown, tireQuick]);

  const heroTitle =
    pageLoc.title.toLowerCase().includes("warszawa") ||
    pageLoc.title.toLowerCase().includes("warsaw")
      ? pageLoc.title
      : `${pageLoc.title} — Warszawa`;

  const isExtraSeoPage = EXTRA_SEO_SERVICE_PAGES.some((p) => p.slug === page.slug);

  return (
    <>
      <div className="pt-28 pb-28 min-h-[70vh]">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <SeoLandingBreadcrumbs serviceTitle={pageLoc.title} serviceHref={`/${page.slug}`} />

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
            {page.slug === "klimatyzacja" ? (
              <AcPromoAccentPills variant="landing" className="mt-5 justify-center" />
            ) : null}
            {isBrandSeoLandingSlug(page.slug) ? (
              <p className="mt-4 mx-auto max-w-2xl text-sm text-bm-muted/90 border border-bm-border/60 rounded-lg px-4 py-3 bg-bm-card/40">
                {sl.brandNotice}
              </p>
            ) : null}
            <div className="mt-6 h-1 w-24 bg-bm-red shadow-neon-sm mx-auto" />
          </motion.div>

          {getModelHeroForSlug(page.slug) ? (
            <ModelServiceHero slug={page.slug} />
          ) : page.slug === TIRE_AD_LANDING_SLUG ||
            page.slug === "wulkanizacja-warszawa" ||
            page.slug === "wymiana-opon-warszawa" ? (
            <TirePromoPhotoStrip className="mt-10" />
          ) : null}

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

          <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
            {tireQuick ? (
              <a
                href={`#${TIRE_QUICK_FORM_ID}`}
                className="btn-primary inline-flex justify-center items-center gap-2 min-h-12"
                onClick={() => trackBookingOpen(`landing_${page.slug}`)}
              >
                <Calendar size={18} />
                {t.hero.ctaBook}
                <ChevronRight size={18} />
              </a>
            ) : bookServiceId ? (
              <button
                type="button"
                className="btn-primary inline-flex justify-center items-center gap-2"
                data-fbq-track="InitiateCheckout"
                data-fbq-params={JSON.stringify({ content_name: `landing_${page.slug}` })}
                onClick={() => {
                  trackBookingOpen(`landing_${page.slug}`);
                  openBooking();
                }}
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
              className="btn-outline inline-flex justify-center items-center gap-2 min-h-12"
            >
              <Phone size={18} />
              {t.stickyBar.call}
            </PhoneLink>
            <a
              href={WORKSHOP_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGetDirectionsClick(`landing_${page.slug}`)}
              className="btn-outline inline-flex justify-center items-center gap-2 min-h-12"
            >
              <Navigation size={18} />
              {t.stickyBar.route}
            </a>
            <Link
              href="/#wyceń-po-vin"
              className="btn-outline inline-flex justify-center items-center gap-2"
            >
              <FileSearch size={18} />
              {t.hero.ctaVin}
            </Link>
          </div>

          <p className="mt-4 text-center text-sm text-bm-muted">
            <Link href="/contacts" className="hover:text-bm-red transition-colors">
              {t.nav.contacts}
            </Link>
            {" · "}
            <Link href="/cennik" className="hover:text-bm-red transition-colors">
              {t.nav.priceList}
            </Link>
            {" · "}
            {siteConfig.address}
          </p>

          {tireQuick ? <TireQuickBookForm source={`landing_${page.slug}`} /> : null}

          {isCallbackLandingSlug(page.slug) ? (
            <CallbackRequestCta
              className="mt-8"
              source={`landing_5min_${page.slug}`}
              serviceId={bookServiceId ?? contentServiceId ?? "otherReason"}
              serviceLabel={pageLoc.title}
              labels={{
                title: t.homeLead.callbackTitle,
                subtitle: t.homeLead.callbackSubtitle,
                phonePlaceholder: t.cabinet.phone,
                submit: t.homeLead.callbackSubmit,
                done: t.homeLead.callbackDone,
                error: t.homeLead.callbackError,
                commentDefault: t.homeLead.callbackComment.replace("{page}", page.slug),
              }}
            />
          ) : null}

          <BrandServiceBlock slug={page.slug} />

          {contentServiceId ? (
            <>
              <ServiceLandingPrice serviceId={contentServiceId} slug={page.slug} />
              <ServiceLandingPackageOffer serviceId={contentServiceId} />
              <ServiceLandingSteps
                serviceId={contentServiceId}
                slug={page.slug}
                onBook={bookServiceId || tireQuick ? bookFromPage : undefined}
              />
              <ServiceLandingEducation serviceId={contentServiceId} slug={page.slug} />
              <ServiceWorkVideo serviceId={contentServiceId} className="mt-12" />
              <SeoServiceFaq serviceId={contentServiceId} slug={page.slug} />
              <ServiceLandingReviews serviceId={contentServiceId} />
              <ServiceLandingPhotos serviceId={contentServiceId} slug={page.slug} />
              <ServiceLandingMap slug={page.slug} />
              <SeoLandingRelatedLinks slug={page.slug} />
              {isExtraSeoPage ? (
                <div className="mt-12">
                  <WhyBessMotors />
                </div>
              ) : null}
              <ServiceLandingBottomCta
                slug={page.slug}
                serviceId={bookServiceId ?? contentServiceId}
                onBook={bookServiceId || tireQuick ? bookFromPage : undefined}
              />
            </>
          ) : (
            <>
              <ServiceLandingMap slug={page.slug} />
              {isExtraSeoPage ? (
                <div className="mt-12">
                  <WhyBessMotors />
                </div>
              ) : null}
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
