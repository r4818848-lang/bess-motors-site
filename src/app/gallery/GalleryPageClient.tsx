"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import { useMetaViewContent } from "@/hooks/useMetaViewContent";
import type { PublicGalleryItem } from "@/app/api/gallery/route";
import Link from "next/link";
import { GalleryBeforeAfter } from "@/components/gallery/GalleryBeforeAfter";
import { WorkshopPhotosGrid } from "@/components/gallery/WorkshopPhotosGrid";
import { InstagramReelsSection } from "@/components/gallery/InstagramReelsSection";
import { OurWorksSection } from "@/components/gallery/OurWorksSection";

type GalleryTab = "workshop" | "works" | "repairs";

export default function GalleryPageClient() {
  const { t } = useI18n();
  const g = t.galleryPage;
  const searchParams = useSearchParams();
  useMetaViewContent("Gallery");
  const [items, setItems] = useState<PublicGalleryItem[]>([]);
  const [makeFilter, setMakeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<GalleryTab>("works");

  useEffect(() => {
    const fromUrl = searchParams.get("tab");
    if (fromUrl === "works" || fromUrl === "repairs" || fromUrl === "workshop") {
      setTab(fromUrl);
    }
  }, [searchParams]);

  const selectTab = (id: GalleryTab) => {
    setTab(id);
    const url = id === "works" ? "/gallery?tab=works" : `/gallery?tab=${id}`;
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((data: { items?: PublicGalleryItem[] }) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const tabs: { id: GalleryTab; label: string }[] = [
    { id: "workshop", label: g.tabWorkshop },
    { id: "works", label: g.tabOurWorks },
    { id: "repairs", label: g.tabRepairs },
  ];

  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold uppercase text-glow">{g.title}</h1>
          <p className="mt-4 text-bm-muted max-w-2xl">{g.subtitle}</p>
          <div className="mt-4 h-1 w-24 bg-bm-red shadow-neon-sm" />
        </motion.div>

        <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label={g.title}>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => selectTab(id)}
              className={clsx(
                "px-4 py-2 rounded-full text-xs font-bold uppercase border transition-colors",
                tab === id
                  ? "bg-bm-red/20 border-bm-red text-bm-red"
                  : "border-bm-border text-bm-muted hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "workshop" && (
          <div className="mt-10 space-y-12" role="tabpanel">
            <div>
              <h2 className="font-display text-xl uppercase text-glow mb-2">{t.workshopGallery.title}</h2>
              <p className="text-sm text-bm-muted mb-6 max-w-2xl">{t.workshopGallery.subtitle}</p>
              <WorkshopPhotosGrid heroFirst />
            </div>
            <InstagramReelsSection showHeader />
          </div>
        )}

        {tab === "works" && (
          <div className="mt-10" role="tabpanel">
            <OurWorksSection showHeader />
          </div>
        )}

        {tab === "repairs" && (
          <div className="mt-10" role="tabpanel">
            {loading && (
              <p className="text-center text-bm-muted animate-pulse">{g.loading}</p>
            )}

            {!loading && items.length > 0 && (
              <>
                <h2 className="font-display text-xl uppercase text-glow mb-6">{g.repairsTitle}</h2>
                <GalleryBeforeAfter items={items} />

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
              </>
            )}

            {!loading && items.length === 0 && (
              <div className="text-center glass-red rounded-2xl p-10 neon-border max-w-xl mx-auto">
                <p className="text-bm-muted">{g.empty}</p>
                <p className="text-sm text-bm-muted/80 mt-3">{g.emptyHint}</p>
                <Link href="/booking" className="btn-primary inline-block mt-6 text-sm">
                  {g.book}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
