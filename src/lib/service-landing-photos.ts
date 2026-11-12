import type { ServiceId } from "@/lib/services-catalog";
import { getOurWorkVideosForService, type OurWorkVideo } from "@/lib/our-works";
import { BESS_MEDIA_REGISTRY, type BessMediaRecord } from "@/lib/bess-media-registry";
import { TIRE_SERVICE_PHOTOS } from "@/lib/tire-media";
import { WORKSHOP_PHOTOS } from "@/lib/workshop-photos";

/**
 * Landing photos are limited to files this site already publishes as BESS MOTORS work:
 * owner job files in our-works / tire-media, workshop photos, and the workshop's own reel posters.
 * A file in the repo is not enough on its own — hero-car.png is excluded because it is not a documented repair.
 * Condenser photos stay on the radiator service, not on a general A/C page.
 */
export type LandingPhoto = {
  src: string;
  alt: { pl: string; ru: string; en: string };
};

/** 1.2 MB condenser poster. A smaller condenser photo already covers the same job. */
const SKIP_LANDING_SRC = new Set(["/images/works/radiator-replacement-cover.png"]);

const MEDIA_GROUP: Partial<Record<ServiceId, BessMediaRecord["service"]>> = {
  oil: "oil",
  filters: "oil",
  tires: "tires",
  brakePads: "brakes",
  brakesFull: "brakes",
  acRefill: "ac",
  acRepair: "ac",
  engine: "engine",
  timingBelt: "engine",
  turbo: "engine",
  suspension: "suspension",
  clutch: "transmission",
  transmission: "transmission",
  exhaust: "exhaust",
  electric: "electric",
  starterGen: "electric",
};

const EXTRA_SERVICE_IDS: Partial<Record<ServiceId, ServiceId[]>> = {
  engine: ["timingBelt"],
  brakesFull: ["brakePads"],
  brakePads: ["brakesFull"],
  filters: ["oil"],
  electric: ["starterGen"],
  starterGen: ["electric"],
};

const GALLERY_FILTER: Partial<Record<ServiceId, ServiceId>> = {
  oil: "oil",
  filters: "oil",
  tires: "tires",
  brakePads: "brakePads",
  brakesFull: "brakePads",
  acRefill: "acRefill",
  acRepair: "acRefill",
  suspension: "suspension",
  engine: "engine",
  timingBelt: "engine",
  turbo: "engine",
  clutch: "clutch",
  transmission: "clutch",
  electric: "electric",
  starterGen: "electric",
};

const WORKSHOP_ALT: Record<string, LandingPhoto["alt"]> = {
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
    pl: "Hala warsztatowa BESS MOTORS",
    ru: "Цех BESS MOTORS",
    en: "BESS MOTORS workshop hall",
  },
};

function dedupe(photos: LandingPhoto[]): LandingPhoto[] {
  const seen = new Set<string>();
  return photos.filter((photo) => {
    if (!photo.src || seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });
}

export function landingWorksForService(serviceId: ServiceId): OurWorkVideo[] {
  const ids = [serviceId, ...(EXTRA_SERVICE_IDS[serviceId] ?? [])];
  const works = ids.flatMap((id) => getOurWorkVideosForService(id));
  return dedupeWorks(works).filter((work) => !SKIP_LANDING_SRC.has(work.posterSrc));
}

function dedupeWorks(works: OurWorkVideo[]): OurWorkVideo[] {
  const seen = new Set<string>();
  return works.filter((work) => {
    if (seen.has(work.id)) return false;
    seen.add(work.id);
    return true;
  });
}

export function landingServicePhotos(serviceId: ServiceId): LandingPhoto[] {
  const fromWorks = landingWorksForService(serviceId).map((work) => ({
    src: work.posterSrc,
    alt: work.title,
  }));
  const fromTires =
    serviceId === "tires"
      ? TIRE_SERVICE_PHOTOS.map((photo) => ({ src: photo.src, alt: photo.alt }))
      : [];
  const group = MEDIA_GROUP[serviceId];
  const fromRegistry = group
    ? BESS_MEDIA_REGISTRY.filter(
        (item) =>
          item.kind === "photo" &&
          item.service === group &&
          item.source !== "instagram-reel-poster" &&
          !SKIP_LANDING_SRC.has(item.src)
      ).map((item) => ({
        src: item.src,
        alt: { pl: item.altPl, ru: item.altPl, en: item.altPl },
      }))
    : [];
  return dedupe([...fromWorks, ...fromTires, ...fromRegistry]).filter((photo) => !SKIP_LANDING_SRC.has(photo.src)).slice(0, 6);
}

/** General workshop frames. The tyre-bay photo stays on tyre pages only. */
export function landingWorkshopPhotos(): LandingPhoto[] {
  return WORKSHOP_PHOTOS.filter((photo) => photo.id !== "tireService").map((photo) => ({
    src: photo.src,
    alt: WORKSHOP_ALT[photo.id] ?? {
      pl: "Warsztat BESS MOTORS",
      ru: "Сервис BESS MOTORS",
      en: "BESS MOTORS workshop",
    },
  }));
}

export function galleryHrefForService(serviceId: ServiceId): string {
  const filter = GALLERY_FILTER[serviceId];
  return filter ? `/gallery?tab=works&service=${filter}` : "/gallery?tab=works";
}

const GENERIC_GALLERY_TAGS = new Set([
  "ac",
  "serwis",
  "service",
  "bmw",
  "audi",
  "mercedes",
  "volvo",
  "hyundai",
  "kia",
  "toyota",
  "vw",
  "vag",
]);

/**
 * A CRM gallery row is shown for a service only when its text hits a specific tag.
 * Short and brand-only tags are ignored so "ac", "serwis" or "bmw" cannot pull another trade.
 */
export function galleryItemMatchesService(text: string, tags: string[]): boolean {
  const hay = text.toLowerCase();
  const specific = tags
    .map((tag) => tag.toLowerCase())
    .filter((tag) => tag.length >= 3 && !GENERIC_GALLERY_TAGS.has(tag));
  return specific.some((tag) => hay.includes(tag));
}
