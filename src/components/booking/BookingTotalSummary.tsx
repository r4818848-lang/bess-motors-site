"use client";

import { AlertTriangle } from "lucide-react";
import {
  cartSubtotal,
  cartHasFromPrices,
  formatPln,
  type CartLine,
} from "@/lib/booking-cart";

interface Props {
  lines: CartLine[];
  title: string;
  grandLabel: string;
  fromWarning?: string;
  compact?: boolean;
  visitLabel?: string;
  visitValue?: string;
}

export function BookingTotalSummary({
  lines,
  title,
  grandLabel,
  fromWarning,
  compact,
  visitLabel,
  visitValue,
}: Props) {
  const total = cartSubtotal(lines);
  const hasFrom = cartHasFromPrices(lines);

  if (lines.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-bm-red/35 bg-bm-black/50 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-bm-red mb-2">{title}</p>
      {visitLabel && visitValue && (
        <p className="text-sm text-white mb-3 pb-2 border-b border-bm-border/30">
          <span className="text-bm-muted text-xs uppercase tracking-wide block mb-0.5">
            {visitLabel}
          </span>
          {visitValue}
        </p>
      )}
      <ul className={`space-y-1.5 ${compact ? "text-xs" : "text-sm"}`}>
        {lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-2 text-bm-silver">
            <span className="truncate pr-2">{line.label}</span>
            <span className="font-mono text-bm-red font-semibold shrink-0">
              {line.isFree ? "—" : formatPln(line.lineTotal)}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between items-baseline mt-3 pt-2 border-t border-bm-red/30">
        <span className="text-xs uppercase tracking-wide text-bm-muted">{grandLabel}</span>
        <span className="font-display text-xl font-bold text-bm-red font-mono">
          {formatPln(total)}
        </span>
      </div>
      {hasFrom && fromWarning && (
        <p className="text-[10px] text-amber-400/90 mt-2 flex gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {fromWarning}
        </p>
      )}
    </div>
  );
}
