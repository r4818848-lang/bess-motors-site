import type { ServiceId } from "./services-catalog";

/** BESS MOTORS contact & site data (independent workshop, not a car brand dealer) */

export const siteConfig = {
  name: "BESS MOTORS",

  legalName: "Serwis Samochodowy",

  phone: "+48 791 257 229",

  phoneHref: "tel:+48791257229",

  whatsapp: "https://wa.me/48791257229",

  telegram: "https://t.me/BessMotors_bot",

  viber: "viber://chat?number=48791257229",

  address: "Aleja Krakowska 48/52, 02-284 Warszawa",

  email: "bessmotorss@gmail.com",

  instagram: "https://instagram.com/bessmotors.pl",

  facebook: "https://facebook.com/bessmotorss",

  bannerImage: "/images/banner.png",

  /** Hero background — только авто и блок телефона (без карточек услуг) */
  heroCarImage: "/images/hero-car.png",

  logoImage: "/images/logo.png",

  forgedCarbonImage: "/images/forged-carbon.png",

  /** Local dev only — production: ADMIN_PHONE + ADMIN_PASSWORD on Vercel */
  adminPhone: "",
  adminPassword: "",
  /** Dev fallback; production JWT must be JWT_SECRET on Vercel only */
  jwtSecret: "dev-local-jwt-only-not-for-production",

  workingHours: "Pn–Sb 8:00–20:00",

  /** Google Maps — business profile / reviews list */
  googleMapsReviewsUrl:
    "https://www.google.com/maps/search/?api=1&query=BESS+MOTORS+Aleja+Krakowska+48+52+Warszawa",

  /**
   * Optional: set GOOGLE_PLACE_ID in Vercel for direct review link + Places API.
   * Find ID: Google Maps → share → „Place ID” or Places API Place ID finder.
   */
  googlePlaceId: process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID?.trim() || "",

  /** Ask clients to leave a review (uses place id when configured) */
  get googleWriteReviewUrl(): string {
    const pid = this.googlePlaceId;
    if (pid) {
      return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(pid)}`;
    }
    return this.googleMapsReviewsUrl;
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

/** Service boxes on home page banner section — opens smart booking for serviceId */
export const bannerServices = [
  { id: "tires" as const, serviceId: "tires" as ServiceId, fast: true },
  { id: "ac" as const, serviceId: "acRefill" as ServiceId },
  { id: "oil" as const, serviceId: "oil" as ServiceId, fast: true },
  { id: "tuning" as const, serviceId: "chip" as ServiceId },
  { id: "other" as const, serviceId: "diagnostic" as ServiceId },
];

