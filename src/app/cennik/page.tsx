"use client";

import { motion } from "framer-motion";
import { FullPriceListView } from "@/components/pricing/FullPriceListView";
import { ServicePackagesSection } from "@/components/pricing/ServicePackagesSection";
import { OfflinePriceBanner } from "@/components/pwa/OfflinePriceBanner";
import { useMetaViewContent } from "@/hooks/useMetaViewContent";

export default function CennikPage() {
  useMetaViewContent("Price List");

  return (
    <motion.div className="pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-4 lg:px-8">
        <OfflinePriceBanner />
        <ServicePackagesSection />
        <FullPriceListView />
      </div>
    </motion.div>
  );
}
