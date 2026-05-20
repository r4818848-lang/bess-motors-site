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
  adminPhone: "+48 791 257 229",
  /** CRM admin console password (same form as client login) */
  adminPassword: "11788245Illia@",
  /** JWT signing secret — replace in production */
  jwtSecret: "bess-motors-jwt-secret-change-in-production-2025",
  workingHours: "Pn–Nd 7:00–20:00",
};

/** Service boxes on home page banner section */
export const bannerServices = [
  { id: "tires" as const, fast: true },
  { id: "ac" as const },
  { id: "oil" as const, fast: true },
  { id: "tuning" as const },
  { id: "other" as const },
];
