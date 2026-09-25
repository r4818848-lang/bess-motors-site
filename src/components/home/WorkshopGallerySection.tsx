"use client";

import Link from "next/link";
import { Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { WORKSHOP_PHOTOS } from "@/lib/workshop-photos";
import { WorkshopPhotosGrid } from "@/components/gallery/WorkshopPhotosGrid";

/** Single workshop photos block — realizations live in HomeRealizations */
export function WorkshopGallerySection() {
  const { t } = useI18n();
  const wg = t.workshopGallery;

  return (
    <section
      className="py-12 sm:py-16 border-t border-white/10"
      aria-labelledby="workshop-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2
              id="workshop-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight"
            >
              {wg.title}
            </h2>
            <p className="text-sm text-bm-muted mt-2 max-w-2xl">{wg.subtitle}</p>
          </div>
          <Link
            href="/gallery?tab=workshop"
            className="btn-outline text-sm inline-flex items-center gap-2"
          >
            <Wrench size={16} aria-hidden />
            {wg.viewAll}
          </Link>
        </div>

        <WorkshopPhotosGrid heroFirst limit={5} />

        <p className="sr-only">
          {WORKSHOP_PHOTOS.map((p) => t.workshopPhotos[p.id].alt).join("; ")}
        </p>
      </div>
    </section>
  );
}
