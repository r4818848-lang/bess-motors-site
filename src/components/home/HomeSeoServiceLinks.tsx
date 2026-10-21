"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Curated high-intent SEO links — not the full catalog (avoids footer-style clutter) */
const FEATURED_SEO_LINKS: { href: string; label: string }[] = [
  { href: "/wymiana-oleju-warszawa", label: "Wymiana oleju Warszawa" },
  { href: "/wulkanizacja-warszawa", label: "Wulkanizacja / opony" },
  { href: "/serwis-klimatyzacji-warszawa", label: "Serwis klimatyzacji" },
  { href: "/hamulce-warszawa", label: "Hamulce Warszawa" },
  { href: "/wymiana-rozrzadu-warszawa", label: "Wymiana rozrządu" },
  { href: "/wymiana-sprzegla-warszawa", label: "Wymiana sprzęgła" },
  { href: "/naprawa-zawieszenia-warszawa", label: "Naprawa zawieszenia" },
  { href: "/diagnostyka-komputerowa-warszawa", label: "Diagnostyka komputerowa" },
  { href: "/diagnostyka-elektryki-samochodowej-warszawa", label: "Diagnostyka elektryki" },
  { href: "/wymiana-turbosprezarki-warszawa", label: "Wymiana turbosprężarki" },
  { href: "/czyszczenie-dpf-warszawa", label: "Czyszczenie DPF" },
  { href: "/mechanik-warszawa-wlochy", label: "Mechanik Warszawa Włochy" },
];

export function HomeSeoServiceLinks() {
  return (
    <section
      className="py-10 sm:py-12 border-t border-white/10 bg-bm-surface/40"
      aria-labelledby="seo-services-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2
              id="seo-services-heading"
              className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight"
            >
              Usługi serwisowe Warszawa
            </h2>
            <p className="mt-2 text-sm text-bm-muted max-w-2xl">
              Najczęściej szukane usługi BESS MOTORS — Włochy, Aleja Krakowska 48/52.
            </p>
          </div>
          <Link href="/services" className="btn-outline text-sm inline-flex items-center gap-2">
            Wszystkie usługi
            <ChevronRight size={16} aria-hidden />
          </Link>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURED_SEO_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-bm-card px-4 py-3 text-sm text-bm-silver hover:border-bm-red/40 hover:text-white transition-colors"
              >
                <span className="font-medium leading-snug">{link.label}</span>
                <ChevronRight size={16} className="shrink-0 text-bm-red" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
