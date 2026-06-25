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
    line2: "Oleje i filtry OEM/OES",
    metaTitle: "Wymiana oleju Warszawa",
    metaDescription:
      "Wymiana oleju i filtrów w BESS MOTORS — szybko, części OEM/OES od sprawdzonych dostawców. Serwis Warszawa Aleja Krakowska.",
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
    line1: "Podłączenie od 50 zł · R134a 65 zł/100 g",
    line2: "Próżnia, szczelność, odgrzybianie — sezon letni",
    metaTitle: "Nabijanie klimatyzacji Warszawa — podłączenie od 50 zł, R134a 65 zł/100g",
    metaDescription:
      "Nabijanie klimatyzacji w BESS MOTORS Warszawa Włochy: podłączenie od 50 zł, freon R134a 65 zł/100 g, R1234yf, próżnia, kontrola szczelności, odgrzybianie. Zapis online i telefon.",
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
    line1: "Niezależny serwis BMW — Warszawa",
    line2: "Doświadczenie z marką · części OEM/OES",
    metaTitle: "Niezależny serwis BMW Warszawa",
    metaDescription:
      "Niezależny warsztat obsługujący BMW w Warszawie — diagnostyka, mechanika, olej. Nie jesteśmy dealerem BMW. BESS MOTORS, Aleja Krakowska.",
    serviceId: "diagnostic",
    icon: "Gauge",
  },
  {
    slug: "mercedes",
    title: "Serwis Mercedes",
    line1: "Niezależny serwis Mercedes — Warszawa",
    line2: "Diagnostyka i naprawy aut premium",
    metaTitle: "Niezależny serwis Mercedes Warszawa",
    metaDescription:
      "Niezależny warsztat obsługujący Mercedes — diagnostyka, naprawa, serwis olejowy. Nie jesteśmy autoryzowanym salonem Mercedes. BESS MOTORS.",
    serviceId: "diagnostic",
    icon: "Gauge",
  },
  {
    slug: "vag",
    title: "Serwis Audi / VW",
    line1: "Niezależny serwis grupy VAG",
    line2: "Audi, VW, Skoda, Seat — Warszawa",
    metaTitle: "Serwis VAG Warszawa — niezależny warsztat",
    metaDescription:
      "Niezależny serwis VAG (Audi, VW, Skoda, Seat) — diagnostyka i naprawy. Nie jesteśmy dealerem żadnej marki z grupy. BESS MOTORS.",
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
      "Serwis samochodowy przy Alei Krakowskiej 48/52 — Włochy, Okęcie (ok. 5 min). Diagnostyka, hamulce, olej, klimatyzacja. Warsztat w promieniu 8 km od południowej Warszawy.",
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
      "BESS MOTORS — serwis dla Ursynowa (Kabaty, Natolin, Stokłosy). Dojazd ok. 15–20 min. Naprawy, diagnostyka, opony. Aleja Krakowska 48/52.",
    serviceId: "diagnostic",
    icon: "MapPin",
  },
  {
    slug: "warszawa-mokotow",
    title: "Serwis dla Mokotowa",
    line1: "Służewiec, Okęcie, południowy Mokotów",
    line2: "Blisko Alei Krakowskiej — ok. 10–15 min",
    metaTitle: "Mechanik Mokotów Warszawa — BESS MOTORS",
    metaDescription:
      "Serwis samochodowy dla Mokotowa — Służewiec, Wyględów, Okęcie. BESS MOTORS, Aleja Krakowska 48/52, ok. 8 km od centrum dzielnicy. Diagnostyka, opony, olej.",
    serviceId: "diagnostic",
    icon: "MapPin",
  },
  {
    slug: "warszawa-ochota",
    title: "Serwis dla Ochoty",
    line1: "Rakowiec, Szczęśliwice — dojazd ok. 15 min",
    line2: "Umów wizytę online bez kolejki",
    metaTitle: "Mechanik Ochota Warszawa — BESS MOTORS",
    metaDescription:
      "Mechanik dla Ochoty i Rakowca — BESS MOTORS przy Alei Krakowskiej 48/52. Warsztat w zasięgu ok. 8 km: hamulce, diagnostyka, klimatyzacja, wymiana oleju.",
    serviceId: "diagnostic",
    icon: "MapPin",
  },
  {
    slug: "serwis-audi",
    title: "Serwis Audi",
    line1: "Niezależny serwis Audi",
    line2: "Diagnostyka VAG · części OEM/OES",
    metaTitle: "Niezależny serwis Audi Warszawa",
    metaDescription:
      "Niezależny warsztat obsługujący Audi — diagnostyka, hamulce, olej, DSG. Nie jesteśmy salonem Audi. BESS MOTORS Warszawa.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "serwis-toyota",
    title: "Serwis Toyota / Lexus",
    line1: "Niezależny serwis Toyota / Lexus",
    line2: "Hybrydy i silniki benzynowe",
    metaTitle: "Niezależny serwis Toyota Warszawa",
    metaDescription:
      "Niezależny warsztat obsługujący Toyota i Lexus — diagnostyka, hamulce, olej. Nie jesteśmy dealerem Toyota. BESS MOTORS.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "serwis-opel",
    title: "Serwis Opel",
    line1: "Niezależny serwis Opel / Chevrolet",
    line2: "Diagnostyka i części OEM/OES",
    metaTitle: "Niezależny serwis Opel Warszawa",
    metaDescription:
      "Niezależny warsztat obsługujący Opel — naprawy, diagnostyka, serwis okresowy. Nie jesteśmy dealerem Opel. BESS MOTORS.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "serwis-ford",
    title: "Serwis Ford",
    line1: "Niezależny serwis Ford",
    line2: "Focus, Kuga, Mondeo — diagnostyka",
    metaTitle: "Niezależny serwis Ford Warszawa",
    metaDescription:
      "Niezależny warsztat obsługujący Ford — naprawy, diagnostyka, olej. Nie jesteśmy dealerem Ford. BESS MOTORS.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "serwis-renault",
    title: "Serwis Renault / Dacia",
    line1: "Niezależny serwis Renault / Dacia",
    line2: "Warszawa Włochy",
    metaTitle: "Niezależny serwis Renault Warszawa",
    metaDescription:
      "Niezależny warsztat obsługujący Renault i Dacia. Nie jesteśmy dealerem Renault. BESS MOTORS Aleja Krakowska.",
    serviceId: "diagnostic",
    icon: "Settings",
  },
  {
    slug: "serwis-peugeot",
    title: "Serwis Peugeot / Citroën",
    line1: "Niezależny serwis Peugeot / Citroën",
    line2: "Hamulce, zawieszenie, olej",
    metaTitle: "Niezależny serwis Peugeot Warszawa",
    metaDescription:
      "Niezależny warsztat obsługujący Peugeot i Citroën. Nie jesteśmy autoryzowanym serwisem PSA. BESS MOTORS.",
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
    line1: "Podłączenie od 50 zł · freon 65 zł/100 g",
    line2: "Napełnianie R134a i odgrzybianie",
    metaTitle: "Serwis klimatyzacji samochodowej Warszawa — od 115 zł",
    metaDescription:
      "Serwis klimatyzacji BESS MOTORS: podłączenie od 50 zł, R134a 65 zł/100 g, diagnostyka, odgrzybianie. Warszawa Włochy, Aleja Krakowska.",
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
