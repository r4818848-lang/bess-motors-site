import type { MetadataRoute } from "next";
import { getSiteUrl, publicSitemapPaths, sitemapExcludedSlugs } from "@/lib/seo";
import { seoLandingSlugs } from "@/lib/seo-landing-pages";
import { blogPosts } from "@/lib/blog-posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

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
    entries.push({
      url: `${siteUrl}${path}`,
      lastModified,
      changeFrequency,
      priority,
    });
  };

  for (const { path, changeFrequency, priority } of publicSitemapPaths) {
    add(path, changeFrequency, priority);
  }

  for (const slug of seoLandingSlugs) {
    if (sitemapExcludedSlugs.has(slug)) continue;
                const priority =
                  slug === "klimatyzacja"
                    ? 0.95
                    : slug === "wymiana-oleju" ||
                        slug === "hamulce" ||
                        slug === "naprawa-klimatyzacji"
                      ? 0.9
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

  add("/privacy", "yearly", 0.3);

  return entries;
}
