import type { ServiceId } from "./services-catalog";
import {
  businessConfig,
  googleMapsDirectionsUrl,
  googleWriteReviewUrl,
} from "@/lib/businessConfig";

/** BESS MOTORS contact & site data — values from businessConfig */

export const siteConfig = {
  name: businessConfig.name,

  legalName: businessConfig.legalName,

  phone: businessConfig.phoneDisplay,

  phoneHref: businessConfig.phoneHref,

  whatsapp: businessConfig.whatsappUrl,

  telegram: businessConfig.telegramUrl,

  viber: businessConfig.viberUrl,

  address: businessConfig.addressLine,

  email: businessConfig.email,

  instagram: businessConfig.instagramUrl,

  facebook: businessConfig.facebookUrl,

  bannerImage: businessConfig.bannerImage,

  /** Hero background — только авто и блок телефона (без карточек услуг) */
  heroCarImage: "/images/hero-car.png",

  logoImage: businessConfig.logoImage,

  forgedCarbonImage: "/images/forged-carbon.png",

  /** Local dev only — production: ADMIN_PHONE + ADMIN_PASSWORD on Vercel */
  adminPhone: "",
  adminPassword: "",
  /** Dev fallback; production JWT must be JWT_SECRET on Vercel only */
  jwtSecret: "dev-local-jwt-only-not-for-production",

  workingHours: businessConfig.workingHoursLabel,

  googleMapsCid: businessConfig.googleMapsCid,

  googleMapsReviewsUrl: businessConfig.googleMapsUrl,

  googlePlaceId: businessConfig.googlePlaceId,

  get googleWriteReviewUrl(): string {
    return googleWriteReviewUrl(businessConfig);
  },

  get googleMapsDirectionsUrl(): string {
    return googleMapsDirectionsUrl(businessConfig);
  },
};

export const sitePartners = [
  { id: "intercars", name: "Inter Cars", tagPl: "Dostawca części", tagRu: "Поставщик запчастей" },
  { id: "motul", name: "Motul", tagPl: "Oleje silnikowe", tagRu: "Моторные масла" },
  { id: "castrol", name: "Castrol", tagPl: "Oleje i płyny", tagRu: "Масла и жидкости" },
  { id: "michelin", name: "Michelin", tagPl: "Opony", tagRu: "Шины" },
  { id: "bosch", name: "Bosch", tagPl: "Części zamienne", tagRu: "Запчасти" },
  { id: "hella", name: "Hella", tagPl: "Elektryka / klimatyzacja", tagRu: "Электрика / кондиционер" },
] as const;

/** Service boxes on home page banner — confirmed public services only (no chip) */
export const bannerServices = [
  { id: "ac" as const, serviceId: "acRefill" as ServiceId, fast: true, seasonal: true },
  { id: "tires" as const, serviceId: "tires" as ServiceId, fast: true },
  { id: "oil" as const, serviceId: "oil" as ServiceId, fast: true },
  { id: "brakes" as const, serviceId: "brakesFull" as ServiceId, fast: true },
  { id: "other" as const, serviceId: "diagnostic" as ServiceId },
];
