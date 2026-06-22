"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import { siteConfig } from "@/lib/site";
import { FEATURED_GOOGLE_REVIEWS } from "@/lib/featured-google-reviews";
import {
  FeaturedGoogleReviewsGrid,
} from "@/components/reviews/FeaturedGoogleReviewCard";
import type { GooglePlaceReviewsPayload } from "@/lib/server/google-places-reviews";

type Props = {
  /** compact = service landing pages */
  variant?: "default" | "compact";
  className?: string;
};

export function GoogleBusinessReviews({ variant = "default", className = "" }: Props) {
  const { locale, t } = useI18n();
  const gr = t.googleReviewsBlock;
  const lang = contentLocale(locale);
  const [data, setData] = useState<GooglePlaceReviewsPayload | null>(null);

  useEffect(() => {
    fetch(`/api/google-reviews?lang=${lang}`)
      .then((r) => r.json())
      .then((payload: GooglePlaceReviewsPayload) => setData(payload))
      .catch(() => setData({ source: "unconfigured", reviews: [] }));
  }, [lang]);

  const mapsUrl = data?.googleMapsUri || siteConfig.googleMapsReviewsUrl;
  const writeReviewUrl = siteConfig.googleWriteReviewUrl;
  const apiReviews = data?.reviews ?? [];
  const hasApi = apiReviews.length > 0;
  const rating = data?.rating ?? 5;
  const count = data?.userRatingCount ?? FEATURED_GOOGLE_REVIEWS.length;

  const headingClass =
    variant === "compact"
      ? "font-display text-xl uppercase"
      : "font-display text-2xl uppercase text-glow";

  return (
    <section className={className} aria-labelledby="google-reviews-heading">
      <div className={variant === "compact" ? "" : "mx-auto max-w-6xl px-4"}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 id="google-reviews-heading" className={headingClass}>
              {t.googleReviews.title}
            </h2>
            <p className="text-sm text-bm-muted mt-2 max-w-xl">
              {hasApi && count > 0
                ? gr.subtitleGoogle
                    .replace("{rating}", rating.toFixed(1))
                    .replace("{count}", String(count))
                : gr.subtitleFeatured.replace("{count}", String(FEATURED_GOOGLE_REVIEWS.length))}
            </p>
            {hasApi && data?.placeName ? (
              <p className="text-xs text-bm-muted/80 mt-1">{data.placeName}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-sm inline-flex items-center gap-2"
            >
              <ExternalLink size={14} />
              {gr.viewOnMaps}
            </Link>
            <Link
              href={writeReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              {gr.leaveReview}
            </Link>
          </div>
        </div>

        {hasApi ? (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin mb-8">
            {apiReviews.map((r, i) => (
              <article
                key={`${r.author}-${i}`}
                className="glass rounded-xl p-5 border border-bm-border/40 min-w-[280px] max-w-[320px] snap-start shrink-0"
              >
                <div className="flex items-center gap-3 mb-3">
                  {r.profilePhotoUrl ? (
                    <Image
                      src={r.profilePhotoUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-bm-graphite flex items-center justify-center text-xs font-bold text-bm-red">
                      G
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.author}</p>
                    {r.relativeTime ? (
                      <p className="text-[10px] text-bm-muted">{r.relativeTime}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-0.5 text-amber-400 mb-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      fill={j < r.rating ? "currentColor" : "none"}
                      className={j < r.rating ? "" : "opacity-30"}
                    />
                  ))}
                </div>
                <p className="text-sm text-bm-silver line-clamp-6">{r.text}</p>
                <p className="text-[10px] text-bm-muted mt-3 uppercase tracking-wider">Google</p>
              </article>
            ))}
          </div>
        ) : null}

        <FeaturedGoogleReviewsGrid
          reviews={FEATURED_GOOGLE_REVIEWS}
          compact={variant === "compact"}
        />
      </div>
    </section>
  );
}
