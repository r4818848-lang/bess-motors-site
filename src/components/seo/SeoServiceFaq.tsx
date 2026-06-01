"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import type { ServiceId } from "@/lib/services-catalog";
import { getServiceLandingFaq } from "@/lib/service-landing-content";
import { pickLocalized } from "@/lib/service-landing-locale";

export function SeoServiceFaq({
  serviceId,
  slug,
}: {
  serviceId: ServiceId;
  slug: string;
}) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);

  const items = getServiceLandingFaq(serviceId, slug);
  if (!items.length) return null;

  return (
    <section className="mt-12" aria-labelledby="landing-faq-heading">
      <h2 id="landing-faq-heading" className="font-display text-xl uppercase mb-4">
        {t.seoServiceFaq.title}
      </h2>
      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q.pl}
              className="rounded-xl border border-bm-border/50 overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="font-semibold text-sm">{pickLocalized(item.q, locale)}</span>
                <ChevronDown
                  size={18}
                  className={clsx("shrink-0 text-bm-red transition-transform", isOpen && "rotate-180")}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-sm text-bm-muted leading-relaxed border-t border-bm-border/30 pt-3">
                  {pickLocalized(item.a, locale)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
