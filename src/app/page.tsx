"use client";

import { Hero } from "@/components/home/Hero";
import { BannerServices } from "@/components/home/BannerServices";
import { StatsSection } from "@/components/home/StatsSection";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { Advantages } from "@/components/home/Advantages";
import { Reviews } from "@/components/home/Reviews";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BannerServices />
      <StatsSection />
      <ServicesPreview />
      <Advantages />
      <Reviews />
    </>
  );
}
