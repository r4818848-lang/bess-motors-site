"use client";

import { GoogleBusinessReviews } from "@/components/reviews/GoogleBusinessReviews";

export function GoogleReviewsBlock() {
  return (
    <GoogleBusinessReviews
      variant="default"
      className="py-16 border-t border-bm-border/30"
    />
  );
}
