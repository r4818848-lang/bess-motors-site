"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { PublicGalleryItem } from "@/app/api/gallery/route";

const WORKSHOP_STOCK = [
  { src: "/images/banner.png", alt: "Warsztat BESS MOTORS — strefa serwisowa" },
  { src: "/images/hero-car.png", alt: "Samochód na stanowisku diagnostycznym" },
];

export function WorkshopGallerySection() {
  const { t } = useI18n();
  const wg = t.workshopGallery;
  const [items, setItems] = useState<PublicGalleryItem[]>([]);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((data: { items?: PublicGalleryItem[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  const fromCrm = items
    .filter((i) => i.afterUrl || i.beforeUrl)
    .slice(0, 8)
    .map((item) => ({
      key: item.id,
      src: item.afterUrl || item.beforeUrl || "",
      alt: item.title || "BESS MOTORS",
      caption: item.make,
    }));

  const tiles =
    fromCrm.length >= 3
      ? fromCrm
      : [
          ...fromCrm,
          ...WORKSHOP_STOCK.map((s, i) => ({
            key: `stock-${i}`,
            src: s.src,
            alt: s.alt,
            caption: undefined as string | undefined,
          })),
        ].slice(0, 8);

  return (
    <section className="py-16 border-t border-bm-border/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl uppercase text-glow">{wg.title}</h2>
            <p className="text-sm text-bm-muted mt-2 max-w-2xl">{wg.subtitle}</p>
          </div>
          <Link
            href="/gallery"
            className="btn-outline text-sm inline-flex items-center gap-2"
          >
            <Camera size={16} />
            {wg.viewAll}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiles.map((tile) => (
            <Link
              key={tile.key}
              href="/gallery"
              className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-bm-border/40 bg-bm-surface/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tile.src}
                alt={tile.alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
              {tile.caption ? (
                <p className="absolute bottom-2 left-2 right-2 text-xs font-semibold text-white truncate">
                  {tile.caption}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
