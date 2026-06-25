import type { BlogPost } from "@/lib/blog-posts";
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import { getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { getServiceFaqForSchema } from "@/lib/seo-service-faq";
import { resolveLandingContentServiceId } from "@/lib/seo-landing-slug-profiles";
import { schemaAreaServed } from "@/lib/seo-local";
import {
  acHookupPricePln,
  acR134aPer100gPln,
  acRechargeFromPln,
} from "@/lib/ac-recharge-prices";
import {
  AC_HOOKUP_PROMO_OLD_PLN,
  AC_R134A_PROMO_OLD_PLN,
  acPromoMetaDescriptionPl,
} from "@/lib/ac-recharge-promo-seo";

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
    { name: "PROMOCJA — nabijanie klimatyzacji R134a od 140 zł", path: "/klimatyzacja" },
    { name: "Wymiana oleju", path: "/wymiana-oleju" },
    { name: "Wulkanizacja", path: "/opony" },
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
  const isAcPromo = page.slug === "klimatyzacja";
  const serviceNode: Record<string, unknown> = {
    "@type": "Service",
    "@id": `${url}#service`,
    name: page.metaTitle,
    description: isAcPromo ? acPromoMetaDescriptionPl() : page.metaDescription,
    provider: { "@id": `${siteUrl}/#business` },
    areaServed: schemaAreaServed(),
    serviceArea: schemaAreaServed(),
    url,
  };
  if (isAcPromo) {
    serviceNode.offers = {
      "@type": "Offer",
      name: "Promocja nabijania klimatyzacji R134a",
      description: `Podłączenie ${acHookupPricePln()} zł (było ${AC_HOOKUP_PROMO_OLD_PLN} zł), freon ${acR134aPer100gPln()} zł/100 g (było ${AC_R134A_PROMO_OLD_PLN} zł)`,
      price: acRechargeFromPln(),
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      url,
      priceValidUntil: "2026-09-30",
    };
  }
  const graph: Record<string, unknown>[] = [
    serviceNode,
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
