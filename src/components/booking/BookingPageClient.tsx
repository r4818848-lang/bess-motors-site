"use client";

import { Suspense } from "react";
import { useI18n } from "@/lib/i18n/context";
import { BookingQuoteFlow } from "@/components/booking/BookingQuoteFlow";
import { useMetaViewContent } from "@/hooks/useMetaViewContent";

/** Client island for the booking form — H1/NAP render on the server in page.tsx */
export function BookingPageClient() {
  const { t } = useI18n();
  useMetaViewContent("Booking Page");

  return (
    <Suspense
      fallback={
        <p className="text-center text-bm-muted py-20 animate-pulse">{t.common.loading}</p>
      }
    >
      <BookingQuoteFlow />
    </Suspense>
  );
}
