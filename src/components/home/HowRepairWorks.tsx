"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";

const STEP_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

export function HowRepairWorks() {
  const { t } = useI18n();
  const h = t.howRepair;
  const reducedMotion = useReducedMotion();

  return (
    <section className="border-t border-white/10 bg-gradient-to-b from-[#0d1016] to-[#151922] py-14 sm:py-20" aria-labelledby="how-repair-heading">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2
          id="how-repair-heading"
          className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          {h.title}
        </h2>
        <p className="mt-2 text-sm text-bm-muted max-w-2xl">{h.subtitle}</p>
        <p className="mt-3 text-sm text-white/90 max-w-2xl border-l-2 border-bm-red pl-3">
          {h.policy}
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEP_KEYS.map((key, i) => (
            <motion.li
              key={key}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-[22px] border border-white/10 bg-[#20242c] p-5 sm:p-6"
            >
              <span className="font-display text-[#ff7772] text-lg font-bold">
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
