"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { WORKSHOP_PHOTOS, type WorkshopPhotoId } from "@/lib/workshop-photos";
import { clsx } from "clsx";

type Props = {
  className?: string;
  /** First tile spans 2 cols on md+ (good for exterior hero) */
  heroFirst?: boolean;
};

export function WorkshopPhotosGrid({ className, heroFirst = false }: Props) {
  const { t } = useI18n();
  const photos = t.workshopPhotos;

  return (
    <div
      className={clsx(
        "grid grid-cols-1 sm:grid-cols-2 gap-3",
        heroFirst && "lg:grid-cols-4",
        className
      )}
    >
      {WORKSHOP_PHOTOS.map((photo, index) => {
        const meta = photos[photo.id as WorkshopPhotoId];
        const isHero = heroFirst && index === 0;
        return (
          <figure
            key={photo.id}
            className={clsx(
              "group relative overflow-hidden rounded-xl border border-bm-border/40 bg-bm-surface/50",
              isHero ? "sm:col-span-2 lg:row-span-2 aspect-[16/10] lg:aspect-auto lg:min-h-[320px]" : "aspect-[4/3]"
            )}
          >
            <Image
              src={photo.src}
              alt={meta.alt}
              fill
              sizes={isHero ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 640px) 100vw, 25vw"}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              priority={index === 0}
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 py-3 pt-10">
              <p className="text-sm font-semibold text-white">{meta.caption}</p>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
