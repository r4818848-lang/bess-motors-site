import dynamic from "next/dynamic";
import { Hero } from "@/components/home/Hero";
import { HomeTrustBar } from "@/components/home/HomeTrustBar";
import { SameDayServices } from "@/components/home/SameDayServices";
import { HomeTireSeasonBlock } from "@/components/home/HomeTireSeasonBlock";
import { HomeComplexRepairs } from "@/components/home/HomeComplexRepairs";
import { HomeSeoServiceLinks } from "@/components/home/HomeSeoServiceLinks";
import { HomePromoBlock } from "@/components/home/HomePromoBlock";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";

const VinQuoteForm = dynamic(() =>
  import("@/components/home/VinQuoteForm").then((m) => m.VinQuoteForm)
);
const HowRepairWorks = dynamic(() =>
  import("@/components/home/HowRepairWorks").then((m) => m.HowRepairWorks)
);
const WhyBessMotors = dynamic(() =>
  import("@/components/home/WhyBessMotors").then((m) => m.WhyBessMotors)
);
const HomeRealizations = dynamic(() =>
  import("@/components/home/HomeRealizations").then((m) => m.HomeRealizations)
);
const WorkshopGallerySection = dynamic(() =>
  import("@/components/home/WorkshopGallerySection").then((m) => m.WorkshopGallerySection)
);
const GoogleReviewsBlock = dynamic(() =>
  import("@/components/home/GoogleReviewsBlock").then((m) => m.GoogleReviewsBlock)
);
const HomeDirectionsMap = dynamic(() =>
  import("@/components/home/HomeDirectionsMap").then((m) => m.HomeDirectionsMap)
);
const SymptomFaq = dynamic(() =>
  import("@/components/home/SymptomFaq").then((m) => m.SymptomFaq)
);

/**
 * Homepage order — Final Polish v3 §5 / §39 + TZ CRO (tires + complex repairs).
 */
export default function HomePage() {
  return (
    <>
      <div className="h-14 sm:h-16 safe-area-pt" aria-hidden />
      <Hero />
      <HomeTrustBar />
      <SameDayServices />
      <HomeTireSeasonBlock />
      <HomeComplexRepairs />
      <HomeSeoServiceLinks />
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
