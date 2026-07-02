"use client";

import Link from "next/link";
import { Tag } from "lucide-react";
import {
  getPromoRules,
  SITE_PROMO_DISPLAY,
  SITE_PROMO_PERCENT,
} from "@/lib/promo-codes";
import { useI18n } from "@/lib/i18n/context";

export function PromoBanner() {
  const { t } = useI18n();
  const promos = getPromoRules();
  if (!promos.length) return null;

  const p = promos[0];
  const displayCode = p.code === "BESSMOTORS" ? SITE_PROMO_DISPLAY : p.code;
  const text = t.promoBanner.text
    .replace("{code}", displayCode)
    .replace("{percent}", String(p.percentOff ?? SITE_PROMO_PERCENT));

  return (
    <div className="bg-bm-red/10 border-y border-bm-red/30">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-center gap-3 text-sm">
        <Tag size={16} className="text-bm-red shrink-0" />
        <span>
          {text.split(displayCode).map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>
                {part}
                <strong className="text-bm-red font-bold tracking-wide">{displayCode}</strong>
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </span>
        <Link href="/promocje" className="text-bm-red font-bold uppercase text-xs hover:underline">
          {t.promoBanner.cta}
        </Link>
      </div>
    </div>
  );
}
