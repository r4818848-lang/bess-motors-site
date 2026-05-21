"use client";

import { useState } from "react";
import { Timer, Snowflake, Droplets, Gauge, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { bannerServices as serviceIds } from "@/lib/site";
import type { ServiceId } from "@/lib/services-catalog";
import { LazySmartBookingModal } from "@/components/booking/LazySmartBookingModal";

const icons = {
  tires: Timer,
  ac: Snowflake,
  oil: Droplets,
  tuning: Gauge,
  other: Wrench,
};

export function BannerServices() {
  const { t } = useI18n();
  const [bookingService, setBookingService] = useState<ServiceId | null>(null);

  return (
    <>
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-bm-red/5 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 lg:px-8 relative">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-center mb-4">
            {t.banner.servicesTitle}
          </h2>
          <div className="h-1 w-24 bg-bm-red mx-auto shadow-neon-sm mb-12" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {serviceIds.map((svc, i) => {
              const Icon = icons[svc.id];
              const data = t.bannerServices[svc.id as keyof typeof t.bannerServices];
              return (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <button
                    type="button"
                    onClick={() => setBookingService(svc.serviceId)}
                    className="block w-full h-full text-left rounded-2xl border-2 border-bm-red/60 bg-bm-card/80 p-5 transition-all duration-300 hover:border-bm-red hover:shadow-neon group neon-border cursor-pointer"
                    style={{
                      boxShadow:
                        "0 0 15px rgba(225, 6, 0, 0.15), inset 0 0 20px rgba(225, 6, 0, 0.03)",
                    }}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="rounded-full bg-bm-red/15 p-4 group-hover:bg-bm-red/25 transition-colors">
                        <Icon className="w-10 h-10 text-bm-red" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="font-display text-xs font-bold uppercase text-center text-white leading-tight mb-3 min-h-[2.5rem] flex items-center justify-center">
                      {data.title}
                    </h3>
                    <ul className="space-y-1.5 text-center">
                      {data.items.map((item) => (
                        <li key={item} className="text-[11px] text-bm-muted uppercase tracking-wide">
                          {item}
                        </li>
                      ))}
                    </ul>
                    {svc.fast && (
                      <p className="mt-4 text-[9px] font-bold uppercase text-bm-red text-center leading-tight border-t border-bm-red/30 pt-3 flex items-center justify-center gap-1">
                        <Timer className="w-3 h-3 shrink-0" />
                        {t.banner.fastBadge}
                      </p>
                    )}
                  </button>
                </motion.div>
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
