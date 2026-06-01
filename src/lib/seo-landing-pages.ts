import type { ServiceId } from "@/lib/services-catalog";
import { getSiteUrl } from "@/lib/seo";

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
    line1: "Stuki i luz w zawieszeniu?",
    line2: "Profesjonalny serwis Warszawa",
    metaTitle: "Naprawa zawieszenia Warszawa",
    metaDescription:
      "Naprawa zawieszenia w BESS MOTORS — amortyzatory, wahacze, stuki, luz w zawieszeniu. Profesjonalny serwis samochodowy Warszawa.",
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
    serviceId: "diagnostic",
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
    serviceId: "diagnostic",
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
    serviceId: "diagnostic",
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
    serviceId: "diagnostic",
    icon: "Calendar",
  },
  {
    slug: "warszawa-wlochy",
    title: "Serwis Samochodowy Włochy / Okecie",
    line1: "Blisko Alei Krakowskiej",
    line2: "Diagnostyka, naprawy, serwis",
    metaTitle: "Mechanik Włochy Warszawa — BESS MOTORS",
    metaDescription:
      "Serwis samochodowy przy Alei Krakowskiej 48 — Włochy, Okęcie. Diagnostyka, hamulce, olej, klimatyzacja.",
    serviceId: "diagnostic",
    icon: "MapPin",
  },
  {
    slug: "warszawa-ursynow",
    title: "Serwis dla Ursynowa",
    line1: "Dojazd z Ursynowa i Mokotowa",
    line2: "Umów wizytę online",
    metaTitle: "Serwis samochodowy Ursynów — BESS MOTORS",
    metaDescription:
      "BESS MOTORS — wygodny dojazd z Ursynowa. Naprawy, diagnostyka, opony. Aleja Krakowska 48.",
    serviceId: "diagnostic",
    icon: "MapPin",
  },
  {
    slug: "serwis-audi",
    title: "Serwis Audi",
    line1: "Diagnostyka i naprawy Audi",
    line2: "Warszawa — Aleja Krakowska",
    metaTitle: "Serwis Audi Warszawa — BESS MOTORS",
    metaDescription:
      "Serwis Audi w BESS MOTORS — diagnostyka, hamulce, olej, elektryka. Doświadczenie z grupą VAG.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "serwis-toyota",
    title: "Serwis Toyota / Lexus",
    line1: "Naprawa i serwis Toyota",
    line2: "Hybrydy i silniki benzynowe",
    metaTitle: "Serwis Toyota Warszawa",
    metaDescription:
      "Serwis Toyota i Lexus — diagnostyka, hamulce, olej. BESS MOTORS Warszawa.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "serwis-opel",
    title: "Serwis Opel",
    line1: "Naprawa Opel i Chevrolet",
    line2: "Części i diagnostyka",
    metaTitle: "Serwis Opel Warszawa",
    metaDescription:
      "Serwis Opel w BESS MOTORS — naprawy, diagnostyka komputerowa, serwis okresowy.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "serwis-ford",
    title: "Serwis Ford",
    line1: "Naprawa Ford Focus / Kuga",
    line2: "Diagnostyka i serwis",
    metaTitle: "Serwis Ford Warszawa",
    metaDescription: "Serwis Ford w BESS MOTORS — naprawy, diagnostyka, olej.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "serwis-renault",
    title: "Serwis Renault / Dacia",
    line1: "Obsługa francuskich marek",
    line2: "Warszawa Włochy",
    metaTitle: "Serwis Renault Warszawa",
    metaDescription: "Serwis Renault i Dacia — BESS MOTORS Aleja Krakowska.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "serwis-peugeot",
    title: "Serwis Peugeot / Citroën",
    line1: "Diagnostyka PSA",
    line2: "Hamulce, zawieszenie, olej",
    metaTitle: "Serwis Peugeot Citroën Warszawa",
    metaDescription: "Serwis Peugeot i Citroën w BESS MOTORS.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "check-engine",
    title: "Check Engine — diagnostyka",
    line1: "Świeci się kontrolka silnika?",
    line2: "Komputerowa diagnostyka",
    metaTitle: "Check Engine Warszawa — BESS MOTORS",
    metaDescription: "Diagnostyka Check Engine — odczyt błędów, naprawa. BESS MOTORS.",
    serviceId: "diagnostic",
    icon: "ScanLine",
  },
  {
    slug: "klocki-hamulcowe",
    title: "Wymiana klocków hamulcowych",
    line1: "Pisk, tarcie, dłuższa droga hamowania?",
    line2: "Hamulce w BESS MOTORS",
    metaTitle: "Klocki hamulcowe Warszawa — BESS MOTORS",
    metaDescription: "Wymiana klocków i tarcz hamulcowych. Szybka wizyta, gwarancja na pracę.",
    serviceId: "brakePads",
    icon: "Settings",
  },
  {
    slug: "serwis-klimatyzacji",
    title: "Serwis klimatyzacji",
    line1: "Słaba chłodziwość lub zapach?",
    line2: "Napełnianie i odgrzybianie",
    metaTitle: "Serwis klimatyzacji samochodowej Warszawa",
    metaDescription: "Serwis klimatyzacji — diagnostyka, napełnianie, odgrzybianie. BESS MOTORS.",
    serviceId: "acRefill",
    icon: "Settings",
  },
  {
    slug: "chip-tuning-warszawa",
    title: "Chip Tuning Warszawa",
    line1: "Więcej mocy i momentu obrotowego",
    line2: "Stage 1 i Stage 2 — bezpiecznie",
    metaTitle: "Chip tuning Warszawa — Stage 1 / Stage 2",
    metaDescription:
      "Chip tuning w BESS MOTORS — Stage 1 od 1200 zł, Stage 2 od 2500 zł. Diagnostyka przed tuningiem, mapa ECU, jazda testowa. Warszawa.",
    serviceId: "chip",
    icon: "Cpu",
  },
  {
    slug: "promocje",
    title: "Promocje i Rabaty",
    line1: "Aktualne promocje serwisu",
    line2: "Oszczędzaj na naprawach auta",
    metaTitle: "Promocje i rabaty — BESS MOTORS",
    metaDescription:
      "Aktualne promocje i rabaty w BESS MOTORS Warszawa. Oszczędzaj na naprawach i serwisie samochodowym.",
    serviceId: "otherReason",
    icon: "Tag",
  },
];

/** All 27 public landing URLs (for docs / QA) */
export const seoLandingUrlTable = seoLandingPages.map((p) => ({
  slug: p.slug,
  url: `${getSiteUrl()}/${p.slug}`,
  serviceId: p.serviceId ?? "—",
  title: p.title,
}));

export const seoLandingSlugs = seoLandingPages.map((p) => p.slug);

export function getSeoLandingPage(slug: string): SeoLandingPage | undefined {
  return seoLandingPages.find((p) => p.slug === slug);
}
