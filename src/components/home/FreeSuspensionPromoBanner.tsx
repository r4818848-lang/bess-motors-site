"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Gauge } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PromoPriceDisplay } from "@/components/pricing/PromoPriceDisplay";
import { FREE_SUSPENSION_DIAG } from "@/lib/oil-brake-promo";
import { buildBookingUrl } from "@/lib/booking-url";

/** Free suspension diagnostics — homepage / promocje highlight */
export function FreeSuspensionPromoBanner() {
  const { t } = useI18n();
  const h = t.homeLead;

  return (
    <section
      className="relative overflow-hidden border-y border-bm-red/40 bg-gradient-to-r from-bm-black via-bm-card to-bm-red/20"
      aria-labelledby="free-suspension-heading"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(circle at 80% 40%, rgba(225,6,0,0.25), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-bm-red mb-3">
              <Gauge size={14} />
              {h.suspension}
            </p>
            <h2
              id="free-suspension-heading"
              className="font-display text-2xl sm:text-3xl font-black uppercase text-white"
            >
              {h.suspensionFree}
            </h2>
            <p className="mt-2 text-sm text-bm-silver/90">{h.suspensionNote}</p>
            <div className="mt-3">
              <PromoPriceDisplay
                priceZl={0}
                compareAtZl={FREE_SUSPENSION_DIAG.wasZl}
                priceFrom={false}
                size="md"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <BookingLink
              href={buildBookingUrl([FREE_SUSPENSION_DIAG.bookingItems])}
              trackSource="promocje_suspension_free"
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              {h.promoCtaSuspension}
              <ChevronRight size={16} />
            </BookingLink>
            <Link href="/booking" className="btn-outline text-sm">
              {t.nav.booking}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
