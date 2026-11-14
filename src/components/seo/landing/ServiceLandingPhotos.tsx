"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { Camera } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import type { ServiceId } from "@/lib/services-catalog";
import { WorkBeforeAfterList } from "@/components/gallery/WorkBeforeAfterCollage";
import { workCasesForLanding } from "@/lib/work-before-after";
import {
  galleryHrefForService,
  landingServicePhotos,
  landingWorkshopPhotos,
  type LandingPhoto,
} from "@/lib/service-landing-photos";

type Placement = "under-motion" | "section";

function PhotoGrid({ tiles, lang }: { tiles: LandingPhoto[]; lang: "pl" | "ru" }) {
  if (!tiles.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.src}
          className="relative aspect-[4/3] rounded-xl overflow-hidden border border-bm-border/40 bg-bm-surface/50"
        >
          <Image
            src={tile.src}
            alt={tile.alt[lang]}
            fill
            sizes="(max-width: 640px) 45vw, 240px"
            quality={75}
            loading="lazy"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export function ServiceLandingPhotos({
  serviceId,
  slug,
  placement = "section",
}: {
  serviceId: ServiceId;
  slug: string;
  placement?: Placement;
}) {
  const { t, locale } = useI18n();
  const sl = t.serviceLanding;
  const lang = contentLocale(locale);
  const servicePhotos = useMemo(() => landingServicePhotos(serviceId), [serviceId]);
  const workshop = useMemo(() => landingWorkshopPhotos(), []);
  const cases = useMemo(() => workCasesForLanding(slug, serviceId), [slug, serviceId]);
  const galleryHref = galleryHrefForService(serviceId);

  if (placement === "under-motion") {
    const tiles = servicePhotos.length ? servicePhotos.slice(0, 4) : workshop;
    const title = servicePhotos.length ? sl.photosServiceTitle : sl.photosWorkshopTitle;
    return (
      <section className="mt-8" aria-labelledby="landing-photos-hero-heading">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <h2 id="landing-photos-hero-heading" className="text-sm font-bold uppercase tracking-wide text-bm-red">
            {title}
          </h2>
          <Link href={galleryHref} className="text-sm text-bm-red hover:underline inline-flex items-center gap-1">
            <Camera size={14} />
            {sl.photosGalleryLink}
          </Link>
        </div>
        <PhotoGrid tiles={tiles} lang={lang} />
      </section>
    );
  }

  const moreService = servicePhotos.slice(4);
  const showWorkshop = servicePhotos.length > 0;
  if (!cases.length && !moreService.length && !showWorkshop) return null;

  return (
    <section className="mt-12" aria-labelledby="landing-photos-heading">
      <h2 id="landing-photos-heading" className="font-display text-xl uppercase">
        {sl.photosTitle}
      </h2>
      <p className="text-sm text-bm-muted mb-6 mt-2">{sl.photosHint}</p>

      {cases.length ? (
        <div className="mb-10">
          <WorkBeforeAfterList cases={cases} heading="" hint="" />
        </div>
      ) : null}

      <div className="space-y-8">
        {moreService.length > 0 ? (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-bm-red mb-3">
              {sl.photosServiceTitle}
            </h3>
            <PhotoGrid tiles={moreService} lang={lang} />
          </div>
        ) : null}
        {showWorkshop ? (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-bm-red mb-3">
              {sl.photosWorkshopTitle}
            </h3>
            <PhotoGrid tiles={workshop} lang={lang} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
