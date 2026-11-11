import type { MetadataRoute } from "next";
import {
  getSiteUrl,
  publicSitemapPaths,
  sitemapExcludedSlugs,
  pendingNoIndexSlugs,
  SITEMAP_LAST_MODIFIED,
} from "@/lib/seo";
import { seoLandingSlugs } from "@/lib/seo-landing-pages";
import { blogPosts } from "@/lib/blog-posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = SITEMAP_LAST_MODIFIED;
  const tyreCopyRefresh = new Date("2026-11-11T08:00:00.000Z");

  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  const add = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number
  ) => {
    const key = path || "/";
    if (seen.has(key)) return;
    seen.add(key);
    const tyreUrl =
      key === "/" ||
      key === "/contacts" ||
      key.includes("opon") ||
      key.includes("wulkan") ||
      key.includes("wywaz");
    entries.push({
      url: `${siteUrl}${path}`,
      lastModified: tyreUrl ? tyreCopyRefresh : lastModified,
      changeFrequency,
      priority,
    });
  };

  for (const { path, changeFrequency, priority } of publicSitemapPaths) {
    add(path, changeFrequency, priority);
  }

  for (const slug of seoLandingSlugs) {
    if (sitemapExcludedSlugs.has(slug) || pendingNoIndexSlugs.has(slug)) continue;
                const priority =
                  slug === "klimatyzacja" ||
                  slug === "serwis-klimatyzacji-warszawa" ||
                  slug === "wulkanizacja-warszawa" ||
                  slug === "wymiana-opon-warszawa" ||
                  slug === "sezonowa-wymiana-opon-warszawa" ||
                  slug === "naprawa-opon-warszawa" ||
                  slug === "wywazanie-kol-warszawa"
                    ? 0.95
                    : slug === "wymiana-oleju" ||
                        slug === "wymiana-oleju-warszawa" ||
                        slug === "hamulce" ||
                        slug === "hamulce-warszawa" ||
                        slug === "naprawa-klimatyzacji" ||
                        slug === "mechanik-warszawa-wlochy"
                      ? 0.9
                      : slug.endsWith("-warszawa") || slug.includes("warszawa")
                        ? 0.88
                        : slug.startsWith("serwis-")
                          ? 0.82
                          : slug.startsWith("warszawa-")
                            ? 0.75
                            : 0.8;
    add(`/${slug}`, "weekly", priority);
  }

  for (const post of blogPosts) {
    const priority =
      post.slug === "ile-kosztuje-wymiana-oleju" ||
      post.slug === "kiedy-zmieniac-klocki" ||
      post.slug === "nabijanie-klimatyzacji-cena-warszawa"
        ? 0.75
        : 0.65;
    add(`/blog/${post.slug}`, "monthly", priority);
  }

  return entries;
}
