"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import { sitePartners } from "@/lib/site";

export function PartnersSection() {
  const { t, locale } = useI18n();
  const p = t.partners;
  const ru = contentLocale(locale) === "ru";

  return (
    <section className="py-20 border-t border-bm-border/40">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-bold uppercase text-glow mb-2">
          {p.title}
        </h2>
        <p className="text-sm text-bm-muted max-w-xl mx-auto mb-10">{p.subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {sitePartners.map((partner, i) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="wo-premium-badge-outline min-w-[120px] px-4 py-3"
            >
              <p className="font-display text-sm font-bold text-white">{partner.name}</p>
              <p className="text-[9px] text-bm-muted uppercase mt-1 tracking-wide">
                {ru ? partner.tagRu : partner.tagPl}
              </p>
            </motion.div>
          ))}
        </div>
        <p className="text-[10px] text-bm-muted/70 mt-8 max-w-lg mx-auto">{p.disclaimer}</p>
      </div>
    </section>
  );
}
