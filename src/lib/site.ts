import type { ServiceId } from "./services-catalog";

/** Official BESS MOTORS contact & brand data */

export const siteConfig = {
  name: "BESS MOTORS",

  legalName: "Serwis Samochodowy",

  phone: "+48 791 257 229",

  phoneHref: "tel:+48791257229",

  whatsapp: "https://wa.me/48791257229",

  telegram: "https://t.me/bessmotors",

  viber: "viber://chat?number=48791257229",

  address: "Aleja Krakowska 48/52, 02-284 Warszawa",

  email: "bessmotorss@gmail.com",

  instagram: "https://instagram.com/bessmotors.pl",

  facebook: "https://facebook.com/bessmotorss",

  bannerImage: "/images/banner.png",

  logoImage: "/images/logo.png",

  forgedCarbonImage: "/images/forged-carbon.png",

  /** Hidden admin — exact phone + password only (never shown in UI) */

  adminPhone: "+48888838688",

  adminPassword: "11788245@illia",

  /** JWT signing secret — replace in production */

  jwtSecret: "bess-motors-jwt-secret-change-in-production-2025",

  workingHours: "Pn–Nd 7:00–20:00",

};

/** Service boxes on home page banner section — opens smart booking for serviceId */export const bannerServices = [
  { id: "tires" as const, serviceId: "tires" as ServiceId, fast: true },
  { id: "ac" as const, serviceId: "acRefill" as ServiceId },
  { id: "oil" as const, serviceId: "oil" as ServiceId, fast: true },
  { id: "tuning" as const, serviceId: "chip" as ServiceId },
  { id: "other" as const, serviceId: "diagnostic" as ServiceId },
];

