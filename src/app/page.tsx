"use client";

import { Hero } from "@/components/home/Hero";
import { SeasonalAcBanner } from "@/components/home/SeasonalAcBanner";
import { BannerServices } from "@/components/home/BannerServices";
import { StatsSection } from "@/components/home/StatsSection";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { Advantages } from "@/components/home/Advantages";
import { PartnersSection } from "@/components/home/PartnersSection";
import { PromoBanner } from "@/components/home/PromoBanner";
import { SymptomFaq } from "@/components/home/SymptomFaq";
import { HomeGarageTeaser } from "@/components/home/HomeGarageTeaser";
import { LiveQueueBanner } from "@/components/home/LiveQueueBanner";
import { PriceMatchBanner } from "@/components/home/PriceMatchBanner";
import { MiniQuoteWidget } from "@/components/home/MiniQuoteWidget";
import { WorkshopGallerySection } from "@/components/home/WorkshopGallerySection";
import { GoogleReviewsBlock } from "@/components/home/GoogleReviewsBlock";
import { LocalServiceAreaSection } from "@/components/seo/LocalServiceAreaSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SeasonalAcBanner />
      <LiveQueueBanner />
      <PriceMatchBanner />
      <HomeGarageTeaser />
      <MiniQuoteWidget />
      <PromoBanner />
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
