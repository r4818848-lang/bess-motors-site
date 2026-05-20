"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { galleryProjects } from "@/lib/data";

export function BeforeAfter() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const project = galleryProjects[active];

  return (
    <section className="py-24 border-t border-bm-border/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wide">
            {t.sections.beforeAfter}
          </h2>
          <Link href="/gallery" className="text-bm-red text-sm font-semibold uppercase hover:underline">
            {t.sections.viewAll} →
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="relative aspect-video rounded-xl overflow-hidden glass-red neon-border">
            <div className="absolute inset-0 flex">
              <div
                className="w-1/2 h-full flex items-center justify-center"
                style={{ background: project.before }}
              >
                <span className="font-display text-sm uppercase tracking-widest opacity-60">
                  {t.gallery.before}
                </span>
              </div>
              <div
                className="w-1/2 h-full flex items-center justify-center border-l border-bm-red/50"
                style={{ background: project.after }}
              >
                <span className="font-display text-sm uppercase tracking-widest text-bm-red">
                  {t.gallery.after}
                </span>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-full bg-bm-red shadow-neon" />
          </div>

          <div>
            <h3 className="font-display text-2xl font-bold mb-4">{project.title}</h3>
            <div className="flex flex-wrap gap-2">
              {galleryProjects.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActive(i)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    active === i
                      ? "bg-bm-red text-white shadow-neon-sm"
                      : "glass text-bm-muted hover:text-white"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
            <motion.p
              key={active}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-6 text-bm-muted"
            >
              Premium {project.category} project — BESS MOTORS quality guarantee.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
