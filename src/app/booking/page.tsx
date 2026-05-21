"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BookingQuoteFlow } from "@/components/booking/BookingQuoteFlow";

export default function BookingPage() {
  const { t } = useI18n();
  const [done, setDone] = useState(false);

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
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
        {done ? (
          <div className="glass-red rounded-2xl p-12 text-center neon-border max-w-lg mx-auto">
            <Check className="w-16 h-16 text-bm-red mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-glow">{t.booking.success}</h2>
            <p className="text-sm text-bm-muted mt-2">{t.bookingQuote.successHint}</p>
          </div>
        ) : (
          <BookingQuoteFlow onDone={() => setDone(true)} />
        )}
      </div>
    </div>
  );
}
