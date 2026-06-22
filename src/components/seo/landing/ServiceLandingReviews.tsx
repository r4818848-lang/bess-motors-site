"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
  const gr = t.googleReviewsBlock;
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

  const siteRatings = useMemo(() => {
    const filtered = tag
      ? apiReviews.filter((r) => r.tag === tag || r.tag === "all" || !r.tag)
      : apiReviews;
    return filtered.slice(0, 6);
  }, [apiReviews, tag]);

  const googleReviews = google?.reviews ?? [];
  const hasLiveGoogle = googleReviews.length > 0;
  const mapsUrl = google?.googleMapsUri || siteConfig.googleMapsReviewsUrl;

  return (
    <section className="mt-12" aria-labelledby="landing-reviews-heading">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 id="landing-reviews-heading" className="font-display text-xl uppercase">
            {t.googleReviews.title}
          </h2>
          <p className="text-sm text-bm-muted mt-2">
            {hasLiveGoogle && google?.userRatingCount
              ? sl.reviewsFromClients.replace("{count}", String(google.userRatingCount))
              : gr.subtitleFeatured.replace("{count}", String(FEATURED_GOOGLE_REVIEWS.length))}
          </p>
        </div>
        <Link
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline text-sm inline-flex items-center gap-2 shrink-0"
        >
          <ExternalLink size={14} />
          {gr.viewOnMaps}
        </Link>
      </div>

      {hasLiveGoogle ? (
        <div className="flex gap-4 overflow-x-auto pb-4 mb-8 snap-x snap-mandatory scrollbar-thin">
          {googleReviews.slice(0, 6).map((r, i) => (
            <article
              key={`g-${r.author}-${i}`}
              className="glass rounded-xl p-4 border border-bm-border/40 min-w-[260px] max-w-[300px] snap-start shrink-0"
            >
              <p className="text-sm text-bm-silver line-clamp-6">{r.text}</p>
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

      {siteRatings.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {siteRatings.map((r) => (
            <article
              key={r.id}
              className="glass rounded-xl p-5 border border-bm-border/40"
            >
              <p className="text-sm text-bm-muted italic">
                {r.comment ? `“${r.comment}”` : "★".repeat(r.stars)}
              </p>
              <p className="font-semibold text-sm mt-4">{r.clientName}</p>
            </article>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-bm-muted text-center mt-4">{sl.reviewsServiceHint}</p>
    </section>
  );
}
