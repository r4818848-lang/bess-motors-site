import dynamic from "next/dynamic";
import { Hero } from "@/components/home/Hero";
import { HomeQuickPaths } from "@/components/home/HomeQuickPaths";
import { SameDayServices } from "@/components/home/SameDayServices";
import { HomeTireSeasonBlock } from "@/components/home/HomeTireSeasonBlock";
import { HomeSeoServiceLinks } from "@/components/home/HomeSeoServiceLinks";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";
import { SymptomShortcuts } from "@/components/home/SymptomShortcuts";

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
 * 2026 editorial home: trust + visitor paths + services + real work before supporting details. Repetitive repair promo removed; full repair taxonomy remains under /services.
 */
export default function HomePage() {
  return (
    <>
      <div className="h-14 sm:h-16 safe-area-pt" aria-hidden />
      <Hero />
      <SameDayServices />
      <HomeQuickPaths />
      <SymptomShortcuts />
      <HomeTireSeasonBlock />
      <HomeRealizations />
      <WhyBessMotors />
      <VinQuoteForm />
      <HowRepairWorks />
      <GoogleReviewsBlock />
      <SymptomFaq />
      <HomeSeoServiceLinks />
      <HomeDirectionsMap />
      <HomeFinalCta />
    </>
  );
}
