"use client";

import { motion } from "framer-motion";
import { ChevronRight, Gauge } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import {
  FREE_SUSPENSION_DIAG,
  OIL_CHANGE_PROMO_BOOKING_ITEMS,
} from "@/lib/oil-brake-promo";
import { buildBookingUrl } from "@/lib/booking-url";

/** Free suspension only with oil change — points clients to the oil package */
export function FreeSuspensionPromoBanner() {
  const { t } = useI18n();
  const h = t.homeLead;

  return (
    <section
      className="border-y border-bm-border bg-bm-graphite"
      aria-labelledby="free-suspension-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
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
            <p className="mt-2 text-sm text-bm-muted">
              <span className="line-through opacity-70">{FREE_SUSPENSION_DIAG.wasZl} zł</span>
              {" → "}
              <span className="text-white font-semibold">0 zł</span>
            </p>
          </div>
          <BookingLink
            href={buildBookingUrl([...OIL_CHANGE_PROMO_BOOKING_ITEMS])}
            trackSource="promocje_oil_suspension_package"
            className="btn-primary text-sm inline-flex items-center gap-2 shrink-0"
          >
            {h.promoCtaOil}
            <ChevronRight size={16} />
          </BookingLink>
        </motion.div>
      </div>
    </section>
  );
}
