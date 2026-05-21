"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { popularServices, type ServiceId } from "@/lib/services-catalog";
import { Card } from "@/components/ui/Card";
import { LazySmartBookingModal } from "@/components/booking/LazySmartBookingModal";

export function ServicesPreview() {
  const { t } = useI18n();
  const [bookingService, setBookingService] = useState<ServiceId | null>(null);

  return (
    <>
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-display text-3xl font-bold uppercase tracking-wide">
                {t.sections.popularServices}
              </h2>
              <div className="mt-2 h-1 w-20 bg-bm-red shadow-neon-sm" />
            </div>
            <Link
              href="/services"
              className="text-bm-red hover:underline text-sm font-semibold uppercase"
            >
              {t.sections.viewAll} →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {popularServices.map((cat, i) => {
              const label = t.serviceItems[cat.id as keyof typeof t.serviceItems];
              return (
                <Card
                  key={cat.id}
                  delay={Math.min(i * 0.02, 0.4)}
                  glow
                  className="cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => setBookingService(cat.id)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bm-red/20 text-bm-red mb-3">
                    <ServiceIcon name={cat.icon} size={20} />
                  </div>
                  <h3 className="font-semibold text-xs leading-tight uppercase">{label}</h3>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      {bookingService && (
        <LazySmartBookingModal
          serviceId={bookingService}
          onClose={() => setBookingService(null)}
        />
      )}
    </>
  );
}
