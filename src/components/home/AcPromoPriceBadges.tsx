"use client";

import { useI18n } from "@/lib/i18n/context";

type Variant = "hero" | "bar" | "banner";

type BadgeProps = {
  label: string;
  oldPrice: string;
  newPrice: string;
  variant: Variant;
};

function AcPriceBadge({ label, oldPrice, newPrice, variant }: BadgeProps) {
  const base =
    variant === "hero"
      ? "text-xs sm:text-sm font-bold text-white bg-black/30 rounded-lg px-2.5 py-1"
      : variant === "bar"
        ? "text-xs sm:text-sm font-semibold text-white/95 bg-black/20 rounded-lg px-2.5 py-1"
        : "inline-flex items-center gap-2 rounded-lg border border-bm-red/50 bg-bm-red/15 px-3 py-1 text-sm font-bold text-bm-red";

  const oldCls =
    variant === "banner"
      ? "line-through text-bm-muted/80 text-xs font-semibold"
      : "line-through text-white/55 text-[10px] sm:text-xs font-semibold";

  const newCls =
    variant === "banner" ? "text-bm-red" : "text-white";

  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${base}`}>
      <span className={variant === "banner" ? "uppercase text-[11px] tracking-wide" : ""}>
        {label}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className={oldCls}>{oldPrice}</span>
        <span className={newCls}>{newPrice}</span>
      </span>
    </span>
  );
}

type Props = {
  variant?: Variant;
  className?: string;
};

export function AcPromoPriceBadges({ variant = "hero", className = "" }: Props) {
  const { t } = useI18n();
  const s = t.seasonalAc;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <AcPriceBadge
        label={s.priceHookupLabel}
        oldPrice={s.priceHookupOld}
        newPrice={s.priceHookupNew}
        variant={variant}
      />
      <AcPriceBadge
        label={s.priceGasLabel}
        oldPrice={s.priceGasOld}
        newPrice={s.priceGasNew}
        variant={variant}
      />
    </div>
  );
}
