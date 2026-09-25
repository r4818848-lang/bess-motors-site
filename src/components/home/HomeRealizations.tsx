"use client";

import Link from "next/link";
import { Camera } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { OurWorksSection } from "@/components/gallery/OurWorksSection";

/** 3–6 best real jobs on homepage — full list on /gallery */
export function HomeRealizations() {
  const { t } = useI18n();
  const ow = t.ourWorks;

  return (
    <section
      className="py-12 sm:py-16 border-t border-white/10 bg-bm-card/20"
      aria-labelledby="realizations-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2
              id="realizations-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight"
            >
              {ow.title}
            </h2>
            <p className="text-sm text-bm-muted mt-2 max-w-2xl">{ow.subtitle}</p>
          </div>
          <Link
            href="/gallery?tab=works"
            className="btn-outline text-sm inline-flex items-center gap-2"
          >
            <Camera size={16} aria-hidden />
            {ow.viewAllWorks}
          </Link>
        </div>
        <OurWorksSection showHeader={false} limit={6} />
      </div>
    </section>
  );
}
