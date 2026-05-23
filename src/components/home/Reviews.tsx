"use client";

import { Star, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { Card } from "@/components/ui/Card";

export function Reviews() {
  const { t } = useI18n();

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide">
            {t.sections.reviews}
          </h2>
          <a
            href={siteConfig.googleMapsReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline text-xs inline-flex items-center gap-2 shrink-0"
          >
            <ExternalLink size={14} /> {t.reviewsExt.googleCta}
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {t.reviews.map((r, i) => (
            <Card key={i} delay={i * 0.1}>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-bm-red text-bm-red" />
                ))}
              </div>
              <p className="text-bm-muted italic">&ldquo;{r.text}&rdquo;</p>
              <div className="mt-4 pt-4 border-t border-bm-border">
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-bm-red">{r.car}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
