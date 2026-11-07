/**
 * Real workshop photos mapped to car models → SEO landings (tires / brakes).
 * One photo can power several service pages for search (“шиномонтаж Audi Q5”, …).
 */
import {
  TIRE_AUDI_Q5_SRC,
  TIRE_BMW_7_G70_SRC,
  TIRE_BMW_FRONT_SRC,
  TIRE_BMW_X3_JACK_SRC,
  TIRE_MERCEDES_BAY_SRC,
} from "@/lib/tire-media";
import { BRAKE_PADS_CHANGE_PHOTO_SRC } from "@/lib/brake-media";

export { TIRE_AUDI_Q5_SRC, TIRE_BMW_7_G70_SRC };

export type ModelServiceKind = "tires" | "brakePads";

export type ModelServiceCase = {
  id: string;
  brand: string;
  model: string;
  /** Short label for H1 / meta, e.g. "Audi Q5" */
  label: string;
  brandHubSlug: string;
  galleryTags: string[];
  tirePhotoSrc: string;
  tirePhotoAlt: { pl: string; ru: string; en: string };
  /** Shared workshop brake photo until model-specific brake shots exist */
  brakePhotoSrc: string;
  tireSlug: string;
  brakeSlug: string;
};

export const MODEL_SERVICE_CASES: ModelServiceCase[] = [
  {
    id: "audi-q5",
    brand: "Audi",
    model: "Q5",
    label: "Audi Q5",
    brandHubSlug: "serwis-audi",
    galleryTags: ["audi", "q5"],
    tirePhotoSrc: TIRE_AUDI_Q5_SRC,
    tirePhotoAlt: {
      pl: "Audi Q5 — wymiana opon / wulkanizacja BESS MOTORS Warszawa Włochy",
      ru: "Audi Q5 — шиномонтаж BESS MOTORS Варшава Włochy",
      en: "Audi Q5 tyre change at BESS MOTORS Warsaw Włochy",
    },
    brakePhotoSrc: BRAKE_PADS_CHANGE_PHOTO_SRC,
    tireSlug: "wymiana-opon-audi-q5-warszawa",
    brakeSlug: "wymiana-klockow-hamulcowych-audi-q5-warszawa",
  },
  {
    id: "bmw-7-g70",
    brand: "BMW",
    model: "7 G70",
    label: "BMW 7 G70",
    brandHubSlug: "bmw",
    galleryTags: ["bmw", "g70", "seria 7", "7er"],
    tirePhotoSrc: TIRE_BMW_7_G70_SRC,
    tirePhotoAlt: {
      pl: "BMW 7 G70 — wulkanizacja BESS MOTORS, Aleja Krakowska 48/52",
      ru: "BMW 7 G70 — шиномонтаж BESS MOTORS, Aleja Krakowska 48/52",
      en: "BMW 7 Series G70 tyre service at BESS MOTORS Warsaw",
    },
    brakePhotoSrc: BRAKE_PADS_CHANGE_PHOTO_SRC,
    tireSlug: "wymiana-opon-bmw-7-g70-warszawa",
    brakeSlug: "wymiana-klockow-hamulcowych-bmw-7-g70-warszawa",
  },
  {
    id: "bmw-x3",
    brand: "BMW",
    model: "X3",
    label: "BMW X3",
    brandHubSlug: "bmw",
    galleryTags: ["bmw", "x3"],
    tirePhotoSrc: TIRE_BMW_X3_JACK_SRC,
    tirePhotoAlt: {
      pl: "BMW X3 — wymiana opon przy warsztacie BESS MOTORS Warszawa",
      ru: "BMW X3 — шиномонтаж у BESS MOTORS Варшава",
      en: "BMW X3 tyre fitting at BESS MOTORS Warsaw",
    },
    brakePhotoSrc: BRAKE_PADS_CHANGE_PHOTO_SRC,
    tireSlug: "wymiana-opon-bmw-x3-warszawa",
    brakeSlug: "wymiana-klockow-hamulcowych-bmw-x3-warszawa",
  },
  {
    id: "bmw",
    brand: "BMW",
    model: "",
    label: "BMW",
    brandHubSlug: "bmw",
    galleryTags: ["bmw"],
    tirePhotoSrc: TIRE_BMW_FRONT_SRC,
    tirePhotoAlt: {
      pl: "BMW — sezonowa wymiana opon BESS MOTORS Warszawa Włochy",
      ru: "BMW — сезонная замена шин BESS MOTORS Варшава Włochy",
      en: "BMW seasonal tyre change at BESS MOTORS Warsaw Włochy",
    },
    brakePhotoSrc: BRAKE_PADS_CHANGE_PHOTO_SRC,
    tireSlug: "wymiana-opon-bmw-warszawa",
    brakeSlug: "wymiana-klockow-hamulcowych-bmw-warszawa",
  },
  {
    id: "mercedes",
    brand: "Mercedes",
    model: "",
    label: "Mercedes-Benz",
    brandHubSlug: "mercedes",
    galleryTags: ["mercedes", "benz"],
    tirePhotoSrc: TIRE_MERCEDES_BAY_SRC,
    tirePhotoAlt: {
      pl: "Mercedes — wulkanizacja w hali BESS MOTORS Warszawa",
      ru: "Mercedes — шиномонтаж в зале BESS MOTORS Варшава",
      en: "Mercedes tyre service in the BESS MOTORS Warsaw bay",
    },
    brakePhotoSrc: BRAKE_PADS_CHANGE_PHOTO_SRC,
    tireSlug: "wymiana-opon-mercedes-warszawa",
    brakeSlug: "wymiana-klockow-hamulcowych-mercedes-warszawa",
  },
];

export function getModelCaseBySlug(slug: string): ModelServiceCase | undefined {
  return MODEL_SERVICE_CASES.find((c) => c.tireSlug === slug || c.brakeSlug === slug);
}

export function getModelHeroForSlug(slug: string): { src: string; alt: { pl: string; ru: string; en: string } } | null {
  const c = getModelCaseBySlug(slug);
  if (!c) return null;
  if (slug === c.tireSlug) {
    return { src: c.tirePhotoSrc, alt: c.tirePhotoAlt };
  }
  return {
    src: c.brakePhotoSrc,
    alt: {
      pl: `Wymiana klocków hamulcowych ${c.label} — BESS MOTORS Warszawa`,
      ru: `Замена колодок ${c.label} — BESS MOTORS Варшава`,
      en: `Brake pad replacement ${c.label} — BESS MOTORS Warsaw`,
    },
  };
}

/** All model tire + brake slugs (for OG / photo strip) */
export const MODEL_SERVICE_SLUGS: string[] = MODEL_SERVICE_CASES.flatMap((c) => [
  c.tireSlug,
  c.brakeSlug,
]);

export const MODEL_TIRE_SLUGS = new Set(MODEL_SERVICE_CASES.map((c) => c.tireSlug));
export const MODEL_BRAKE_SLUGS = new Set(MODEL_SERVICE_CASES.map((c) => c.brakeSlug));
