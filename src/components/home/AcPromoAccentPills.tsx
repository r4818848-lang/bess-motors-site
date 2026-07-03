"use client";

import { Car, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

type Variant = "hero" | "bar" | "banner" | "landing";

type Props = {
  variant?: Variant;
  className?: string;
};

export function AcPromoAccentPills({ variant = "hero", className = "" }: Props) {
  const { t } = useI18n();
  const { accentAllCars, accentNoQueue } = t.seasonalAc;

  const pillCls =
    variant === "bar"
      ? "inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-white"
      : variant === "landing"
        ? "inline-flex items-center gap-2 rounded-full border border-bm-red/60 bg-bm-red/15 px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wide text-bm-red"
        : variant === "banner"
          ? "inline-flex items-center gap-2 rounded-full border border-bm-red/50 bg-bm-red/25 px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-white"
          : "inline-flex items-center gap-2 rounded-full border border-white/35 bg-bm-red/30 px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-white";

  const wrapCls =
    variant === "bar"
      ? "inline-flex flex-wrap items-center justify-center gap-2"
      : "flex flex-wrap gap-2";

  return (
    <div className={`${wrapCls} ${className}`}>
      <span className={pillCls}>
        <Car size={variant === "bar" ? 12 : 14} className="shrink-0" />
        {accentAllCars}
      </span>
      <span className={pillCls}>
        <Zap size={variant === "bar" ? 12 : 14} className="shrink-0" />
        {accentNoQueue}
      </span>
    </div>
  );
}
