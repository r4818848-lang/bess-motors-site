import type { BlogPost } from "@/lib/blog-posts";
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import { getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { getServiceFaqForSchema } from "@/lib/seo-service-faq";
import { resolveLandingContentServiceId } from "@/lib/seo-landing-slug-profiles";
import { schemaAreaServed } from "@/lib/seo-local";
import {
  acHookupPricePln,
  acR1234yfPer100gPln,
  acR134aPer100gPln,
  acRechargeFromPln,
} from "@/lib/ac-recharge-prices";
import {
  AC_HOOKUP_PROMO_OLD_PLN,
  AC_R1234YF_PROMO_OLD_PLN,
  AC_R134A_PROMO_OLD_PLN,
  acPromoMetaDescriptionPl,
} from "@/lib/ac-recharge-promo-seo";
import {
  getOilBrakePromoOffer,
  OIL_BRAKE_PROMO_CODE,
  oilBrakePromoOfferSchema,
} from "@/lib/oil-brake-promo";

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
    "@graph": [
      {
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
      },
      breadcrumbSchema([
        { name: "Strona główna", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path: `/blog/${post.slug}` },
      ]),
    ],
  };
}

export function contactPageSchema() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${siteUrl}/contacts#contactpage`,
    url: `${siteUrl}/contacts`,
    name: "Kontakt — BESS MOTORS",
    description:
      "Adres warsztatu BESS MOTORS: Aleja Krakowska 48/52, Warszawa Włochy. Telefon, godziny otwarcia, mapa dojazdu.",
    inLanguage: "pl",
    mainEntity: { "@id": `${siteUrl}/#business` },
    isPartOf: { "@id": `${siteUrl}/#website` },
  };
}

export function servicesItemListSchema() {
  const siteUrl = getSiteUrl();
  const items = [
    { name: "PROMOCJA −50% — nabijanie klimatyzacji bez kolejki R134a / R1234yf od 130 zł", path: "/klimatyzacja" },
    { name: "Naprawa klimatyzacji samochodowej", path: "/naprawa-klimatyzacji" },
    { name: "Wymiana oleju 100 zł — kod BessMotors", path: "/wymiana-oleju" },
    { name: "Wulkanizacja", path: "/opony" },
    { name: "Hamulce — klocki od 100 zł, kod BessMotors", path: "/hamulce" },
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
  const isAcRepair = page.slug === "naprawa-klimatyzacji";
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
      name: "Promocja −50% nabijania klimatyzacji R134a / R1234yf",
      description: `Podłączenie ${acHookupPricePln()} zł (było ${AC_HOOKUP_PROMO_OLD_PLN} zł), R134a ${acR134aPer100gPln()} zł/100 g (było ${AC_R134A_PROMO_OLD_PLN} zł), R1234yf ${acR1234yfPer100gPln()} zł/100 g (było ${AC_R1234YF_PROMO_OLD_PLN} zł)`,
      price: acRechargeFromPln(),
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      url,
      priceValidUntil: "2026-12-31",
    };
  } else if (isAcRepair) {
    serviceNode.offers = {
      "@type": "Offer",
      name: "Naprawa klimatyzacji samochodowej — diagnostyka i wymiana elementów",
      description: page.metaDescription,
      price: 150,
      priceCurrency: "PLN",
      availability: "https://schema.org/InStock",
      url,
    };
  } else if (page.slug === "wymiana-oleju") {
    const oil = getOilBrakePromoOffer("oil_filter");
    if (oil) serviceNode.offers = oilBrakePromoOfferSchema(siteUrl, oil);
  } else if (page.slug === "hamulce") {
    const pads = getOilBrakePromoOffer("brake_pads_front");
    if (pads) {
      serviceNode.offers = {
        ...oilBrakePromoOfferSchema(siteUrl, pads),
        name: `Serwis hamulców — promocja kod ${OIL_BRAKE_PROMO_CODE}`,
        description: page.metaDescription,
      };
    }
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
