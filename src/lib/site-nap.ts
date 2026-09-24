/**
 * Central NAP / business facts — single source for UI, schema, and SEO copy.
 * Prefer importing from here instead of hardcoding address/phone/hours.
 */
export {
  siteConfig,
  sitePartners,
  bannerServices,
} from "@/lib/site";

export const SITE_NAP = {
  name: "BESS MOTORS",
  legalName: "Serwis Samochodowy",
  phoneDisplay: "+48 791 257 229",
  phoneHref: "tel:+48791257229",
  phoneE164: "+48791257229",
  email: "bessmotorss@gmail.com",
  streetAddress: "Aleja Krakowska 48/52",
  postalCode: "02-284",
  addressLocality: "Warszawa",
  addressRegion: "mazowieckie",
  addressCountry: "PL",
  /** Full one-line address for UI */
  addressLine: "Aleja Krakowska 48/52, 02-284 Warszawa",
  district: "Włochy",
  nearLandmark: "Okęcie",
  workingHoursLabel: "Pn–Sb 8:00–18:00",
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const,
    opens: "08:00",
    closes: "18:00",
  },
  priceRange: "$$",
  paymentAccepted: ["Cash", "Credit Card", "Bank Transfer"] as const,
  whatsappUrl: "https://wa.me/48791257229",
  telegramUrl: "https://t.me/BessMotors_bot",
  instagramUrl: "https://instagram.com/bessmotors.pl",
  facebookUrl: "https://facebook.com/bessmotorss",
} as const;

export function isWithinOpeningHoursSpec(now = new Date()): boolean {
  const day = now.getDay(); // 0 Sun
  if (day === 0) return false;
  const [oh, om] = SITE_NAP.openingHours.opens.split(":").map(Number);
  const [ch, cm] = SITE_NAP.openingHours.closes.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}
