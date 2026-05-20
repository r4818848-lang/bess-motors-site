"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { galleryProjects } from "@/lib/data";

const filters = ["all", "tuning", "detailing", "paint"] as const;

export default function GalleryPage() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [hovered, setHovered] = useState<number | null>(null);

  const filtered =
    filter === "all"
      ? galleryProjects
      : galleryProjects.filter((p) => p.category === filter);

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h1 className="font-display text-4xl font-bold uppercase text-glow">{t.gallery.title}</h1>
        <p className="mt-4 text-bm-muted">{t.gallery.subtitle}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm uppercase tracking-wide transition-all ${
                filter === f ? "bg-bm-red shadow-neon-sm" : "glass text-bm-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="relative aspect-[4/3] rounded-xl overflow-hidden glass-red neon-border cursor-pointer group"
                onMouseEnter={() => setHovered(project.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="absolute inset-0 flex">
                  <div
                    className="w-1/2 h-full transition-all duration-500"
                    style={{
                      background: project.before,
                      width: hovered === project.id ? "30%" : "50%",
                    }}
                  />
                  <div
                    className="h-full flex-1 transition-all duration-500"
                    style={{ background: project.after }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="text-xs uppercase text-bm-red tracking-widest">
                    {project.category}
                  </span>
                  <h3 className="font-display font-bold mt-1">{project.title}</h3>
                  <div className="flex gap-4 mt-2 text-xs text-bm-muted">
                    <span>{t.gallery.before}</span>
                    <span>→</span>
                    <span className="text-bm-red">{t.gallery.after}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
