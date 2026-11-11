import { siteConfig } from "@/lib/site";
import { SITE_NAP } from "@/lib/site-nap";
import { getSiteUrl } from "@/lib/seo";
import {
  schemaAreaServed,
  schemaGeoCoordinates,
} from "@/lib/seo-local";
import { businessAggregateRatingSchema } from "@/lib/seo-business-rating";
import { oilBrakePromoCatalogSchema } from "@/lib/oil-brake-promo";
import { gbpPhotoUrls } from "@/lib/google-business-facts";
import { businessOpeningHoursSpecification } from "@/lib/businessConfig";

/** Global Schema.org — local business + website (FAQ only on /faq and landing pages) */
export function JsonLd() {
  const siteUrl = getSiteUrl();
  const aggregateRating = businessAggregateRatingSchema();

  const business: Record<string, unknown> = {
    "@type": ["AutoRepair", "LocalBusiness"],
    "@id": `${siteUrl}/#business`,
    name: SITE_NAP.name,
    legalName: SITE_NAP.legalName,
    description:
      `Niezależny serwis samochodowy w Warszawie. Warsztat stoi przy Alei Krakowskiej 48/52 (Włochy). Wulkanizacja i wymiana opon dla kierowców z całej Warszawy, a także diagnostyka, hamulce i klimatyzacja. Rezerwacja online.`,
    url: siteUrl,
    telephone: SITE_NAP.phoneDisplay,
    email: SITE_NAP.email,
    image: gbpPhotoUrls(siteUrl),
    logo: `${siteUrl}${siteConfig.logoImage}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_NAP.streetAddress,
      addressLocality: SITE_NAP.addressLocality,
      addressRegion: SITE_NAP.addressRegion,
      postalCode: SITE_NAP.postalCode,
      addressCountry: SITE_NAP.addressCountry,
    },
    geo: schemaGeoCoordinates(),
    openingHoursSpecification: businessOpeningHoursSpecification(),
    priceRange: SITE_NAP.priceRange,
    currenciesAccepted: "PLN",
    paymentAccepted: SITE_NAP.paymentAccepted.join(", "),
    areaServed: schemaAreaServed(),
    serviceArea: schemaAreaServed(),
    hasMap: siteConfig.googleMapsReviewsUrl,
    sameAs: [
      siteConfig.googleMapsReviewsUrl,
      SITE_NAP.instagramUrl,
      SITE_NAP.facebookUrl,
      SITE_NAP.telegramUrl,
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
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
