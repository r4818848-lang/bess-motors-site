"use client";

import { Hero } from "@/components/home/Hero";
import { HomeTrustBar } from "@/components/home/HomeTrustBar";
import { SameDayServices } from "@/components/home/SameDayServices";
import { HomePromoBlock } from "@/components/home/HomePromoBlock";
import { VinQuoteForm } from "@/components/home/VinQuoteForm";
import { HowRepairWorks } from "@/components/home/HowRepairWorks";
import { WhyBessMotors } from "@/components/home/WhyBessMotors";
import { HomeRealizations } from "@/components/home/HomeRealizations";
import { WorkshopGallerySection } from "@/components/home/WorkshopGallerySection";
import { GoogleReviewsBlock } from "@/components/home/GoogleReviewsBlock";
import { HomeDirectionsMap } from "@/components/home/HomeDirectionsMap";
import { SymptomFaq } from "@/components/home/SymptomFaq";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";

/**
 * Homepage order — Final Polish v3 §5 / §39.
 * One instance of each block; oil promo after popular services.
 */
export default function HomePage() {
  return (
    <>
      <div className="h-14 sm:h-16 safe-area-pt" aria-hidden />
      <Hero />
      <HomeTrustBar />
      <SameDayServices />
      <HomePromoBlock />
      <VinQuoteForm />
      <HowRepairWorks />
      <WhyBessMotors />
      <HomeRealizations />
      <GoogleReviewsBlock />
      <WorkshopGallerySection />
      <SymptomFaq />
      <HomeDirectionsMap />
      <HomeFinalCta />
    </>
  );
}
