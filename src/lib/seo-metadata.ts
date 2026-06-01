import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";

export const DEFAULT_OG_IMAGE = "/images/banner.png";
const BRAND = "BESS MOTORS";

export type PageSeoInput = {
  /** Short title — root template adds «| BESS MOTORS» unless absoluteTitle */
  title: string;
  description: string;
  /** Path starting with / or "" for homepage */
  path: string;
  keywords?: string[];
  noIndex?: boolean;
  /** Use when title already includes brand (blog posts) */
  absoluteTitle?: boolean;
  ogImage?: string;
};

export function pageCanonical(path: string): string {
  const siteUrl = getSiteUrl();
  if (!path || path === "/") return siteUrl;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Consistent Open Graph + Twitter + canonical for public pages */
export function buildPageMetadata(input: PageSeoInput): Metadata {
  const canonical = pageCanonical(input.path);
  const ogTitle = input.absoluteTitle
    ? input.title
    : input.title.includes(BRAND)
      ? input.title
      : `${input.title} | ${BRAND}`;
  const image = input.ogImage ?? DEFAULT_OG_IMAGE;

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    ...(input.keywords?.length ? { keywords: input.keywords } : {}),
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "pl_PL",
      url: canonical,
      siteName: BRAND,
      title: ogTitle,
      description: input.description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${BRAND} — serwis samochodowy Warszawa`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: input.description,
      images: [image],
    },
    ...(input.noIndex
      ? { robots: { index: false, follow: false } }
      : { robots: { index: true, follow: true } }),
  };
}
