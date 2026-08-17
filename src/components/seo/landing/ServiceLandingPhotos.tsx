"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import type { ServiceId } from "@/lib/services-catalog";
import { getServiceLandingGalleryTags } from "@/lib/service-landing-content";
import type { PublicGalleryItem } from "@/app/api/gallery/route";
import {
  AC_PROMO_HERO_SRC,
  AC_PROMO_IMAGE_ALT,
  AC_RECHARGE_BMW_POSTER_SRC,
  AC_RECHARGE_LEXUS_ALT,
  AC_RECHARGE_LEXUS_PHOTO_SRC,
  AC_RECHARGE_STATION_ALT,
  AC_REPAIR_WELD_PROMO_SRC,
  AC_SERVICE_VIDEO_POSTER_SRC,
} from "@/lib/ac-media";
import {
  ALTERNATOR_INSTALL_IMAGE_ALT,
  ALTERNATOR_INSTALL_PHOTO_SRC,
  ALTERNATOR_PARTS_IMAGE_ALT,
  ALTERNATOR_PARTS_PHOTO_SRC,
} from "@/lib/alternator-media";
import {
  BRAKE_PADS_CHANGE_IMAGE_ALT,
  BRAKE_PADS_CHANGE_PHOTO_SRC,
} from "@/lib/brake-media";
import {
  OIL_CHANGE_DRAIN_PHOTO_SRC,
  OIL_CHANGE_DRAIN_POSTER_SRC,
  OIL_CHANGE_IMAGE_ALT,
} from "@/lib/oil-media";
import {
  RADIATOR_REPLACEMENT_IMAGE_ALT,
  RADIATOR_REPLACEMENT_POSTER_SRC,
  RADIATOR_WASH_IMAGE_ALT,
  RADIATOR_WASH_POSTER_SRC,
} from "@/lib/radiator-media";
import {
  TIRE_SERVICE_IMAGE_ALT,
  TIRE_SERVICE_POSTER_SRC,
} from "@/lib/tire-media";
import { WORKSHOP_PHOTOS } from "@/lib/workshop-photos";
import { Wrench, Camera } from "lucide-react";
import { WorkBeforeAfterList } from "@/components/gallery/WorkBeforeAfterCollage";
import { workCasesForLanding } from "@/lib/work-before-after";

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
      src: OIL_CHANGE_DRAIN_POSTER_SRC,
      alt: OIL_CHANGE_IMAGE_ALT,
    },
    {
      src: OIL_CHANGE_DRAIN_PHOTO_SRC,
      alt: {
        pl: "Wymiana oleju — spuszczanie na podnośniku BESS MOTORS",
        ru: "Замена масла — слив на подъёмнике BESS MOTORS",
        en: "Oil change — drain on lift at BESS MOTORS",
      },
    },
    {
      src: "/images/workshop/lift-bay.png",
      alt: {
        pl: "Stanowisko serwisowe na podnośniku",
        ru: "Сервисная зона на подъёмнике",
        en: "Lift bay service station",
      },
    },
  ],
  brakePads: [
    {
      src: "/images/works/before-after/brakes-discs-pads/after/01.jpg",
      alt: {
        pl: "Nowa tarcza hamulcowa po wymianie — BESS MOTORS",
        ru: "Новый тормозной диск после замены — BESS MOTORS",
        en: "New brake disc after replacement — BESS MOTORS",
      },
    },
    {
      src: BRAKE_PADS_CHANGE_PHOTO_SRC,
      alt: BRAKE_PADS_CHANGE_IMAGE_ALT,
    },
    {
      src: "/images/workshop/lift-bay.png",
      alt: {
        pl: "Stanowisko serwisowe — wymiana hamulców",
        ru: "Сервисная зона — ремонт тормозов",
        en: "Service bay — brake work",
      },
    },
  ],
  brakesFull: [
    {
      src: "/images/works/before-after/brakes-discs-pads/after/01.jpg",
      alt: {
        pl: "Nowa tarcza hamulcowa po wymianie — BESS MOTORS",
        ru: "Новый тормозной диск после замены — BESS MOTORS",
        en: "New brake disc after replacement — BESS MOTORS",
      },
    },
    {
      src: BRAKE_PADS_CHANGE_PHOTO_SRC,
      alt: BRAKE_PADS_CHANGE_IMAGE_ALT,
    },
  ],
  suspension: [
    {
      src: "/images/works/before-after/audi-a6-suspension/after/01.jpg",
      alt: {
        pl: "Audi A6 — nowe wahacze po wymianie, BESS MOTORS",
        ru: "Audi A6 — новые рычаги после замены, BESS MOTORS",
        en: "Audi A6 — new control arms after replacement, BESS MOTORS",
      },
    },
    {
      src: "/images/works/before-after/audi-a6-suspension/before/01.jpg",
      alt: {
        pl: "Audi A6 — zużyte wahacze przed wymianą",
        ru: "Audi A6 — изношенные рычаги до замены",
        en: "Audi A6 — worn control arms before replacement",
      },
    },
  ],
  starterGen: [
    {
      src: ALTERNATOR_INSTALL_PHOTO_SRC,
      alt: ALTERNATOR_INSTALL_IMAGE_ALT,
    },
    {
      src: ALTERNATOR_PARTS_PHOTO_SRC,
      alt: ALTERNATOR_PARTS_IMAGE_ALT,
    },
  ],
  electric: [
    {
      src: ALTERNATOR_INSTALL_PHOTO_SRC,
      alt: ALTERNATOR_INSTALL_IMAGE_ALT,
    },
    {
      src: ALTERNATOR_PARTS_PHOTO_SRC,
      alt: ALTERNATOR_PARTS_IMAGE_ALT,
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
  acRefill: [
    {
      src: "/images/works/before-after/ac-recharge/01.jpg",
      alt: {
        pl: "Nabijanie klimatyzacji RAM — stacja Launch AC519, BESS MOTORS",
        ru: "Заправка кондиционера RAM — станция Launch AC519, BESS MOTORS",
        en: "RAM A/C recharge — Launch AC519 station at BESS MOTORS",
      },
    },
    {
      src: RADIATOR_WASH_POSTER_SRC,
      alt: RADIATOR_WASH_IMAGE_ALT,
    },
    {
      src: RADIATOR_REPLACEMENT_POSTER_SRC,
      alt: RADIATOR_REPLACEMENT_IMAGE_ALT,
    },
    {
      src: AC_RECHARGE_BMW_POSTER_SRC,
      alt: AC_RECHARGE_STATION_ALT,
    },
    {
      src: AC_RECHARGE_LEXUS_PHOTO_SRC,
      alt: AC_RECHARGE_LEXUS_ALT,
    },
    {
      src: AC_REPAIR_WELD_PROMO_SRC,
      alt: AC_PROMO_IMAGE_ALT,
    },
    {
      src: AC_SERVICE_VIDEO_POSTER_SRC,
      alt: {
        pl: "Nabijanie klimatyzacji R134a i R1234yf — BESS MOTORS",
        ru: "Заправка кондиционера R134a и R1234yf — BESS MOTORS",
        en: "A/C recharge R134a and R1234yf — BESS MOTORS",
      },
    },
  ],
  acRepair: [
    {
      src: RADIATOR_WASH_POSTER_SRC,
      alt: RADIATOR_WASH_IMAGE_ALT,
    },
    {
      src: RADIATOR_REPLACEMENT_POSTER_SRC,
      alt: RADIATOR_REPLACEMENT_IMAGE_ALT,
    },
    {
      src: AC_RECHARGE_BMW_POSTER_SRC,
      alt: AC_RECHARGE_STATION_ALT,
    },
    {
      src: AC_RECHARGE_LEXUS_PHOTO_SRC,
      alt: AC_RECHARGE_LEXUS_ALT,
    },
    {
      src: AC_REPAIR_WELD_PROMO_SRC,
      alt: AC_PROMO_IMAGE_ALT,
    },
    {
      src: AC_SERVICE_VIDEO_POSTER_SRC,
      alt: {
        pl: "Serwis i naprawa klimatyzacji — BESS MOTORS",
        ru: "Сервис и ремонт кондиционера — BESS MOTORS",
        en: "A/C service and repair — BESS MOTORS",
      },
    },
  ],
  tires: [
    {
      src: TIRE_SERVICE_POSTER_SRC,
      alt: TIRE_SERVICE_IMAGE_ALT,
    },
    {
      src: "/images/workshop/lift-bay.png",
      alt: {
        pl: "Wymiana kół na podnośniku — BESS MOTORS",
        ru: "Замена колёс на подъёмнике — BESS MOTORS",
        en: "Wheel change on lift — BESS MOTORS",
      },
    },
  ],
  alignment: [
    {
      src: TIRE_SERVICE_POSTER_SRC,
      alt: {
        pl: "Geometria kół i wulkanizacja — BESS MOTORS",
        ru: "Развал-схождение и шиномонтаж — BESS MOTORS",
        en: "Wheel alignment and tire service — BESS MOTORS",
      },
    },
  ],
  radiators: [
    {
      src: RADIATOR_WASH_POSTER_SRC,
      alt: RADIATOR_WASH_IMAGE_ALT,
    },
    {
      src: RADIATOR_REPLACEMENT_POSTER_SRC,
      alt: RADIATOR_REPLACEMENT_IMAGE_ALT,
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

  const cases = useMemo(
    () => workCasesForLanding(slug, serviceId),
    [slug, serviceId]
  );

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

      {cases.length ? (
        <div className="mb-10">
          <WorkBeforeAfterList cases={cases} heading="" hint="" />
        </div>
      ) : null}

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
