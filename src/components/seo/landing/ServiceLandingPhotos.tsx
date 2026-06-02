"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { ServiceId } from "@/lib/services-catalog";
import { getServiceLandingGalleryTags } from "@/lib/service-landing-content";
import type { PublicGalleryItem } from "@/app/api/gallery/route";
import { Wrench, Camera } from "lucide-react";

const FALLBACK_IMAGES = [
  { src: "/images/banner.png", alt: "Warsztat BESS MOTORS" },
  { src: "/images/hero-car.png", alt: "Serwis samochodowy" },
  { src: "/images/logo.png", alt: "BESS MOTORS" },
];

export function ServiceLandingPhotos({
  serviceId,
  slug,
}: {
  serviceId: ServiceId;
  slug: string;
}) {
  const { t } = useI18n();
  const sl = t.serviceLanding;
  const [items, setItems] = useState<PublicGalleryItem[]>([]);

  useEffect(() => {
    const tags = getServiceLandingGalleryTags(serviceId, slug);
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((data: { items?: PublicGalleryItem[] }) => {
        const all = data.items ?? [];
        if (!tags?.length) {
          setItems(all.slice(0, 9));
          return;
        }
        const filtered = all.filter((item) => {
          const hay = `${item.make ?? ""} ${item.title ?? ""}`.toLowerCase();
          return tags.some((tag) => hay.includes(tag.toLowerCase()));
        });
        setItems((filtered.length ? filtered : all).slice(0, 9));
      })
      .catch(() => setItems([]));
  }, [serviceId, slug]);

  const showGallery = items.filter((i) => i.afterUrl || i.beforeUrl);
  const tiles =
    showGallery.length > 0
      ? showGallery.map((item) => ({
          key: item.id,
          src: item.afterUrl || item.beforeUrl || "",
          alt: item.title || item.make || "BESS MOTORS",
        }))
      : FALLBACK_IMAGES.map((f, i) => ({ key: `fb-${i}`, src: f.src, alt: f.alt }));

  return (
    <section className="mt-12" aria-labelledby="landing-photos-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <h2 id="landing-photos-heading" className="font-display text-xl uppercase">
          {sl.photosTitle}
        </h2>
        <Link href="/gallery" className="text-sm text-bm-red hover:underline inline-flex items-center gap-1">
          <Camera size={14} />
          {sl.photosGalleryLink}
        </Link>
      </div>
      <p className="text-sm text-bm-muted mb-4">{sl.photosHint}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <div
            key={tile.key}
            className="relative aspect-[4/3] rounded-xl overflow-hidden border border-bm-border/40 bg-bm-surface/50"
          >
            {tile.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tile.src} alt={tile.alt} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-bm-muted">
                <Wrench size={32} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
