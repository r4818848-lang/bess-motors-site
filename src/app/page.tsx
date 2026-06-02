"use client";

import { Hero } from "@/components/home/Hero";
import { BannerServices } from "@/components/home/BannerServices";
import { StatsSection } from "@/components/home/StatsSection";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { Advantages } from "@/components/home/Advantages";
import { Reviews } from "@/components/home/Reviews";
import { PartnersSection } from "@/components/home/PartnersSection";
import { PromoBanner } from "@/components/home/PromoBanner";
import { SymptomFaq } from "@/components/home/SymptomFaq";
import { HomeGarageTeaser } from "@/components/home/HomeGarageTeaser";
import { LiveQueueBanner } from "@/components/home/LiveQueueBanner";
import { PriceMatchBanner } from "@/components/home/PriceMatchBanner";
import { MiniQuoteWidget } from "@/components/home/MiniQuoteWidget";
import { GoogleReviewsBlock } from "@/components/home/GoogleReviewsBlock";
import { WorkshopGallerySection } from "@/components/home/WorkshopGallerySection";

export default function HomePage() {
  return (
    <>
      <Hero />
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
      <Reviews />
    </>
  );
}
