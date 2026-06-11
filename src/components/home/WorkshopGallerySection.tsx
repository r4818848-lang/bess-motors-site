"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { PublicGalleryItem } from "@/app/api/gallery/route";
import { WORKSHOP_PHOTOS } from "@/lib/workshop-photos";
import { WorkshopPhotosGrid } from "@/components/gallery/WorkshopPhotosGrid";

export function WorkshopGallerySection() {
  const { t } = useI18n();
  const wg = t.workshopGallery;
  const gp = t.galleryPage;
  const [items, setItems] = useState<PublicGalleryItem[]>([]);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((data: { items?: PublicGalleryItem[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  const repairTiles = items
    .filter((i) => i.afterUrl || i.beforeUrl)
    .slice(0, 4)
    .map((item) => ({
      key: item.id,
      src: item.afterUrl || item.beforeUrl || "",
      alt: item.title || "BESS MOTORS",
      caption: item.make,
    }));

  return (
    <section className="py-16 border-t border-bm-border/30">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl uppercase text-glow">{wg.title}</h2>
            <p className="text-sm text-bm-muted mt-2 max-w-2xl">{wg.subtitle}</p>
          </div>
          <Link href="/gallery" className="btn-outline text-sm inline-flex items-center gap-2">
            <Camera size={16} />
            {wg.viewAll}
          </Link>
        </div>

        <WorkshopPhotosGrid heroFirst />

        {repairTiles.length > 0 ? (
          <div className="mt-10">
            <h3 className="font-display text-sm uppercase text-bm-muted mb-4 tracking-wide">
              {gp.repairsTitle}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {repairTiles.map((tile) => (
                <Link
                  key={tile.key}
                  href="/gallery"
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-bm-border/40 bg-bm-surface/50"
                >
                  <Image
                    src={tile.src}
                    alt={tile.alt}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    unoptimized={tile.src.startsWith("data:")}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
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
        ) : null}

        <p className="sr-only">
          {WORKSHOP_PHOTOS.map((p) => t.workshopPhotos[p.id].alt).join("; ")}
        </p>
      </div>
    </section>
  );
}
