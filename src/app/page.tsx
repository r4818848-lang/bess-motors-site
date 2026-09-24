"use client";

import { Hero } from "@/components/home/Hero";
import { HomeTrustBar } from "@/components/home/HomeTrustBar";
import { HomePromoBlock } from "@/components/home/HomePromoBlock";
import { SameDayServices } from "@/components/home/SameDayServices";
import { VinQuoteForm } from "@/components/home/VinQuoteForm";
import { HowRepairWorks } from "@/components/home/HowRepairWorks";
import { ChatNeedHelp } from "@/components/home/ChatNeedHelp";
import { HomeDirectionsMap } from "@/components/home/HomeDirectionsMap";
import { FleetTeaser } from "@/components/home/FleetTeaser";
import { WorkshopGallerySection } from "@/components/home/WorkshopGallerySection";
import { GoogleReviewsBlock } from "@/components/home/GoogleReviewsBlock";
import { LocalServiceAreaSection } from "@/components/seo/LocalServiceAreaSection";
import { SymptomFaq } from "@/components/home/SymptomFaq";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";
import { PopularServicesTicker } from "@/components/home/PopularServicesTicker";

/** Homepage conversion path — NO invented stats or ratings */
export default function HomePage() {
  return (
    <>
      <div className="h-[3.65rem] sm:h-[4.15rem] safe-area-pt" aria-hidden />
      <PopularServicesTicker />
      <Hero />
      <HomeTrustBar />
      <HomePromoBlock />
      <SameDayServices />
      <VinQuoteForm />
      <HowRepairWorks />
      <GoogleReviewsBlock />
      <WorkshopGallerySection />
      <FleetTeaser />
      <HomeDirectionsMap />
      <LocalServiceAreaSection />
      <SymptomFaq />
      <ChatNeedHelp />
      <HomeFinalCta />
    </>
  );
}
