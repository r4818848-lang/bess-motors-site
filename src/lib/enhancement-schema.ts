import { getSiteUrl } from "@/lib/seo";
import { businessConfig } from "@/lib/businessConfig";
import { ENHANCEMENT_HUB_SLUG, enhancementServices, type EnhancementService } from "@/lib/enhancement-services";

/** Accurate structured data: a Service without prices/offers until owner approves a price. */
export function enhancementServiceSchema(service: EnhancementService) {
  const base = getSiteUrl();
  const url = base + "/" + service.slug;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": url + "#service",
        "name": service.title,
        "description": service.metaDescription,
        "serviceType": service.title,
        "url": url,
        "provider": { "@id": base + "/#business" },
        "areaServed": { "@type": "City", "name": "Warszawa" },
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", position: 1, name: "Strona główna", item: base },
          { "@type": "ListItem", position: 2, name: "Usługi", item: base + "/services" },
          { "@type": "ListItem", position: 3, name: "Personalizacja samochodu", item: base + "/" + ENHANCEMENT_HUB_SLUG },
          { "@type": "ListItem", position: 4, name: service.title, item: url },
        ],
      },
    ],
  };
}

export function enhancementHubSchema() {
  const base = getSiteUrl();
  const url = base + "/" + ENHANCEMENT_HUB_SLUG;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url + "#webpage",
        name: "Personalizacja samochodu Warszawa",
        url,
        inLanguage: "pl",
        about: { "@id": base + "/#business" },
      },
      {
        "@type": "ItemList",
        name: "Personalizacja i doposażenie samochodu — BESS MOTORS",
        itemListElement: enhancementServices.map((service, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: service.title,
          url: base + "/" + service.slug,
        })),
      },
    ],
  };
}
