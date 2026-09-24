"use client";

import { Hero } from "@/components/home/Hero";
import { HomeTrustBar } from "@/components/home/HomeTrustBar";
import { SameDayServices } from "@/components/home/SameDayServices";
import { HomePromoBlock } from "@/components/home/HomePromoBlock";
import { VinQuoteForm } from "@/components/home/VinQuoteForm";
import { HowRepairWorks } from "@/components/home/HowRepairWorks";
import { WhyBessMotors } from "@/components/home/WhyBessMotors";
import { WorkshopGallerySection } from "@/components/home/WorkshopGallerySection";
import { GoogleReviewsBlock } from "@/components/home/GoogleReviewsBlock";
import { HomeDirectionsMap } from "@/components/home/HomeDirectionsMap";
import { SymptomFaq } from "@/components/home/SymptomFaq";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";

/**
 * Homepage: oil 80 zł promo first (above the fold), then hero funnel.
 * Ticker / fleet mid-page / chat block removed to cut noise.
 */
export default function HomePage() {
  return (
    <>
      <div className="h-14 sm:h-16 safe-area-pt" aria-hidden />
      <HomePromoBlock />
      <Hero />
      <HomeTrustBar />
      <SameDayServices />
      <VinQuoteForm />
      <HowRepairWorks />
      <WhyBessMotors />
      <WorkshopGallerySection />
      <GoogleReviewsBlock />
      <HomeDirectionsMap />
      <SymptomFaq />
      <HomeFinalCta />
    </>
  );
}
