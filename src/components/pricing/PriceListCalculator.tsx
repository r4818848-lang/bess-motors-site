"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { pickName } from "@/lib/i18n/locale-utils";
import { getPriceItem, priceListItems } from "@/lib/price-list";
import { buildCartLine, cartSubtotal, formatPln, unitPriceHint } from "@/lib/booking-cart";
import { BookingLink } from "@/components/analytics/BookingLink";
import { buildBookingUrl } from "@/lib/booking-url";

export function PriceListCalculator() {
  const { t, locale } = useI18n();
  const c = t.priceCalculator;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const popular = useMemo(
    () =>
      [
        "oil_filter",
        "computer_diag",
        "brake_pads_front",
        "ac_r134a",
        "alignment",
        "stage1",
      ]
        .map((id) => getPriceItem(id))
        .filter(Boolean),
    []
  );

  const lines = useMemo(() => {
    return [...selected]
      .map((id) => getPriceItem(id))
      .filter(Boolean)
      .map((item) => buildCartLine(item!, pickName(item!, locale), 1));
  }, [selected, locale]);

  const total = cartSubtotal(lines);
  const bookingHref = buildBookingUrl([...selected]);

  return (
    <div className="rounded-2xl border border-bm-red/30 bg-bm-card/60 p-5 mb-10">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="text-bm-red" size={20} />
        <h2 className="font-display text-sm uppercase text-bm-red">{c.title}</h2>
      </div>
      <p className="text-sm text-bm-muted mb-4">{c.subtitle}</p>
      <div className="grid sm:grid-cols-2 gap-2 mb-4">
        {popular.map((item) => {
          if (!item) return null;
          const on = selected.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={`text-left rounded-lg border p-3 transition-all ${
                on
                  ? "border-bm-red bg-bm-red/15"
                  : "border-bm-border/60 hover:border-bm-red/40"
              }`}
            >
              <p className="text-sm font-medium text-white">{pickName(item, locale)}</p>
              <p className="text-xs text-bm-red font-mono mt-1">{unitPriceHint(item, locale)}</p>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-bm-muted mb-2">
        {c.moreHint}{" "}
        <span className="text-bm-silver">
          ({priceListItems.length} {c.positions})
        </span>
      </p>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-bm-border/40">
        <div>
          <p className="text-xs uppercase text-bm-muted">{c.total}</p>
          <p className="font-display text-2xl font-bold text-bm-red">{formatPln(total)}</p>
        </div>
        <BookingLink href={bookingHref} className="btn-primary text-sm">
          {c.book}
        </BookingLink>
      </div>
    </div>
  );
}
