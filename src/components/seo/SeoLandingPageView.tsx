"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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
import { ServiceWorkVideo } from "@/components/gallery/OurWorksSection";
import { ServiceLandingMap } from "@/components/seo/landing/ServiceLandingMap";
import { ServiceLandingReviews } from "@/components/seo/landing/ServiceLandingReviews";
import { ServiceLandingBottomCta } from "@/components/seo/landing/ServiceLandingBottomCta";
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
import { ServiceLandingHeroMedia } from "@/components/seo/landing/ServiceLandingHeroMedia";

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
  const tireQuick = isTireQuickBookSlug(page.slug);

  const openBooking = useCallback(() => {
    if (bookServiceId) {
      setBookingService(bookServiceId);
    }
  }, [bookServiceId]);
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

  const heroTitle =
    pageLoc.title.toLowerCase().includes("warszawa") ||
    pageLoc.title.toLowerCase().includes("warsaw")
      ? pageLoc.title
      : `${pageLoc.title} — Warszawa`;

  const isExtraSeoPage = EXTRA_SEO_SERVICE_PAGES.some((item) => item.slug === page.slug);

  return (
    <>
      <div className="min-h-[70vh] bg-gradient-to-b from-[#12161e] via-[#0c0e13] to-bm-black pb-24 pt-24 sm:pt-28">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <SeoLandingBreadcrumbs serviceTitle={pageLoc.title} serviceHref={`/${page.slug}`} />

          <div className="mt-5 grid items-center gap-8 rounded-[28px] border border-white/10 bg-[#151920]/60 p-5 text-center shadow-[0_30px_75px_rgba(0,0,0,.25)] sm:p-8 lg:grid-cols-[minmax(260px,470px)_minmax(0,1fr)] lg:text-left">
            <ServiceLandingHeroMedia slug={page.slug} serviceId={page.serviceId} />
            <div>
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-bm-red/30 bg-bm-red/10 text-[#ff7c77]">
              <ServiceIcon name={page.icon} size={32} />
            </div>
            <h1 className="font-display text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl">
              {heroTitle}
            </h1>
            <p className="mt-5 text-lg font-semibold leading-snug text-[#ff7772] sm:text-xl">
              {pageLoc.line1}
            </p>
            <p className="mt-3 text-base leading-relaxed text-white/65">{pageLoc.line2}</p>
            {page.slug === "klimatyzacja" ? (
              <AcPromoAccentPills variant="landing" className="mt-5 justify-center" />
            ) : null}
            {isBrandSeoLandingSlug(page.slug) ? (
              <p className="mt-4 mx-auto max-w-2xl text-sm text-bm-muted/90 border border-bm-border/60 rounded-lg px-4 py-3 bg-bm-card/40">
                {sl.brandNotice}
              </p>
            ) : null}
            <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-bm-red lg:mx-0" />
            </div>
          </div>

          {contentServiceId ? (
            <ServiceLandingPhotos
              serviceId={contentServiceId}
              slug={page.slug}
              placement="under-motion"
            />
          ) : null}

          {getModelHeroForSlug(page.slug) ? (
            <ModelServiceHero slug={page.slug} />
          ) : page.slug === TIRE_AD_LANDING_SLUG ||
            page.slug === "wulkanizacja-warszawa" ||
            page.slug === "wymiana-opon-warszawa" ? (
            <TirePromoPhotoStrip className="mt-10" />
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Card
              glow
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-[#1a1d25] transition-colors hover:border-bm-red/40"
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
            <Card glow className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#1a1d25]">
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
          </div>

          <div className="mt-8 flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
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
