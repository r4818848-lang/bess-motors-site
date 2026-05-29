"use client";

import Link from "next/link";
import { Tag } from "lucide-react";
import { getPromoRules } from "@/lib/promo-codes";
import { useI18n } from "@/lib/i18n/context";

export function PromoBanner() {
  const { t } = useI18n();
  const promos = getPromoRules();
  if (!promos.length) return null;

  const p = promos[0];
  const text = t.promoBanner.text
    .replace("{code}", p.code)
    .replace("{percent}", String(p.percentOff));

  return (
    <div className="bg-bm-red/10 border-y border-bm-red/30">
      <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-center gap-3 text-sm">
        <Tag size={16} className="text-bm-red shrink-0" />
        <span>{text}</span>
        <Link href="/booking" className="text-bm-red font-bold uppercase text-xs hover:underline">
          {t.promoBanner.cta}
        </Link>
      </div>
    </div>
  );
}
