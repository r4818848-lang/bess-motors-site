import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
import {
  getSiteUrl,
  publicSitemapPaths,
  sitemapExcludedSlugs,
  pendingNoIndexSlugs,
  sitemapLastModifiedFor,
} from "@/lib/seo";
import { seoLandingSlugs } from "@/lib/seo-landing-pages";
import { ENHANCEMENT_HUB_SLUG, allEnhancementSlugs } from "@/lib/enhancement-services";
import { blogPosts } from "@/lib/blog-posts";
import { listPublishedCases } from "@/lib/seo-growth/case-store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  const add = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
    modified?: Date
  ) => {
    const key = path || "/";
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({
      url: `${siteUrl}${path}`,
      lastModified: modified ?? (allEnhancementSlugs.includes(path.slice(1)) ? new Date("2026-11-17T21:00:00.000Z") : sitemapLastModifiedFor(path)),
      changeFrequency,
      priority,
    });
  };

  for (const { path, changeFrequency, priority } of publicSitemapPaths) {
    add(path, changeFrequency, priority);
  }

  for (const slug of seoLandingSlugs) {
    // Duplicate oil landing remains accessible, but its canonical points at /wymiana-oleju.
    if (slug === "wymiana-oleju-warszawa") continue;
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

  // New genuine workshop service areas; unique canonical pages with substantive content.
  for (const slug of allEnhancementSlugs) {
    add("/" + slug, "monthly", slug === ENHANCEMENT_HUB_SLUG ? 0.88 : 0.78);
  }

  try {
    const publishedCases = await listPublishedCases();
    if (publishedCases.ok && publishedCases.cases.length > 0) {
      add("/realizacje", "weekly", 0.6);
      for (const story of publishedCases.cases) add(`/realizacje/${story.id}`, "monthly", 0.5);
    }
  } catch {
    // A storage outage must not drop the rest of the sitemap.
  }

  for (const post of blogPosts) {
    const priority =
      post.slug === "ile-kosztuje-wymiana-oleju" ||
      post.slug === "kiedy-zmieniac-klocki" ||
      post.slug === "nabijanie-klimatyzacji-cena-warszawa"
        ? 0.75
        : 0.65;
    add(`/blog/${post.slug}`, "monthly", priority, new Date(`${post.updatedAt ?? post.date}T12:00:00.000Z`));
  }

  return entries;
}
