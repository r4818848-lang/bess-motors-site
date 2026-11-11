import { businessConfig } from "@/lib/businessConfig";
import { siteConfig } from "@/lib/site";

/**
 * Google Business Profile is not written from this app.
 * A credential name in the environment is not treated as API access.
 */

export const GBP_API_ENV_NAMES = [
  "GOOGLE_BUSINESS_PROFILE_CREDENTIALS",
  "GBP_ACCOUNT_ID",
  "GBP_LOCATION_ID",
] as const;

export type GbpApiStatus = {
  api: "UNAVAILABLE";
  writes: "disabled";
  reason: string;
  configuredNames: string[];
};

export function describeGbpAccess(env: Record<string, string | undefined>): GbpApiStatus {
  const configuredNames = GBP_API_ENV_NAMES.filter((name) => Boolean(env[name]?.trim()));
  return {
    api: "UNAVAILABLE",
    writes: "disabled",
    reason:
      configuredNames.length === 0
        ? "Brak potwierdzonych uprawnień Google Business Profile API. Publikacja idzie wyłącznie przez oficjalny interfejs po akceptacji właściciela."
        : "Nazwy zmiennych są ustawione, ale ten kod nie czyta sekretów i nie wywołuje API.",
    configuredNames,
  };
}

export const SITE_NAP_FACTS = {
  name: businessConfig.name,
  streetAddress: businessConfig.streetAddress,
  postalCode: businessConfig.postalCode,
  locality: businessConfig.addressLocality,
  phone: businessConfig.phoneDisplay,
  hours: businessConfig.workingHoursLabel,
  website: "https://www.bess-motors.com/",
  bookingUrl: "https://www.bess-motors.com/booking",
  mapsUrl: businessConfig.googleMapsUrl,
  placeId: businessConfig.googlePlaceId,
  saturdayCloses: businessConfig.openingHours.saturdayCloses,
} as const;

export type GbpChecklistItem = {
  id: string;
  labelPl: string;
  siteFact: string;
  profileFact: "UNAVAILABLE";
  ownerActionPl: string;
};

/** Profile fields we could not read. The site column is the value to compare by hand. */
export function gbpChecklist(): GbpChecklistItem[] {
  return [
    {
      id: "name",
      labelPl: "Nazwa",
      siteFact: SITE_NAP_FACTS.name,
      profileFact: "UNAVAILABLE",
      ownerActionPl: "Zostaw nazwę z szyldu. Nie dopisuj „wulkanizacja” ani „mechanik” do oficjalnej nazwy.",
    },
    {
      id: "address",
      labelPl: "Adres",
      siteFact: `${SITE_NAP_FACTS.streetAddress}, ${SITE_NAP_FACTS.postalCode} ${SITE_NAP_FACTS.locality}`,
      profileFact: "UNAVAILABLE",
      ownerActionPl: "Jeden warsztat. Nie dodawaj pinów dla dzielnic.",
    },
    {
      id: "phone",
      labelPl: "Telefon",
      siteFact: SITE_NAP_FACTS.phone,
      profileFact: "UNAVAILABLE",
      ownerActionPl: "Porównaj z kartą. Na stronie i w JSON-LD jest ten numer.",
    },
    {
      id: "hours",
      labelPl: "Godziny",
      siteFact: SITE_NAP_FACTS.hours,
      profileFact: "UNAVAILABLE",
      ownerActionPl: "Sobota do 14:00, niedziela zamknięte. Sprawdź, czy karta nie ma starego zakresu do 18:00.",
    },
    {
      id: "special-hours",
      labelPl: "Godziny specjalne",
      siteFact: "Brak świąt w kodzie strony",
      profileFact: "UNAVAILABLE",
      ownerActionPl: "Wpisz święta ręcznie, gdy warsztat jest zamknięty.",
    },
    {
      id: "website",
      labelPl: "Strona i rezerwacja",
      siteFact: `${SITE_NAP_FACTS.website} · ${SITE_NAP_FACTS.bookingUrl}`,
      profileFact: "UNAVAILABLE",
      ownerActionPl: "Link rezerwacji: /booking. Nie podmieniaj na obcy kalendarz.",
    },
    {
      id: "categories",
      labelPl: "Kategorie i usługi",
      siteFact: "AutoRepair w JSON-LD. Usługi: wulkanizacja, mechanik, olej, diagnostyka, hamulce, zawieszenie, klimatyzacja, rozrząd, silnik, skrzynia.",
      profileFact: "UNAVAILABLE",
      ownerActionPl: "Kategorię główną i dodatkowe ustaw w karcie. Nie oznaczaj geometrii kół ani dynamicznej wymiany ATF.",
    },
    {
      id: "photos",
      labelPl: "Zdjęcia",
      siteFact: "Zdjęcia warsztatu są w galerii strony. Ten sprint nie dodaje nowych zdjęć.",
      profileFact: "UNAVAILABLE",
      ownerActionPl: "Dodawaj zdjęcia hali i stanowisk bez tablic, VIN i twarzy klientów.",
    },
    {
      id: "description",
      labelPl: "Opis",
      siteFact: "Niezależny serwis przy Alei Krakowskiej 48/52, Włochy.",
      profileFact: "UNAVAILABLE",
      ownerActionPl: "Opis po polsku, bez listy dzielnic jako osobnych adresów.",
    },
  ];
}

export type ContentDraft = {
  id: string;
  kind: "service" | "season" | "completed_work" | "tip" | "workshop_photo" | "review_reply" | "review_request";
  status: "draft";
  autoPublish: false;
  requiresOwnerApproval: true;
  titlePl: string;
  bodyPl: string;
  blockedReason: string | null;
};

export function gbpDrafts(): ContentDraft[] {
  return [
    {
      id: "post-tires-season",
      kind: "season",
      status: "draft",
      autoPublish: false,
      requiresOwnerApproval: true,
      titlePl: "Sezonowa wymiana opon",
      bodyPl:
        "W BESS MOTORS przy Alei Krakowskiej 48/52 wymieniamy opony i wyważamy koła. Termin potwierdzamy po kontakcie. Aktualny cennik jest na stronie, a nie w tym szkicu.",
      blockedReason: null,
    },
    {
      id: "post-oil",
      kind: "service",
      status: "draft",
      autoPublish: false,
      requiresOwnerApproval: true,
      titlePl: "Wymiana oleju i filtrów",
      bodyPl:
        "Wymieniamy olej i filtry po doborze do samochodu. Olej i filtr są liczone osobno od robocizny. Umów wizytę online albo zadzwoń.",
      blockedReason: null,
    },
    {
      id: "post-diagnostic-tip",
      kind: "tip",
      status: "draft",
      autoPublish: false,
      requiresOwnerApproval: true,
      titlePl: "Check Engine nie jest wyceną naprawy",
      bodyPl:
        "Lampka Check Engine oznacza kod błędu, a nie gotową naprawę. Najpierw odczyt, potem wyjaśnienie, co jest pilne. Zakres zależy od auta i sprzętu w warsztacie.",
      blockedReason: null,
    },
    {
      id: "post-workshop-photo",
      kind: "workshop_photo",
      status: "draft",
      autoPublish: false,
      requiresOwnerApproval: true,
      titlePl: "Zdjęcie hali",
      bodyPl: "Podpis: stanowisko w serwisie BESS MOTORS, Aleja Krakowska 48/52. Dołącz prawdziwe zdjęcie z galerii warsztatu.",
      blockedReason: "Brak nowego pliku zdjęcia w tym szkicu. Nie wstawiaj grafiki wygenerowanej jako zdjęcia warsztatu.",
    },
    {
      id: "post-completed-work",
      kind: "completed_work",
      status: "draft",
      autoPublish: false,
      requiresOwnerApproval: true,
      titlePl: "Wykonana praca",
      bodyPl: "Uzupełnij ten szkic dopiero powiązanym, opublikowanym case z panelu SEO. Nie wpisuj marki, usterki ani ceny z pamięci.",
      blockedReason: "Szkic jest zablokowany, dopóki nie wskaże opublikowanego case.",
    },
    {
      id: "review-reply-neutral",
      kind: "review_reply",
      status: "draft",
      autoPublish: false,
      requiresOwnerApproval: true,
      titlePl: "Odpowiedź na opinię",
      bodyPl:
        "Dziękujemy za opinię o wizycie w BESS MOTORS. Jeśli coś mamy poprawić, zadzwoń do warsztatu — nie pisz tu numeru rejestracyjnego ani szczegółów naprawy.",
      blockedReason: "Nie wiąż tego tekstu z opinią, której nie ma w eksporcie z karty. Nie wysyłaj bez podglądu.",
    },
    {
      id: "review-request-after-visit",
      kind: "review_request",
      status: "draft",
      autoPublish: false,
      requiresOwnerApproval: true,
      titlePl: "Prośba o opinię po zakończonej wizycie",
      bodyPl:
        "Dzień dobry, tu BESS MOTORS. Wizyta jest zakończona. Jeśli chce Pan/Pani, opinia w Google pomoże innym kierowcom. Nie jest do niczego potrzebna i nic za nią nie dajemy. Link do karty wyślemy dopiero po Pana/Pani zgodzie.",
      blockedReason: "Nie wysyłać automatycznie i nie dołączać rabatu za opinię.",
    },
  ];
}

export const MAPS_RANK_STATUS = {
  status: "NO_DATA" as const,
  method:
    "Pozycja Maps wymaga siatki punktów wokół warsztatu i zapytań w trybie mapy. Tego pomiaru nie wykonano. Pozycja organiczna z Search Console nie jest pozycją Maps.",
  organicPositionUsedAsMaps: false,
};

export const GBP_PROFILE_URL = siteConfig.googleMapsReviewsUrl || businessConfig.googleMapsUrl;
