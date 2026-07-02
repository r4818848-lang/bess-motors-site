"use client";

import { useI18n } from "@/lib/i18n/context";

type Variant = "hero" | "bar" | "banner";

type PlaqueProps = {
  refrigerant: string;
  hookupLabel: string;
  hookupOld: string;
  hookupNew: string;
  gasLabel: string;
  gasOld: string;
  gasNew: string;
  discountBadge: string;
  variant: Variant;
};

function RechargePlaque({
  refrigerant,
  hookupLabel,
  hookupOld,
  hookupNew,
  gasLabel,
  gasOld,
  gasNew,
  discountBadge,
  variant,
}: PlaqueProps) {
  const isBanner = variant === "banner";
  const isBar = variant === "bar";

  const shell = isBar
    ? "inline-flex flex-col gap-0.5 rounded-lg bg-black/25 px-2.5 py-1.5 text-left min-w-[9.5rem]"
    : isBanner
      ? "flex flex-col gap-1.5 rounded-xl border border-bm-red/50 bg-bm-red/10 px-4 py-3 min-w-[10.5rem] flex-1"
      : "flex flex-col gap-1.5 rounded-xl border border-white/25 bg-black/35 px-3 py-2.5 min-w-[10rem] flex-1";

  const titleCls = isBar
    ? "text-[10px] font-bold uppercase tracking-wide text-white"
    : isBanner
      ? "font-display text-sm font-bold uppercase text-bm-red"
      : "text-xs font-bold uppercase tracking-wide text-white";

  const rowCls = isBar ? "text-[10px] leading-tight" : "text-xs leading-snug";
  const labelCls = isBanner ? "text-bm-muted" : "text-white/70";
  const oldCls = isBanner
    ? "line-through text-bm-muted/80"
    : "line-through text-white/45";
  const newCls = isBanner ? "text-bm-red font-bold" : "text-white font-bold";
  const badgeCls = isBanner
    ? "text-[10px] font-bold text-bm-red"
    : "text-[10px] font-bold text-bm-red/90";

  return (
    <div className={shell}>
      <div className="flex items-center justify-between gap-2">
        <span className={titleCls}>{refrigerant}</span>
        <span className={badgeCls}>{discountBadge}</span>
      </div>
      <div className={`${rowCls} ${labelCls}`}>
        {hookupLabel}:{" "}
        <span className={oldCls}>{hookupOld}</span>{" "}
        <span className={newCls}>{hookupNew}</span>
      </div>
      <div className={`${rowCls} ${labelCls}`}>
        {gasLabel}:{" "}
        <span className={oldCls}>{gasOld}</span>{" "}
        <span className={newCls}>{gasNew}</span>
      </div>
    </div>
  );
}

type Props = {
  variant?: Variant;
  className?: string;
};

export function AcPromoPriceBadges({ variant = "hero", className = "" }: Props) {
  const { t } = useI18n();
  const s = t.seasonalAc;

  const layout =
    variant === "bar"
      ? "inline-flex flex-wrap items-stretch gap-2"
      : "grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl";

  return (
    <div className={`${layout} ${className}`}>
      <RechargePlaque
        variant={variant}
        refrigerant={s.priceR134aLabel}
        hookupLabel={s.priceHookupLabel}
        hookupOld={s.priceHookupOld}
        hookupNew={s.priceHookupNew}
        gasLabel={s.priceCertifiedGasLabel}
        gasOld={s.priceR134aOld}
        gasNew={s.priceR134aNew}
        discountBadge={s.discountBadge}
      />
      <RechargePlaque
        variant={variant}
        refrigerant={s.priceR1234Label}
        hookupLabel={s.priceHookupLabel}
        hookupOld={s.priceHookupOld}
        hookupNew={s.priceHookupNew}
        gasLabel={s.priceCertifiedGasLabel}
        gasOld={s.priceR1234Old}
        gasNew={s.priceR1234New}
        discountBadge={s.discountBadge}
      />
    </div>
  );
}
