"use client";

import Link from "next/link";
import { Clock, Droplets, Disc, Snowflake, Circle, Gauge, Cpu, Cog, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { OIL_CHANGE_PROMO_BOOKING_ITEMS } from "@/lib/oil-brake-promo";
import { buildBookingUrl } from "@/lib/booking-url";
import { oilLabourPromoZl } from "@/lib/service-prices";

/** Max 8 popular services (Final Polish v3 §9) */
export function SameDayServices() {
  const { t } = useI18n();
  const h = t.homeLead;
  const oilPrice = oilLabourPromoZl();

  const items = [
    {
      icon: Droplets,
      title: h.sameDayOil,
      price: `${oilPrice} zł`,
      href: buildBookingUrl([...OIL_CHANGE_PROMO_BOOKING_ITEMS]),
      source: "same_day_oil",
      eta: "30–45 min",
    },
    {
      icon: Disc,
      title: "Hamulce",
      price: "od 100 zł",
      href: "/hamulce",
      source: "same_day_pads",
      eta: "1–2 h",
    },
    {
      icon: Cpu,
      title: h.sameDayDiag,
      price: "od 150 zł",
      href: "/diagnostyka",
      source: "same_day_diag",
      eta: "30–60 min",
    },
    {
      icon: Snowflake,
      title: h.sameDayAc,
      price: "od 130 zł",
      href: "/klimatyzacja",
      source: "same_day_ac",
      eta: "ok. 1 h",
    },
    {
      icon: Circle,
      title: h.sameDayTires,
      price: "od 200 zł",
      href: "/opony",
      source: "same_day_tires",
      eta: "ok. 1 h",
    },
    {
      icon: Gauge,
      title: "Zawieszenie",
      price: "wycena",
      href: "/zawieszenie",
      source: "same_day_suspension",
      eta: "30–40 min",
    },
    {
      icon: Cog,
      title: h.sameDayTiming,
      price: "wycena",
      href: "/booking",
      source: "same_day_timing",
      eta: "1–2 dni",
    },
    {
      icon: Cog,
      title: h.sameDayClutch,
      price: "wycena",
      href: "/booking",
      source: "same_day_clutch",
      eta: "1–2 dni",
    },
  ] as const;

  return (
    <section className="py-12 sm:py-16 border-t border-white/10" aria-labelledby="popular-services-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2
          id="popular-services-heading"
          className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight"
        >
          {h.popularTitle}
        </h2>
        <p className="mt-2 text-sm text-bm-muted max-w-2xl">{h.sameDaySubtitle}</p>

        <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <li
              key={item.source}
              className="rounded-xl border border-white/10 bg-bm-card p-5 flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
            >
              <item.icon className="w-5 h-5 text-bm-red" aria-hidden />
              <p className="mt-3 font-semibold text-white leading-snug">{item.title}</p>
              <p className="mt-2 text-lg font-bold text-white">{item.price}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-bm-muted">
                <Clock size={12} aria-hidden />
                {item.eta}
              </p>
              <BookingLink
                href={item.href}
                trackSource={item.source}
                className="mt-4 text-sm font-semibold text-bm-red hover:text-white transition-colors inline-flex items-center gap-1"
              >
                {h.sameDayBook}
                <ChevronRight size={14} aria-hidden />
              </BookingLink>
            </li>
          ))}
        </ul>

        <div className="mt-8 text-center">
          <Link href="/services" className="btn-outline inline-flex items-center gap-2">
            {h.allServices}
            <ChevronRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
