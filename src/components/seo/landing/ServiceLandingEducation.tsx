"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import type { ServiceId } from "@/lib/services-catalog";
import { getServiceLandingEducation } from "@/lib/service-landing-content";
import { pickLocalized } from "@/lib/service-landing-locale";

export function ServiceLandingEducation({
  serviceId,
  slug,
}: {
  serviceId: ServiceId;
  slug: string;
}) {
  const { t, locale } = useI18n();
  const items = getServiceLandingEducation(serviceId, slug);
  const [open, setOpen] = useState<number | null>(0);
  if (!items.length) return null;

  return (
    <section className="mt-12" aria-labelledby="landing-edu-heading">
      <h2 id="landing-edu-heading" className="font-display text-xl uppercase mb-4">
        {t.serviceLanding.educationTitle}
      </h2>
      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.title.pl}
              className="rounded-xl border border-bm-border/50 overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="font-semibold text-sm">
                  {pickLocalized(item.title, locale)}
                </span>
                <ChevronDown
                  size={18}
                  className={clsx("shrink-0 text-bm-red transition-transform", isOpen && "rotate-180")}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-sm text-bm-muted leading-relaxed border-t border-bm-border/30 pt-3">
                  {pickLocalized(item.body, locale)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
