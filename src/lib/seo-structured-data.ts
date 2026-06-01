import type { BlogPost } from "@/lib/blog-posts";
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import { getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { getServiceFaqForSchema } from "@/lib/seo-service-faq";
import { resolveLandingContentServiceId } from "@/lib/seo-landing-slug-profiles";

export function faqPageSchema(items: { q: string; a: string }[]) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[]
) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export function blogPostingSchema(post: BlogPost) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}${siteConfig.logoImage}`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: "pl",
  };
}

export function servicesItemListSchema() {
  const siteUrl = getSiteUrl();
  const items = [
    { name: "Wymiana oleju", path: "/wymiana-oleju" },
    { name: "Wulkanizacja", path: "/opony" },
    { name: "Klimatyzacja samochodowa", path: "/klimatyzacja" },
    { name: "Serwis hamulców", path: "/hamulce" },
    { name: "Diagnostyka komputerowa", path: "/diagnostyka" },
    { name: "Chip tuning", path: "/chip-tuning-warszawa" },
    { name: "Geometria kół", path: "/geometria" },
    { name: "Naprawa zawieszenia", path: "/zawieszenie" },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Usługi BESS MOTORS",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: item.name,
        url: `${siteUrl}${item.path}`,
        provider: { "@id": `${siteUrl}/#business` },
      },
    })),
  };
}

export function autoRepairServiceSchema(page: SeoLandingPage) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/${page.slug}`;
  const contentId = resolveLandingContentServiceId(page.slug, page.serviceId);
  const faq = getServiceFaqForSchema(contentId, page.slug);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: page.metaTitle,
      description: page.metaDescription,
      provider: { "@id": `${siteUrl}/#business` },
      areaServed: { "@type": "City", name: "Warszawa" },
      url,
    },
    breadcrumbSchema([
      { name: "Strona główna", path: "/" },
      { name: "Usługi", path: "/services" },
      { name: page.title, path: `/${page.slug}` },
    ]),
  ];
  const faqSchema = faqPageSchema(faq);
  if (faqSchema) graph.push(faqSchema);
  return { "@context": "https://schema.org", "@graph": graph };
}
