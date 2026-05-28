"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { BookingQuoteFlow } from "@/components/booking/BookingQuoteFlow";
import { useMetaViewContent } from "@/hooks/useMetaViewContent";

function BookingContent() {
  return <BookingQuoteFlow />;
}

export default function BookingPage() {
  const { t } = useI18n();
  useMetaViewContent("Booking Page");

  return (
    <motion.div className="pt-28 pb-20">
      <motion.div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-4xl font-bold uppercase text-glow">
            {t.booking.title}
          </h1>
          <p className="mt-3 text-bm-muted max-w-2xl mx-auto">{t.bookingQuote.subtitle}</p>
        </motion.div>
        <Suspense
          fallback={
            <p className="text-center text-bm-muted py-20 animate-pulse">{t.common.loading}</p>
          }
        >
          <BookingContent />
        </Suspense>
      </motion.div>
    </motion.div>
  );
}
