"use client";

import Link from "next/link";
import { brandLandingExtras, bookingUrlForService } from "@/lib/brand-service-links";
import type { ServiceId } from "@/lib/services-catalog";
import { useI18n } from "@/lib/i18n/context";
import { pickTitle } from "@/lib/i18n/locale-utils";

export function BrandServiceBlock({ slug }: { slug: string }) {
  const { locale, t } = useI18n();
  const block = brandLandingExtras[slug];
  if (!block) return null;

  return (
    <div className="mt-10 rounded-xl border border-bm-border/50 p-6 bg-bm-card/30">
      <h2 className="font-display text-lg uppercase mb-4">{pickTitle(block, locale)}</h2>
      <div className="flex flex-wrap gap-2">
        {block.serviceIds.map((id) => (
          <Link
            key={id}
            href={bookingUrlForService(id as ServiceId)}
            className="px-3 py-2 rounded-lg border border-bm-border text-sm hover:border-bm-red hover:text-bm-red transition-colors"
          >
            {t.serviceItems[id as keyof typeof t.serviceItems] ?? id}
          </Link>
        ))}
      </div>
    </div>
  );
}
