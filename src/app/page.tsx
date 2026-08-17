"use client";

import { Hero } from "@/components/home/Hero";
import { PopularServicesTicker } from "@/components/home/PopularServicesTicker";
import { SameDayServices } from "@/components/home/SameDayServices";
import { ChatNeedHelp } from "@/components/home/ChatNeedHelp";
import { HomeDirectionsMap } from "@/components/home/HomeDirectionsMap";
import { BannerServices } from "@/components/home/BannerServices";
import { StatsSection } from "@/components/home/StatsSection";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { Advantages } from "@/components/home/Advantages";
import { PartnersSection } from "@/components/home/PartnersSection";
import { SymptomFaq } from "@/components/home/SymptomFaq";
import { WorkshopGallerySection } from "@/components/home/WorkshopGallerySection";
import { GoogleReviewsBlock } from "@/components/home/GoogleReviewsBlock";
import { LocalServiceAreaSection } from "@/components/seo/LocalServiceAreaSection";

export default function HomePage() {
  return (
    <>
      <div className="h-[3.65rem] sm:h-[4.15rem] safe-area-pt" aria-hidden />
      <PopularServicesTicker />
      <Hero />
      <SameDayServices />
      <ChatNeedHelp />
      <HomeDirectionsMap />
      <BannerServices />
      <StatsSection />
      <ServicesPreview />
      <Advantages />
      <SymptomFaq />
      <PartnersSection />
      <WorkshopGallerySection />
      <GoogleReviewsBlock />
      <LocalServiceAreaSection />
    </>
  );
}
