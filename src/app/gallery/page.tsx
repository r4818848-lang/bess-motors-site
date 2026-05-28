"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { useMetaViewContent } from "@/hooks/useMetaViewContent";
import type { PublicGalleryItem } from "@/app/api/gallery/route";
import Link from "next/link";
import { GalleryBeforeAfter } from "@/components/gallery/GalleryBeforeAfter";

export default function GalleryPage() {
  const { t } = useI18n();
  const g = t.galleryPage;
  useMetaViewContent("Gallery");
  const [items, setItems] = useState<PublicGalleryItem[]>([]);
  const [makeFilter, setMakeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((data: { items?: PublicGalleryItem[] }) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold uppercase text-glow">{g.title}</h1>
          <p className="mt-4 text-bm-muted max-w-2xl">{g.subtitle}</p>
          <div className="mt-4 h-1 w-24 bg-bm-red shadow-neon-sm" />
        </motion.div>

        {loading && (
          <p className="mt-16 text-center text-bm-muted animate-pulse">{g.loading}</p>
        )}

        {!loading && items.length > 0 && <GalleryBeforeAfter items={items} />}

        {!loading && items.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMakeFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border ${
                makeFilter === "all"
                  ? "bg-bm-red/20 border-bm-red text-bm-red"
                  : "border-bm-border text-bm-muted"
              }`}
            >
              All
            </button>
            {[...new Set(items.map((i) => i.make).filter(Boolean))].map((make) => (
              <button
                key={make}
                type="button"
                onClick={() => setMakeFilter(make!)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border ${
                  makeFilter === make
                    ? "bg-bm-red/20 border-bm-red text-bm-red"
                    : "border-bm-border text-bm-muted"
                }`}
              >
                {make}
              </button>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="mt-16 text-center glass-red rounded-2xl p-10 neon-border max-w-xl mx-auto">
            <p className="text-bm-muted">{g.empty}</p>
            <p className="text-sm text-bm-muted/80 mt-3">{g.emptyHint}</p>
            <Link href="/booking" className="btn-primary inline-block mt-6 text-sm">
              {g.book}
            </Link>
          </div>
        )}

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items
            .filter((item) => makeFilter === "all" || item.make === makeFilter)
            .map((item, i) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl overflow-hidden border border-bm-border/60 bg-bm-card/50"
            >
              <h2 className="px-4 py-3 font-display text-sm uppercase text-bm-red border-b border-bm-border/40">
                {item.title}
              </h2>
              <div className="grid grid-cols-2 gap-0.5 bg-bm-border/30">
                {item.beforeUrl && (
                  <div className="relative aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.beforeUrl}
                      alt={`${item.title} — ${g.before}`}
                      className="object-cover w-full h-full"
                    />
                    <span className="absolute top-2 left-2 text-[10px] uppercase bg-black/70 px-2 py-0.5 rounded">
                      {g.before}
                    </span>
                  </div>
                )}
                {item.afterUrl && (
                  <div className="relative aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.afterUrl}
                      alt={`${item.title} — ${g.after}`}
                      className="object-cover w-full h-full"
                    />
                    <span className="absolute top-2 left-2 text-[10px] uppercase bg-bm-red/90 px-2 py-0.5 rounded">
                      {g.after}
                    </span>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  );
}
