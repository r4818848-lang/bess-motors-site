"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import { Card } from "@/components/ui/Card";

type ReviewTag = "all" | "chip" | "brakes" | "diagnostic" | "detailing";

type ApiRating = {
  id: string;
  stars: number;
  comment?: string;
  clientName: string;
  tag?: string;
};

export function Reviews() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<ReviewTag>("all");
  const [apiReviews, setApiReviews] = useState<ApiRating[]>([]);

  useEffect(() => {
    fetch("/api/ratings")
      .then((r) => r.json())
      .then((data: { ratings?: ApiRating[] }) => setApiReviews(data.ratings ?? []))
      .catch(() => setApiReviews([]));
  }, []);

  const tags: { id: ReviewTag; label: string }[] = [
    { id: "all", label: t.reviewsFilter.all },
    { id: "chip", label: t.reviewsFilter.chip },
    { id: "brakes", label: t.reviewsFilter.brakes },
    { id: "diagnostic", label: t.reviewsFilter.diagnostic },
    { id: "detailing", label: t.reviewsFilter.detailing },
  ];

  const merged = useMemo(() => {
    const fromApi = apiReviews.map((r) => ({
      name: r.clientName,
      car: "BESS MOTORS",
      rating: r.stars,
      text: r.comment ?? "",
      tag: (r.tag as ReviewTag) ?? ("all" as ReviewTag),
    }));
    return [...fromApi, ...t.reviews];
  }, [apiReviews, t.reviews]);

  const filtered = useMemo(() => {
    if (filter === "all") return merged;
    return merged.filter((r) => r.tag === filter);
  }, [merged, filter]);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
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

        <div className="flex flex-wrap gap-2 mb-8">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setFilter(tag.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border transition-all ${
                filter === tag.id
                  ? "bg-bm-red/20 border-bm-red text-bm-red"
                  : "border-bm-border text-bm-muted hover:text-white"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {filtered.map((r, i) => (
            <Card key={`${r.name}-${i}`} delay={i * 0.1}>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-bm-red text-bm-red" />
                ))}
              </div>
              <p className="text-bm-muted italic">
                {r.text ? `“${r.text}”` : "★".repeat(r.rating)}
              </p>
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
