"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import {
  popularServices,
  bookingGridServices,
  type ServiceId,
} from "@/lib/services-catalog";
import { siteConfig } from "@/lib/site";
import { LazySmartBookingModal } from "@/components/booking/LazySmartBookingModal";

function BookingContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [serviceId, setServiceId] = useState<ServiceId | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const s = searchParams.get("service") as ServiceId | null;
    if (s && popularServices.some((p) => p.id === s)) {
      setServiceId(s);
    }
  }, [searchParams]);

  if (done) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-[60vh]">
        <motion.div className="glass-red rounded-2xl p-12 text-center neon-border">
          <Check className="w-16 h-16 text-bm-red mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-glow">{t.booking.success}</h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
        <h1 className="font-display text-4xl font-bold uppercase text-glow">{t.booking.title}</h1>
        <p className="mt-2 text-sm text-bm-muted">{siteConfig.workingHours}</p>
        <p className="mt-8 text-bm-muted max-w-md mx-auto">{t.bookingFlow.continueSelf}</p>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {bookingGridServices.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setServiceId(cat.id)}
              className="glass-red rounded-xl p-4 text-sm font-semibold uppercase hover:shadow-neon-sm transition-all border border-bm-border/50"
            >
              {t.serviceItems[cat.id as keyof typeof t.serviceItems]}
            </button>
          ))}
        </div>
      </div>
      {serviceId && (
        <LazySmartBookingModal
          serviceId={serviceId}
          onClose={() => setServiceId(null)}
          onSuccess={(kind) => {
            if (kind === "booking") setDone(true);
          }}
        />
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="pt-32 min-h-[50vh]" />}>
      <BookingContent />
    </Suspense>
  );
}
