/** Canonical site URL for sitemap, robots, Open Graph (set in Vercel: NEXT_PUBLIC_SITE_URL) */
/** Must match the URL verified in Google Search Console */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bess-motors.com";
  return url.replace(/\/$/, "");
}

/** Public pages for Google (no cabinet, CRM, admin) */
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
  { path: "/diagnostyka", changeFrequency: "weekly", priority: 0.85 },
  { path: "/zawieszenie", changeFrequency: "weekly", priority: 0.85 },
  { path: "/wymiana-oleju", changeFrequency: "weekly", priority: 0.85 },
  { path: "/hamulce", changeFrequency: "weekly", priority: 0.85 },
  { path: "/klimatyzacja", changeFrequency: "weekly", priority: 0.85 },
  { path: "/geometria", changeFrequency: "weekly", priority: 0.85 },
  { path: "/silnik", changeFrequency: "weekly", priority: 0.85 },
  { path: "/elektryka", changeFrequency: "weekly", priority: 0.85 },
  { path: "/przeglad", changeFrequency: "weekly", priority: 0.85 },
  { path: "/opony", changeFrequency: "weekly", priority: 0.85 },
  { path: "/bmw", changeFrequency: "weekly", priority: 0.8 },
  { path: "/mercedes", changeFrequency: "weekly", priority: 0.8 },
  { path: "/vag", changeFrequency: "weekly", priority: 0.8 },
  { path: "/kontakt", changeFrequency: "weekly", priority: 0.9 },
  { path: "/promocje", changeFrequency: "weekly", priority: 0.75 },
];

export const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ??
  process.env.GOOGLE_SITE_VERIFICATION;

/** Meta Business Suite → Domains → verify bess-motors.com (HTML meta tag) */
export const facebookDomainVerification =
  process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION?.trim() ||
  "lt6qibm590hn899ajzy9ywie8qzgh9";
