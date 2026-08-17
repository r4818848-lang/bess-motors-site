import { siteConfig } from "@/lib/site";
import { getSiteUrl } from "@/lib/seo";
import {
  LOCAL_SERVICE_RADIUS_KM,
  schemaAreaServed,
  schemaGeoCoordinates,
} from "@/lib/seo-local";
import { businessAggregateRatingSchema } from "@/lib/seo-business-rating";
import { oilBrakePromoCatalogSchema } from "@/lib/oil-brake-promo";
import { gbpPhotoUrls } from "@/lib/google-business-facts";

/** Global Schema.org — local business + website (FAQ only on /faq and landing pages) */
export function JsonLd() {
  const siteUrl = getSiteUrl();
  const aggregateRating = businessAggregateRatingSchema();

  const business: Record<string, unknown> = {
    "@type": ["AutoRepair", "LocalBusiness"],
    "@id": `${siteUrl}/#business`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    description:
      `Niezależny serwis samochodowy Warszawa Włochy (Aleja Krakowska 48/52) — obszar do ok. ${LOCAL_SERVICE_RADIUS_KM} km: Włochy, Ursynów, Mokotów, Ochota, Okęcie. Wymiana oleju, hamulce, nabijanie klimatyzacji, diagnostyka, wulkanizacja. Rezerwacja online.`,
    url: siteUrl,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    image: gbpPhotoUrls(siteUrl),
    logo: `${siteUrl}${siteConfig.logoImage}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Aleja Krakowska 48/52",
      addressLocality: "Warszawa",
      addressRegion: "mazowieckie",
      postalCode: "02-284",
      addressCountry: "PL",
    },
    geo: schemaGeoCoordinates(),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "08:00",
        closes: "18:00",
      },
    ],
    priceRange: "$$",
    currenciesAccepted: "PLN",
    paymentAccepted: "Cash, Credit Card, Bank Transfer",
    areaServed: schemaAreaServed(),
    serviceArea: schemaAreaServed(),
    hasMap: siteConfig.googleMapsReviewsUrl,
    sameAs: [
      siteConfig.googleMapsReviewsUrl,
      siteConfig.instagram,
      siteConfig.facebook,
      siteConfig.telegram,
    ].filter(Boolean),
  };

  if (aggregateRating) {
    business.aggregateRating = aggregateRating;
  }

  business.hasOfferCatalog = oilBrakePromoCatalogSchema(siteUrl);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      business,
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.name,
        publisher: { "@id": `${siteUrl}/#business` },
        inLanguage: "pl",
        potentialAction: {
          "@type": "ReserveAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/booking`,
            actionPlatform: [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform",
            ],
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Strona główna",
            item: siteUrl,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
