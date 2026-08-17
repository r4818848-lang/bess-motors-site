"use client";

import { Clock, Droplets, Disc, Snowflake, Filter, Circle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";
import { buildBookingUrl } from "@/lib/booking-url";

export function SameDayServices() {
  const { t } = useI18n();
  const h = t.homeLead;

  const items = [
    {
      icon: Droplets,
      title: h.sameDayOil,
      href: buildBookingUrl(["oil_filter"]),
      source: "same_day_oil",
    },
    {
      icon: Filter,
      title: h.sameDayFilters,
      href: buildBookingUrl(["cabin_filter", "air_filter"]),
      source: "same_day_filters",
    },
    {
      icon: Disc,
      title: h.sameDayPads,
      href: buildBookingUrl(["brake_pads_front"]),
      source: "same_day_pads",
    },
    {
      icon: Snowflake,
      title: h.sameDayAc,
      href: "/klimatyzacja",
      source: "same_day_ac",
    },
    {
      icon: Circle,
      title: h.sameDayTires,
      href: "/opony",
      source: "same_day_tires",
    },
  ] as const;

  return (
    <section className="py-10 sm:py-12 border-t border-bm-border/40" aria-labelledby="same-day-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2 id="same-day-heading" className="font-display text-2xl md:text-3xl font-bold uppercase text-glow">
          {h.sameDayTitle}
        </h2>
        <p className="mt-2 text-sm text-bm-muted max-w-2xl">{h.sameDaySubtitle}</p>

        <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <li
              key={item.source}
              className="rounded-2xl border border-bm-border/60 bg-bm-card/50 p-4 flex flex-col"
            >
              <item.icon className="w-6 h-6 text-bm-red" aria-hidden />
              <p className="mt-3 font-display uppercase text-xs sm:text-sm leading-snug">{item.title}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-bm-muted">
                <Clock size={14} />
                {h.sameDayEta}
              </p>
              <BookingLink
                href={item.href}
                trackSource={item.source}
                className="btn-primary mt-4 text-[11px] sm:text-xs inline-flex justify-center"
              >
                {h.sameDayBook}
              </BookingLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
