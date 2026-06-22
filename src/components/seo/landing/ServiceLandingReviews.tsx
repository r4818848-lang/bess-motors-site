"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { siteConfig } from "@/lib/site";
import type { ServiceId } from "@/lib/services-catalog";
import type { GooglePlaceReviewsPayload } from "@/lib/server/google-places-reviews";
import { FEATURED_GOOGLE_REVIEWS } from "@/lib/featured-google-reviews";
import { FeaturedGoogleReviewsGrid } from "@/components/reviews/FeaturedGoogleReviewCard";

type ReviewTag = "all" | "chip" | "brakes" | "diagnostic" | "detailing";

type ApiRating = {
  id: string;
  stars: number;
  comment?: string;
  clientName: string;
  tag?: string;
};

const SERVICE_REVIEW_TAG: Partial<Record<ServiceId, ReviewTag>> = {
  brakePads: "brakes",
  brakesFull: "brakes",
  diagnostic: "diagnostic",
  chip: "chip",
  stage1: "chip",
  detailing: "detailing",
  polish: "detailing",
};

export function ServiceLandingReviews({ serviceId }: { serviceId?: ServiceId }) {
  const { t } = useI18n();
  const sl = t.serviceLanding;
  const [apiReviews, setApiReviews] = useState<ApiRating[]>([]);
  const [google, setGoogle] = useState<GooglePlaceReviewsPayload | null>(null);

  useEffect(() => {
    fetch("/api/ratings")
      .then((r) => r.json())
      .then((data: { ratings?: ApiRating[] }) => setApiReviews(data.ratings ?? []))
      .catch(() => setApiReviews([]));
    fetch("/api/google-reviews?lang=pl")
      .then((r) => r.json())
      .then((payload: GooglePlaceReviewsPayload) => setGoogle(payload))
      .catch(() => setGoogle({ source: "unconfigured", reviews: [] }));
  }, []);

  const tag = serviceId ? SERVICE_REVIEW_TAG[serviceId] : undefined;

  const cards = useMemo(() => {
    const fromApi = apiReviews.map((r) => ({
      name: r.clientName,
      car: "BESS MOTORS",
      rating: r.stars,
      text: r.comment ?? "",
      tag: (r.tag as ReviewTag) ?? ("all" as ReviewTag),
    }));
    const merged = [...fromApi, ...t.reviews];
    const filtered = tag
      ? merged.filter((r) => r.tag === tag || r.tag === "all")
      : merged;
    const unique = filtered.filter(
      (r, i, arr) =>
        arr.findIndex((x) => x.name === r.name && x.text === r.text) === i
    );
    return unique.slice(0, 6);
  }, [apiReviews, t.reviews, tag]);

  const googleReviews = google?.reviews ?? [];
  const mapsUrl = google?.googleMapsUri || siteConfig.googleMapsReviewsUrl;

  return (
    <section className="mt-12" aria-labelledby="landing-reviews-heading">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 id="landing-reviews-heading" className="font-display text-xl uppercase">
            {t.googleReviews.title}
          </h2>
          <p className="text-sm text-bm-muted mt-2">{sl.reviewsHint}</p>
          {googleReviews.length > 0 && google?.userRatingCount ? (
            <p className="text-xs text-bm-muted/80 mt-1">
              {sl.reviewsFromClients.replace("{count}", String(google.userRatingCount))}
            </p>
          ) : null}
        </div>
        <Link
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline text-sm inline-flex items-center gap-2 shrink-0"
        >
          <ExternalLink size={14} />
          {t.googleReviewsBlock.viewOnMaps}
        </Link>
      </div>

      {googleReviews.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4 mb-8 snap-x snap-mandatory scrollbar-thin">
          {googleReviews.slice(0, 4).map((r, i) => (
            <article
              key={`g-${r.author}-${i}`}
              className="glass rounded-xl p-4 border border-bm-border/40 min-w-[260px] max-w-[300px] snap-start shrink-0"
            >
              <div className="flex gap-0.5 text-amber-400 mb-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    size={12}
                    fill={j < r.rating ? "currentColor" : "none"}
                    className={j < r.rating ? "" : "opacity-30"}
                  />
                ))}
              </div>
              <p className="text-sm text-bm-silver line-clamp-5">{r.text}</p>
              <p className="text-xs font-semibold mt-3">{r.author}</p>
              <p className="text-[10px] text-bm-muted uppercase">Google</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <FeaturedGoogleReviewsGrid reviews={FEATURED_GOOGLE_REVIEWS} compact />
        </div>
      )}

      {cards.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((r, i) => (
            <article
              key={`${r.name}-${i}`}
              className="glass rounded-xl p-5 border border-bm-border/40"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-bm-red text-bm-red" />
                ))}
              </div>
              <p className="text-sm text-bm-muted italic">
                {r.text ? `“${r.text}”` : "★".repeat(r.rating)}
              </p>
              <div className="mt-4 pt-3 border-t border-bm-border/40">
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-bm-red">{r.car}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-bm-muted text-center mt-4">{sl.reviewsServiceHint}</p>
    </section>
  );
}
