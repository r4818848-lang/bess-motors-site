/** Local SEO — BESS MOTORS service area (Aleja Krakowska 48/52, Włochy) */

export const LOCAL_SERVICE_RADIUS_KM = 8;

export const businessGeo = {
  latitude: 52.1785,
  longitude: 20.9789,
} as const;

/** Districts & neighborhoods typically within ~8 km drive */
export const localDistrictsPl = [
  "Włochy",
  "Okęcie",
  "Ursynów",
  "Mokotów",
  "Ochota",
  "Wilanów",
  "Rakowiec",
  "Służew",
  "Służewiec",
  "Kabaty",
  "Natolin",
  "Stokłosy",
  "Pyry",
  "Imielin",
  "Szczęśliwice",
] as const;

export const localDistrictKeywords = localDistrictsPl.flatMap((d) => [
  `serwis samochodowy ${d}`,
  `mechanik ${d} Warszawa`,
  `warsztat samochodowy ${d}`,
]);

export const localSeoKeywords = [
  "serwis samochodowy Włochy",
  "mechanik Okęcie",
  "warsztat Aleja Krakowska",
  "serwis samochodowy Ursynów",
  "mechanik Mokotów Warszawa",
  "serwis Ochota Warszawa",
  "mechanik Rakowiec",
  "serwis samochodowy blisko mnie Warszawa",
  "warsztat samochodowy południowa Warszawa",
  `serwis samochodowy ${LOCAL_SERVICE_RADIUS_KM} km`,
  ...localDistrictKeywords.slice(0, 12),
];

export function localAreaDescriptionPl(): string {
  const sample = localDistrictsPl.slice(0, 8).join(", ");
  return `Obsługujemy kierowców z Warszawy i okolic w promieniu ok. ${LOCAL_SERVICE_RADIUS_KM} km — m.in. ${sample}. Adres: Aleja Krakowska 48/52, Włochy.`;
}

export function schemaGeoCoordinates() {
  return {
    "@type": "GeoCoordinates" as const,
    latitude: businessGeo.latitude,
    longitude: businessGeo.longitude,
  };
}

/** Schema.org GeoCircle — ~8 km service radius */
export function schemaGeoCircle() {
  return {
    "@type": "GeoCircle" as const,
    geoMidpoint: schemaGeoCoordinates(),
    geoRadius: LOCAL_SERVICE_RADIUS_KM * 1000,
  };
}

export function schemaAreaServed() {
  return [
    schemaGeoCircle(),
    { "@type": "City" as const, name: "Warszawa" },
    ...localDistrictsPl.map((name) => ({
      "@type": "AdministrativeArea" as const,
      name,
    })),
  ];
}

/** Append local context to meta descriptions (Polish) */
export function withLocalMetaSuffix(text: string): string {
  const suffix = ` Dojazd z Włoch, Ursynowa, Mokotowa i okolic (ok. ${LOCAL_SERVICE_RADIUS_KM} km).`;
  if (text.includes("8 km") || text.includes("8km") || text.includes("promieniu")) {
    return text;
  }
  const combined = `${text.trim()}${suffix}`;
  return combined.length > 165 ? text.trim() : combined;
}
