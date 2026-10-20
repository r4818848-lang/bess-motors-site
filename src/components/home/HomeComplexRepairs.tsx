"use client";

import Link from "next/link";
import { Clock, Cog, Settings2, Disc, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingLink } from "@/components/analytics/BookingLink";

const ITEMS = [
  {
    icon: Clock,
    href: "/wymiana-rozrzadu-warszawa",
    source: "complex_timing",
    key: "timing" as const,
  },
  {
    icon: Cog,
    href: "/wymiana-sprzegla-warszawa",
    source: "complex_clutch",
    key: "clutch" as const,
  },
  {
    icon: Settings2,
    href: "/serwis-skrzyni-automatycznej-warszawa",
    source: "complex_gearbox",
    key: "gearbox" as const,
  },
  {
    icon: Disc,
    href: "/serwis-haldex-warszawa",
    source: "complex_haldex",
    key: "haldex" as const,
  },
] as const;

/** Complex mechanical work — not just cheap oil changes */
export function HomeComplexRepairs() {
  const { t } = useI18n();
  const h = t.homeComplex;

  return (
    <section
      className="py-12 sm:py-16 border-t border-white/10"
      aria-labelledby="home-complex-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2
          id="home-complex-heading"
          className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight"
        >
          {h.title}
        </h2>
        <p className="mt-2 text-sm text-bm-muted max-w-2xl">{h.subtitle}</p>

        <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ITEMS.map((item) => (
            <li
              key={item.key}
              className="rounded-xl border border-white/10 bg-bm-card p-5 flex flex-col"
            >
              <item.icon className="w-5 h-5 text-bm-red" aria-hidden />
              <p className="mt-3 font-semibold text-white leading-snug">{h.items[item.key]}</p>
              <p className="mt-2 text-xs text-bm-muted flex-1">{h.quoteNote}</p>
              <BookingLink
                href={item.href}
                trackSource={item.source}
                className="mt-4 text-sm font-semibold text-bm-red hover:text-white transition-colors inline-flex items-center gap-1"
              >
                {h.cta}
                <ChevronRight size={14} aria-hidden />
              </BookingLink>
            </li>
          ))}
        </ul>

        <div className="mt-8 text-center">
          <Link
            href="/services"
            className="text-sm font-semibold text-bm-silver hover:text-white inline-flex items-center gap-1"
          >
            {h.allServices}
            <ChevronRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
