"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";

const STEP_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

export function HowRepairWorks() {
  const { t } = useI18n();
  const h = t.howRepair;

  return (
    <section className="py-12 sm:py-16 border-t border-white/10" aria-labelledby="how-repair-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2
          id="how-repair-heading"
          className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight"
        >
          {h.title}
        </h2>
        <p className="mt-2 text-sm text-bm-muted max-w-2xl">{h.subtitle}</p>
        <p className="mt-3 text-sm text-white/90 max-w-2xl border-l-2 border-bm-red pl-3">
          {h.policy}
        </p>

        <ol className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEP_KEYS.map((key, i) => (
            <motion.li
              key={key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/10 bg-bm-card p-4 sm:p-5"
            >
              <span className="font-display text-bm-red text-sm font-bold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 font-semibold text-white">{h.steps[key]}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
