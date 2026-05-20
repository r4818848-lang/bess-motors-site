"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { stats } from "@/lib/data";

export function StatsSection() {
  const { t } = useI18n();

  return (
    <section className="py-16 border-y border-bm-border/50 bg-bm-graphite/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center glass-red rounded-xl py-8 px-4"
            >
              <p className="font-display text-4xl font-bold text-bm-red text-glow">{s.value}</p>
              <p className="mt-2 text-sm text-bm-muted uppercase tracking-wide">
                {t.stats[s.key]}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
