import type { ServiceId } from "@/lib/services-catalog";

export type SeoLandingPage = {
  slug: string;
  title: string;
  line1: string;
  line2: string;
  metaTitle: string;
  metaDescription: string;
  /** Opens smart booking modal for this service */
  serviceId?: ServiceId;
  icon: string;
};

export const seoLandingPages: SeoLandingPage[] = [
  {
    slug: "diagnostyka",
    title: "Diagnostyka Komputerowa",
    line1: "Szybka diagnostyka auta",
    line2: "Dokładne wykrywanie usterek",
    metaTitle: "Diagnostyka komputerowa Warszawa",
    metaDescription:
      "Diagnostyka komputerowa w BESS MOTORS — szybka i dokładna. Wykrywanie usterek, błędy silnika, elektryka. Warszawa, Aleja Krakowska.",
    serviceId: "diagnostic",
    icon: "ScanLine",
  },
  {
    slug: "zawieszenie",
    title: "Naprawa Zawieszenia",
    line1: "Stuki i luzy w zawieszeniu?",
    line2: "Profesjonalny serwis Warszawa",
    metaTitle: "Naprawa zawieszenia Warszawa",
    metaDescription:
      "Naprawa zawieszenia w BESS MOTORS — amortyzatory, wahacze, stuki, luzy. Profesjonalny serwis samochodowy Warszawa.",
    serviceId: "suspension",
    icon: "Settings",
  },
  {
    slug: "wymiana-oleju",
    title: "Wymiana Oleju",
    line1: "Olej i filtry w 1 godzinę",
    line2: "Oryginalne części i płyny",
    metaTitle: "Wymiana oleju Warszawa",
    metaDescription:
      "Wymiana oleju i filtrów w BESS MOTORS — szybko, oryginalne części i płyny. Serwis Warszawa Aleja Krakowska.",
    serviceId: "oil",
    icon: "Droplets",
  },
  {
    slug: "hamulce",
    title: "Serwis Hamulców",
    line1: "Klocki, tarcze, zaciski",
    line2: "Bezpieczeństwo na drodze",
    metaTitle: "Serwis hamulców Warszawa",
    metaDescription:
      "Serwis hamulców — klocki, tarcze, zaciski. Bezpieczeństwo na drodze. BESS MOTORS Warszawa.",
    serviceId: "brakePads",
    icon: "Disc",
  },
  {
    slug: "klimatyzacja",
    title: "Klimatyzacja Auto",
    line1: "Nabijanie i odgrzybianie",
    line2: "Sprawna klima cały rok",
    metaTitle: "Klimatyzacja samochodowa Warszawa",
    metaDescription:
      "Klimatyzacja samochodowa — nabijanie, odgrzybianie, serwis. Sprawna klima przez cały rok. BESS MOTORS Warszawa.",
    serviceId: "acRefill",
    icon: "Wind",
  },
  {
    slug: "geometria",
    title: "Geometria Kół",
    line1: "Ustawienie zbieżności kół",
    line2: "Auto nie ściąga na drodze",
    metaTitle: "Geometria kół Warszawa",
    metaDescription:
      "Geometria kół i zbieżność w BESS MOTORS. Auto nie ściąga — profesjonalne ustawienie. Warszawa.",
    serviceId: "alignment",
    icon: "Crosshair",
  },
  {
    slug: "silnik",
    title: "Naprawa Silnika",
    line1: "Diagnostyka i naprawa silnika",
    line2: "Doświadczeni mechanicy",
    metaTitle: "Naprawa silnika Warszawa",
    metaDescription:
      "Naprawa silnika — diagnostyka i naprawa przez doświadczonych mechaników. BESS MOTORS Warszawa.",
    serviceId: "engine",
    icon: "Cog",
  },
  {
    slug: "elektryka",
    title: "Elektryk Samochodowy",
    line1: "Błędy, czujniki, instalacja",
    line2: "Nowoczesna diagnostyka auta",
    metaTitle: "Elektryk samochodowy Warszawa",
    metaDescription:
      "Elektryk samochodowy — błędy, czujniki, instalacje. Nowoczesna diagnostyka. BESS MOTORS Warszawa.",
    serviceId: "electric",
    icon: "Zap",
  },
  {
    slug: "przeglad",
    title: "Przegląd Auta",
    line1: "Przygotowanie do przeglądu",
    line2: "Zwiększ szansę na pozytywny wynik",
    metaTitle: "Przegląd auta Warszawa",
    metaDescription:
      "Przygotowanie auta do przeglądu technicznego — zwiększ szansę na pozytywny wynik. BESS MOTORS Warszawa.",
    serviceId: "otherReason",
    icon: "Filter",
  },
  {
    slug: "opony",
    title: "Wulkanizacja",
    line1: "Wymiana i wyważanie opon",
    line2: "Szybka obsługa bez kolejek",
    metaTitle: "Wulkanizacja Warszawa",
    metaDescription:
      "Wulkanizacja — wymiana i wyważanie opon. Szybka obsługa bez kolejek. BESS MOTORS Warszawa.",
    serviceId: "tires",
    icon: "Circle",
  },
  {
    slug: "bmw",
    title: "Serwis BMW",
    line1: "Specjalizacja BMW Warszawa",
    line2: "Profesjonalna obsługa aut BMW",
    metaTitle: "Serwis BMW Warszawa",
    metaDescription:
      "Serwis BMW w Warszawie — specjalizacja i profesjonalna obsługa. Diagnostyka, mechanika, olej. BESS MOTORS.",
    serviceId: "otherReason",
    icon: "Gauge",
  },
  {
    slug: "mercedes",
    title: "Serwis Mercedes",
    line1: "Diagnostyka i naprawa Mercedes",
    line2: "Kompleksowy serwis premium",
    metaTitle: "Serwis Mercedes Warszawa",
    metaDescription:
      "Serwis Mercedes — diagnostyka, naprawa, kompleksowa obsługa aut premium. BESS MOTORS Warszawa.",
    serviceId: "otherReason",
    icon: "Gauge",
  },
  {
    slug: "vag",
    title: "Serwis Audi / VW",
    line1: "Naprawa grupy VAG",
    line2: "Audi, VW, Skoda, Seat",
    metaTitle: "Serwis Audi VW Skoda Seat Warszawa",
    metaDescription:
      "Serwis grupy VAG — Audi, VW, Skoda, Seat. Naprawa i diagnostyka. BESS MOTORS Warszawa.",
    serviceId: "otherReason",
    icon: "Settings",
  },
  {
    slug: "kontakt",
    title: "Umów Wizytę Online",
    line1: "Wygodna rezerwacja terminu",
    line2: "Wybierz dogodny dzień i godzinę",
    metaTitle: "Umów wizytę online — BESS MOTORS",
    metaDescription:
      "Umów wizytę online w BESS MOTORS — wybierz dogodny dzień i godzinę. Warszawa, Aleja Krakowska 48/52.",
    icon: "Calendar",
  },
  {
    slug: "promocje",
    title: "Promocje i Rabaty",
    line1: "Aktualne promocje serwisu",
    line2: "Oszczędzaj na naprawach auta",
    metaTitle: "Promocje i rabaty — BESS MOTORS",
    metaDescription:
      "Aktualne promocje i rabaty w BESS MOTORS Warszawa. Oszczędzaj na naprawach i serwisie samochodowym.",
    icon: "Tag",
  },
];

export const seoLandingSlugs = seoLandingPages.map((p) => p.slug);

export function getSeoLandingPage(slug: string): SeoLandingPage | undefined {
  return seoLandingPages.find((p) => p.slug === slug);
}
