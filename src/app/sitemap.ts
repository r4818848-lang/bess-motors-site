import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bess-motors-site.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/services",
    "/booking",
    "/cabinet",
    "/about",
    "/contacts",
  ];

  return pages.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
