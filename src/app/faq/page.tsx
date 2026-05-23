"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export default function FaqPage() {
  const { t } = useI18n();
  const f = t.faq;

  return (
    <div className="pt-28 pb-24">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold uppercase text-glow text-center">
            {f.title}
          </h1>
          <p className="text-center text-bm-muted mt-3 mb-10">{f.subtitle}</p>
        </motion.div>

        <div className="space-y-4">
          {f.items.map((item, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-red rounded-xl p-5 neon-border group"
            >
              <summary className="font-semibold cursor-pointer list-none flex justify-between gap-4">
                {item.q}
                <span className="text-bm-red group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-sm text-bm-muted mt-3 leading-relaxed">{item.a}</p>
            </motion.details>
          ))}
        </div>

        <div className="mt-12 text-center glass-red rounded-2xl p-8 neon-border">
          <p className="text-bm-silver mb-4">{f.cta}</p>
          <Link href="/booking" className="btn-primary inline-flex">
            {f.ctaButton}
          </Link>
        </div>
      </div>
    </div>
  );
}
