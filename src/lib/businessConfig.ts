/**
 * Single source of truth for BESS MOTORS NAP, hours, Maps, social.
 * UI, JSON-LD, booking slots, and SEO copy should derive from here.
 *
 * HOURS NOTE (owner confirmation required):
 * - Currently published everywhere: Mon–Sat 08:00–18:00
 * - Owner draft / possible GBP mismatch: Mon–Sat 09:00–18:00
 * Do NOT flip opens to 09:00 until confirmed against Google Business Profile.
 */

export const businessConfig = {
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
  addressLine: "Aleja Krakowska 48/52, 02-284 Warszawa",
  district: "Włochy",
  nearLandmark: "Okęcie",
  /** Human-readable hours (PL) — keep in sync with openingHours */
  workingHoursLabel: "Pn–Sb 8:00–18:00",
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const,
    opens: "08:00",
    closes: "18:00",
    closedDays: ["Sunday"] as const,
  },
  /**
   * Pending owner + GBP confirmation. When approved, set openingHours.opens to "09:00"
   * and update workingHoursLabel + booking WORKSHOP_OPEN together.
   */
  hoursPendingOwnerConfirm: {
    proposedOpens: "09:00",
    proposedCloses: "18:00",
    proposedLabelPl: "Pn–Sb 9:00–18:00",
    note: "Potwierdź z Google Business Profile przed zmianą na stronie i w schema.",
  },
  /** Approximate workshop entrance (Aleja Krakowska 48/52) */
  geo: {
    latitude: 52.1785,
    longitude: 20.9789,
  },
  priceRange: "$$",
  paymentAccepted: ["Cash", "Credit Card", "Bank Transfer", "BLIK"] as const,
  whatsappUrl: "https://wa.me/48791257229",
  telegramUrl: "https://t.me/BessMotors_bot",
  viberUrl: "viber://chat?number=48791257229",
  instagramUrl: "https://instagram.com/bessmotors.pl",
  facebookUrl: "https://facebook.com/bessmotorss",
  googleMapsCid: "7516200575228226885",
  googleMapsUrl: "https://www.google.com/maps?cid=7516200575228226885",
  googlePlaceId:
    process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID?.trim() ||
    "ChIJvSA65iEzGUcRRa0Qw5noTmg",
  logoImage: "/images/logo.png",
  bannerImage: "/images/banner.png",
  /** Services we do NOT advertise (confirmed workshop limits) */
  servicesNotOffered: [
    "geometria / zbieżność kół (rozwał-zbieżność)",
    "dynamiczna wymiana ATF",
  ] as const,
  /** Static ATF ok; dynamic not offered */
  atfPolicy: "static_only" as const,
} as const;

export function googleMapsDirectionsUrl(
  cfg: typeof businessConfig = businessConfig
): string {
  const dest = encodeURIComponent(cfg.addressLine);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

export function googleWriteReviewUrl(
  cfg: typeof businessConfig = businessConfig
): string {
  const pid = cfg.googlePlaceId;
  if (pid) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(pid)}`;
  }
  return cfg.googleMapsUrl;
}

export function isWithinBusinessHours(now = new Date()): boolean {
  const day = now.getDay();
  if (day === 0) return false;
  const [oh, om] = businessConfig.openingHours.opens.split(":").map(Number);
  const [ch, cm] = businessConfig.openingHours.closes.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= oh * 60 + om && mins < ch * 60 + cm;
}
