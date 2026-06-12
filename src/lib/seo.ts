import { localSeoKeywords } from "@/lib/seo-local";

/** Canonical site URL for sitemap, robots, Open Graph (set in Vercel: NEXT_PUBLIC_SITE_URL) */
/** Must match the URL verified in Google Search Console */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bess-motors.com";
  return url.replace(/\/$/, "");
}

/** Public pages for Google (no cabinet, CRM, admin) */
/** Landing slugs that 301 to another URL — exclude from sitemap */
export const sitemapExcludedSlugs = new Set([
  "klocki-hamulcowe",
  "serwis-klimatyzacji",
]);

export const defaultSeoKeywords = [
  "BESS MOTORS",
  "serwis samochodowy Warszawa",
  "warsztat samochodowy Warszawa",
  "mechanik Warszawa Włochy",
  "wymiana opon Warszawa",
  "wulkanizacja Warszawa",
  "serwis klimatyzacji samochodowej",
  "wymiana oleju Warszawa",
  "chip tuning Warszawa",
  "diagnostyka komputerowa",
  "serwis BMW Warszawa",
  "serwis Mercedes Warszawa",
  "Aleja Krakowska serwis",
  ...localSeoKeywords,
];

export const publicSitemapPaths: {
  path: string;
  changeFrequency: "weekly" | "monthly";
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/services", changeFrequency: "weekly", priority: 0.9 },
  { path: "/cennik", changeFrequency: "weekly", priority: 0.9 },
  { path: "/booking", changeFrequency: "weekly", priority: 0.9 },
  { path: "/contacts", changeFrequency: "monthly", priority: 0.85 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/gallery", changeFrequency: "monthly", priority: 0.6 },
  { path: "/status", changeFrequency: "monthly", priority: 0.65 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.75 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/referral", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
];

export const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ??
  process.env.GOOGLE_SITE_VERIFICATION;

/** Meta Business Suite → Domains → verify bess-motors.com (HTML meta tag) */
export const facebookDomainVerification =
  process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION?.trim() ||
  "lt6qibm590hn899ajzy9ywie8qzgh9";
