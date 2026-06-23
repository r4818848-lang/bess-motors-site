"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import type { ServiceId } from "@/lib/services-catalog";
import { getServiceLandingGalleryTags } from "@/lib/service-landing-content";
import type { PublicGalleryItem } from "@/app/api/gallery/route";
import { WORKSHOP_PHOTOS } from "@/lib/workshop-photos";
import { Wrench, Camera } from "lucide-react";

type PhotoTile = { key: string; src: string; alt: string };

const WORKSHOP_ALT: Record<string, { pl: string; ru: string; en: string }> = {
  exterior: {
    pl: "Fasada warsztatu BESS MOTORS",
    ru: "Фасад сервиса BESS MOTORS",
    en: "BESS MOTORS workshop exterior",
  },
  liftBay: {
    pl: "Podnośnik i stanowisko serwisowe",
    ru: "Подъёмник и сервисная зона",
    en: "Lift bay and service station",
  },
  workshopHall: {
    pl: "Hala warsztatowa — mechanicy przy pracy",
    ru: "Цех — механики за работой",
    en: "Workshop hall — mechanics at work",
  },
  tireService: {
    pl: "Strefa wulkanizacji i opon",
    ru: "Зона шиномонтажа",
    en: "Tire service area",
  },
};

const SERVICE_FALLBACK: Partial<
  Record<ServiceId, { src: string; alt: { pl: string; ru: string; en: string } }[]>
> = {
  oil: [
    {
      src: "/images/workshop/lift-bay.png",
      alt: {
        pl: "Wymiana oleju na podnośniku",
        ru: "Замена масла на подъёмнике",
        en: "Oil change on lift",
      },
    },
    {
      src: "/images/workshop/workshop-hall.png",
      alt: {
        pl: "Serwis olejowy — warsztat BESS MOTORS",
        ru: "Масляный сервис BESS MOTORS",
        en: "Oil service workshop",
      },
    },
  ],
  brakePads: [
    {
      src: "/images/workshop/lift-bay.png",
      alt: {
        pl: "Wymiana klocków i tarcz hamulcowych",
        ru: "Замена тормозных колодок и дисков",
        en: "Brake pads and discs service",
      },
    },
  ],
  diagnostic: [
    {
      src: "/images/hero-car.png",
      alt: {
        pl: "Diagnostyka komputerowa pojazdu",
        ru: "Компьютерная диагностика",
        en: "Computer diagnostics",
      },
    },
  ],
};

function workshopTiles(lang: "pl" | "ru" | "en"): PhotoTile[] {
  return WORKSHOP_PHOTOS.map((photo) => ({
    key: `ws-${photo.id}`,
    src: photo.src,
    alt: WORKSHOP_ALT[photo.id]?.[lang] ?? "BESS MOTORS",
  }));
}

function galleryTiles(items: PublicGalleryItem[]): PhotoTile[] {
  return items
    .filter((item) => item.afterUrl || item.beforeUrl)
    .map((item) => ({
      key: `gal-${item.id}`,
      src: item.afterUrl || item.beforeUrl || "",
      alt: item.title || item.make || "BESS MOTORS",
    }));
}

function serviceFallbackTiles(
  serviceId: ServiceId,
  lang: "pl" | "ru" | "en"
): PhotoTile[] {
  const list = SERVICE_FALLBACK[serviceId] ?? [];
  return list.map((item, i) => ({
    key: `svc-${serviceId}-${i}`,
    src: item.src,
    alt: item.alt[lang],
  }));
}

function dedupeTiles(tiles: PhotoTile[]): PhotoTile[] {
  const seen = new Set<string>();
  return tiles.filter((tile) => {
    if (!tile.src || seen.has(tile.src)) return false;
    seen.add(tile.src);
    return true;
  });
}

function PhotoGrid({ tiles }: { tiles: PhotoTile[] }) {
  if (!tiles.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className="relative aspect-[4/3] rounded-xl overflow-hidden border border-bm-border/40 bg-bm-surface/50"
        >
          {tile.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tile.src}
              alt={tile.alt}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-bm-muted">
              <Wrench size={32} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ServiceLandingPhotos({
  serviceId,
  slug,
}: {
  serviceId: ServiceId;
  slug: string;
}) {
  const { t, locale } = useI18n();
  const sl = t.serviceLanding;
  const lang = contentLocale(locale);
  const [galleryItems, setGalleryItems] = useState<PublicGalleryItem[]>([]);

  useEffect(() => {
    const tags = getServiceLandingGalleryTags(serviceId, slug);
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((data: { items?: PublicGalleryItem[] }) => {
        const all = data.items ?? [];
        if (!tags?.length) {
          setGalleryItems(all);
          return;
        }
        const filtered = all.filter((item) => {
          const hay = `${item.make ?? ""} ${item.title ?? ""}`.toLowerCase();
          return tags.some((tag) => hay.includes(tag.toLowerCase()));
        });
        setGalleryItems(filtered.length ? filtered : all);
      })
      .catch(() => setGalleryItems([]));
  }, [serviceId, slug]);

  const { workshop, serviceRelated } = useMemo(() => {
    const workshopList = workshopTiles(lang);
    const fromGallery = galleryTiles(galleryItems);
    const fallbacks = serviceFallbackTiles(serviceId, lang);
    const serviceList = dedupeTiles([...fromGallery, ...fallbacks]).slice(0, 9);
    return { workshop: workshopList, serviceRelated: serviceList };
  }, [galleryItems, serviceId, lang]);

  return (
    <section className="mt-12" aria-labelledby="landing-photos-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <h2 id="landing-photos-heading" className="font-display text-xl uppercase">
          {sl.photosTitle}
        </h2>
        <Link
          href="/gallery?tab=works"
          className="text-sm text-bm-red hover:underline inline-flex items-center gap-1"
        >
          <Camera size={14} />
          {sl.photosGalleryLink}
        </Link>
      </div>
      <p className="text-sm text-bm-muted mb-6">{sl.photosHint}</p>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-bm-red mb-3">
            {sl.photosWorkshopTitle}
          </h3>
          <PhotoGrid tiles={workshop} />
        </div>

        {serviceRelated.length > 0 && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-bm-red mb-3">
              {sl.photosServiceTitle}
            </h3>
            <PhotoGrid tiles={serviceRelated} />
          </div>
        )}
      </div>
    </section>
  );
}
