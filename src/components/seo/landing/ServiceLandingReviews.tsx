"use client";

import { GoogleBusinessReviews } from "@/components/reviews/GoogleBusinessReviews";

export function ServiceLandingReviews({ serviceId: _serviceId }: { serviceId?: string }) {
  return (
    <GoogleBusinessReviews variant="compact" className="mt-12" />
  );
}
