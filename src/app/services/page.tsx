"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { useI18n } from "@/lib/i18n/context";
import { popularServices, type ServiceId } from "@/lib/services-catalog";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LazySmartBookingModal } from "@/components/booking/LazySmartBookingModal";

export default function ServicesPage() {
  const { t } = useI18n();
  const [problem, setProblem] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [bookingService, setBookingService] = useState<ServiceId | null>(null);

  return (
    <>
      <div className="pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold uppercase text-glow">
              {t.services.title}
            </h1>
            <p className="mt-4 text-bm-muted text-lg max-w-2xl">{t.services.subtitle}</p>
            <div className="mt-4 h-1 w-24 bg-bm-red shadow-neon-sm" />
          </motion.div>

          <section className="mt-16">
            <h2 className="font-display text-xl uppercase tracking-wide mb-8 text-bm-red">
              {t.sections.popularServices}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {popularServices.map((cat, i) => {
                const label = t.serviceItems[cat.id as keyof typeof t.serviceItems];
                return (
                  <Card
                    key={cat.id}
                    delay={Math.min(i * 0.02, 0.3)}
                    glow
                    className="cursor-pointer group"
                    onClick={() => setBookingService(cat.id)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl metallic text-bm-red mb-3 group-hover:shadow-neon transition-shadow">
                      <ServiceIcon name={cat.icon} size={22} />
                    </div>
                    <h3 className="font-display font-semibold uppercase text-xs">{label}</h3>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mt-20">
            <Card glow className="max-w-2xl mx-auto">
              <h2 className="font-display text-xl uppercase text-bm-red mb-6">
                {t.services.customRequest}
              </h2>
              {submitted ? (
                <p className="text-center text-bm-red font-semibold py-8">✓</p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                  className="space-y-4"
                >
                  <textarea
                    className="input-premium min-h-[120px] resize-y"
                    placeholder={t.services.describeProblem}
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full">
                    {t.services.submit}
                  </Button>
                </form>
              )}
            </Card>
          </section>
        </div>
      </div>
      {bookingService && (
        <LazySmartBookingModal
          serviceId={bookingService}
          onClose={() => setBookingService(null)}
        />
      )}
    </>
  );
}
