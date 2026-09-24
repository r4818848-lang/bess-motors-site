"use client";

import { Hero } from "@/components/home/Hero";
import { PopularServicesTicker } from "@/components/home/PopularServicesTicker";
import { HomePromoBlock } from "@/components/home/HomePromoBlock";
import { SameDayServices } from "@/components/home/SameDayServices";
import { ChatNeedHelp } from "@/components/home/ChatNeedHelp";
import { HomeDirectionsMap } from "@/components/home/HomeDirectionsMap";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { Advantages } from "@/components/home/Advantages";
import { WorkshopGallerySection } from "@/components/home/WorkshopGallerySection";
import { GoogleReviewsBlock } from "@/components/home/GoogleReviewsBlock";
import { LocalServiceAreaSection } from "@/components/seo/LocalServiceAreaSection";

/** Client homepage — short path: offer → book → contact → trust */
export default function HomePage() {
  return (
    <>
      <div className="h-[3.65rem] sm:h-[4.15rem] safe-area-pt" aria-hidden />
      <PopularServicesTicker />
      <Hero />
      <HomePromoBlock />
      <SameDayServices />
      <ChatNeedHelp />
      <HomeDirectionsMap />
      <ServicesPreview />
      <Advantages />
      <WorkshopGallerySection />
      <GoogleReviewsBlock />
      <LocalServiceAreaSection />
    </>
  );
}
