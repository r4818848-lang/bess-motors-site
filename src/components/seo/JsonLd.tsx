import { siteConfig } from "@/lib/site";
import { getSiteUrl } from "@/lib/seo";

/** Schema.org for local auto repair — helps Google Maps / local search */
export function JsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["AutoRepair", "LocalBusiness"],
        "@id": `${siteUrl}/#business`,
        name: siteConfig.name,
        description:
          "Serwis samochodowy Warszawa — wulkanizacja, klimatyzacja, wymiana oleju, chip tuning, mechanika.",
        url: siteUrl,
        telephone: siteConfig.phone,
        email: siteConfig.email,
        image: `${siteUrl}${siteConfig.logoImage}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Aleja Krakowska 48/52",
          addressLocality: "Warszawa",
          postalCode: "02-284",
          addressCountry: "PL",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 52.1785,
          longitude: 20.9789,
        },
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
              "Sunday",
            ],
            opens: "07:00",
            closes: "20:00",
          },
        ],
        priceRange: "$$",
        areaServed: { "@type": "City", name: "Warszawa" },
        sameAs: [
          siteConfig.instagram,
          siteConfig.facebook,
          siteConfig.telegram,
        ].filter(Boolean),
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.name,
        publisher: { "@id": `${siteUrl}/#business` },
        inLanguage: ["pl", "ru"],
        potentialAction: {
          "@type": "ReserveAction",
          target: `${siteUrl}/booking`,
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
