import { FEATURED_GOOGLE_REVIEWS } from "@/lib/featured-google-reviews";

/** Aggregate rating shown on site (curated Google reviews). */
export function businessAggregateRatingSchema() {
  const reviews = FEATURED_GOOGLE_REVIEWS.filter((r) => r.rating > 0);
  if (!reviews.length) return null;

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const ratingValue = (sum / reviews.length).toFixed(1);

  return {
    "@type": "AggregateRating" as const,
    ratingValue,
    reviewCount: String(reviews.length),
    bestRating: "5",
    worstRating: "1",
  };
}
