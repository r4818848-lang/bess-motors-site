import { isOpenAt } from "@/lib/workshop-schedule";

/**
 * Single source of truth for BESS MOTORS NAP, hours, Maps, social.
 * UI, JSON-LD and SEO copy should derive from here.
 *
 * Hours confirmed 2026-11-08: Mon–Fri 09:00–18:00, Sat 09:00–14:00, Sun closed.
 * Client arrival uses Europe/Warsaw and the last slot is 30 minutes before closing.
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
  workingHoursLabel: "Pn–Pt 9:00–18:00, Sb 9:00–14:00, Nd zamknięte",
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const,
    opens: "09:00",
    closes: "18:00",
    saturdayOpens: "09:00",
    saturdayCloses: "14:00",
    closedDays: ["Sunday"] as const,
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

export function businessOpeningHoursSpecification() {
  const h = businessConfig.openingHours;
  return [
    {
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: h.opens,
      closes: h.closes,
    },
    {
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: "Saturday",
      opens: h.saturdayOpens,
      closes: h.saturdayCloses,
    },
  ];
}

export function workshopHours() {
  const h = businessConfig.openingHours;
  return {
    opens: h.opens,
    closes: h.closes,
    saturdayOpens: h.saturdayOpens,
    saturdayCloses: h.saturdayCloses,
  };
}

export function isWithinBusinessHours(now = new Date()): boolean {
  return isOpenAt(now, workshopHours());
}
