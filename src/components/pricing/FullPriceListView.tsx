"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import {
  HOURLY_RATE_PLN,
  itemsByCategory,
  priceCategories,
  priceListFooterNotes,
  type PriceCategoryId,
  type PriceListItem,
} from "@/lib/price-list";
import { unitPriceHint } from "@/lib/booking-cart";
import { BookingLink } from "@/components/analytics/BookingLink";
import { PhoneLink } from "@/components/analytics/PhoneLink";
import { siteConfig } from "@/lib/site";

function itemLabel(item: PriceListItem, locale: "pl" | "ru") {
  return locale === "ru" ? item.nameRu : item.namePl;
}

export function FullPriceListView() {
  const { locale, t } = useI18n();
  const loc = locale === "ru" ? "ru" : "pl";
  const [category, setCategory] = useState<PriceCategoryId>("diagnostic");

  const items = useMemo(() => itemsByCategory(category), [category]);

  return (
    <div>
      <div className="rounded-2xl border border-bm-red/40 bg-gradient-to-br from-bm-red/15 via-bm-card to-bm-black p-6 md:p-8 mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-bm-red font-bold mb-2">
          BESS MOTORS · PREMIUM SERVICE
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase text-glow">
          {t.priceList.title}
        </h1>
        <p className="mt-3 text-bm-muted max-w-2xl">{t.priceList.subtitle}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-bm-red/50 bg-bm-red/10 px-4 py-2 text-bm-red font-semibold">
            <Clock size={16} />
            {t.priceList.hourlyRate}: {HOURLY_RATE_PLN} zł/h
          </span>
          <PhoneLink className="inline-flex items-center gap-2 text-white hover:text-bm-red transition-colors">
            <Phone size={16} />
            {siteConfig.phone}
          </PhoneLink>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {priceCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide border transition-all ${
              category === cat.id
                ? "bg-bm-red/20 border-bm-red text-bm-red shadow-neon-sm"
                : "border-bm-border text-bm-muted hover:text-white hover:border-bm-red/40"
            }`}
          >
            {loc === "ru" ? cat.nameRu : cat.namePl}
          </button>
        ))}
      </div>

      <motion.div
        key={category}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-bm-border/60 overflow-hidden"
      >
        <div className="bg-bm-card/80 px-4 py-3 border-b border-bm-border/60">
          <h2 className="font-display text-lg uppercase text-bm-red">
            {loc === "ru"
              ? priceCategories.find((c) => c.id === category)?.nameRu
              : priceCategories.find((c) => c.id === category)?.namePl}
          </h2>
        </div>
        <ul className="divide-y divide-bm-border/40">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3.5 hover:bg-bm-red/5 transition-colors"
            >
              <span className="text-sm text-white/95 pr-4">{itemLabel(item, loc)}</span>
              <span className="text-sm font-mono font-bold text-bm-red shrink-0">
                {unitPriceHint(item, loc)}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>

      <div className="mt-10 rounded-xl border border-bm-border/50 bg-bm-card/40 p-5 md:p-6">
        <h3 className="font-display text-sm uppercase text-bm-muted mb-4 tracking-wide">
          {t.priceList.notesTitle}
        </h3>
        <ul className="space-y-2 text-sm text-bm-muted">
          {priceListFooterNotes.map((note) => (
            <li key={note.pl} className="flex gap-2">
              <span className="text-bm-red shrink-0">•</span>
              <span>{loc === "ru" ? note.ru : note.pl}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <BookingLink className="btn-premium text-center justify-center">
          {t.priceList.bookCta}
        </BookingLink>
        <Link
          href="/services"
          className="inline-flex items-center justify-center rounded-xl border border-bm-border px-6 py-3 text-sm font-semibold uppercase tracking-wide text-bm-muted hover:text-white hover:border-bm-red/50 transition-colors"
        >
          {t.sections.viewAll}
        </Link>
      </div>
    </div>
  );
}
