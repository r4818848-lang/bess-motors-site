"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Droplets, Gauge, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import {
  OIL_BRAKE_PROMO_CODE,
  OIL_BRAKE_PROMO_OFFERS,
  OIL_CHANGE_PROMO_BOOKING_ITEMS,
} from "@/lib/oil-brake-promo";
import { buildBookingUrl } from "@/lib/booking-url";

/** One clear offer for clients: oil labour 80 zł + free suspension check with oil */
export function HomePromoBlock() {
  const { t } = useI18n();
  const h = t.homeLead;
  const oil = OIL_BRAKE_PROMO_OFFERS.find((o) => o.id === "oil_filter")!;
  const bookHref = buildBookingUrl([...OIL_CHANGE_PROMO_BOOKING_ITEMS]);

  return (
    <section
      className="border-y border-bm-red/40 bg-bm-graphite"
      aria-labelledby="home-promo-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-10 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-bm-red mb-3">
            {h.promoBadge} · {OIL_BRAKE_PROMO_CODE}
          </p>
          <h2
            id="home-promo-heading"
            className="font-display text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white leading-tight"
          >
            {h.promoTitle}
          </h2>
          <p className="mt-3 text-base text-bm-silver/95 leading-relaxed">
            {h.promoSubtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.06 }}
          className="mt-8 border border-bm-border bg-bm-black/60 p-5 sm:p-7"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Droplets className="text-emerald-400 shrink-0 mt-1" size={22} />
                <div>
                  <p className="font-semibold text-white text-lg">{h.oil}</p>
                  <p className="mt-1 text-3xl sm:text-4xl font-display font-black text-white">
                    {oil.nowZl}{" "}
                    <span className="text-xl text-emerald-400">zł</span>
                    <span className="ml-2 text-base font-normal text-bm-muted line-through">
                      {oil.wasZl} zł
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-bm-muted">{h.oilNote}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-bm-border/60 pt-4">
                <Gauge className="text-bm-red shrink-0 mt-1" size={22} />
                <div>
                  <p className="font-semibold text-white text-lg">{h.suspension}</p>
                  <p className="mt-1 text-2xl font-display font-black uppercase text-bm-red">
                    {h.suspensionFree}
                  </p>
                  <p className="mt-1 text-sm text-bm-muted">{h.suspensionNote}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
              <BookingLink
                href={bookHref}
                trackSource="home_promo_oil_package"
                className="btn-primary text-sm sm:text-base inline-flex items-center justify-center gap-2 px-6 py-3"
              >
                {h.promoCtaOil}
                <ChevronRight size={18} />
              </BookingLink>
              <PhoneLink
                trackSource="home_promo_call"
                className="btn-outline text-sm inline-flex items-center justify-center gap-2 px-6 py-3"
              >
                <Phone size={16} />
                {t.hero.ctaCall}
              </PhoneLink>
              <Link
                href="/promocje"
                className="text-center text-sm text-bm-muted hover:text-white transition-colors"
              >
                {h.promoMore}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
