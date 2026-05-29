import type { MetadataRoute } from "next";
import { getSiteUrl, publicSitemapPaths } from "@/lib/seo";
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
    add(`/${slug}`, "weekly", 0.8);
  }

  add("/blog", "weekly", 0.7);
  for (const post of blogPosts) {
    add(`/blog/${post.slug}`, "monthly", 0.65);
  }

  add("/referral", "monthly", 0.7);
  add("/privacy", "yearly", 0.3);

  return entries;
}
