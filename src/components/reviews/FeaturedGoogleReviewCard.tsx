"use client";

import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import type { FeaturedGoogleReview } from "@/lib/featured-google-reviews";
import { useI18n } from "@/lib/i18n/context";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function FeaturedGoogleReviewCard({
  review,
  compact = false,
}: {
  review: FeaturedGoogleReview;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const gr = t.googleReviewsBlock;

  return (
    <article
      className={`group relative flex flex-col rounded-xl border border-bm-border/50 bg-gradient-to-br from-bm-card/90 to-bm-black/80 backdrop-blur-sm transition-all hover:border-bm-red/40 hover:shadow-neon-sm ${
        compact ? "p-4 min-w-[260px] max-w-[300px] snap-start shrink-0" : "p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-bm-graphite border border-bm-border/60 flex items-center justify-center text-sm font-bold text-bm-red shrink-0">
            {review.author.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{review.author}</p>
            <p className="text-[10px] text-bm-muted">{review.date}</p>
          </div>
        </div>
        <GoogleMark />
      </div>

      <div className="flex gap-0.5 text-amber-400 mb-3">
        {Array.from({ length: 5 }).map((_, j) => (
          <Star
            key={j}
            size={compact ? 12 : 14}
            fill={j < review.rating ? "currentColor" : "none"}
            className={j < review.rating ? "" : "opacity-30"}
          />
        ))}
      </div>

      {review.text ? (
        <p
          className={`text-bm-silver flex-1 ${compact ? "text-sm line-clamp-5" : "text-sm leading-relaxed line-clamp-8"}`}
        >
          “{review.text}”
        </p>
      ) : null}

      <Link
        href={review.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-bm-red hover:underline group-hover:text-white transition-colors"
      >
        <ExternalLink size={12} />
        {gr.readReview}
      </Link>
    </article>
  );
}

export function FeaturedGoogleReviewsGrid({
  reviews,
  compact = false,
}: {
  reviews: FeaturedGoogleReview[];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
        {reviews.map((r) => (
          <FeaturedGoogleReviewCard key={r.id} review={r} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {reviews.map((r) => (
        <FeaturedGoogleReviewCard key={r.id} review={r} />
      ))}
    </div>
  );
}
