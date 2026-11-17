"use client";

import { GoogleBusinessReviews } from "@/components/reviews/GoogleBusinessReviews";

export function GoogleReviewsBlock() {
  return (
    <GoogleBusinessReviews
      variant="default"
      className="border-t border-white/10 bg-[#121720] py-16 sm:py-20"
    />
  );
}
