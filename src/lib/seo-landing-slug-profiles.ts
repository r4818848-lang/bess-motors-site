import type { ServiceId } from "@/lib/services-catalog";
import { getPriceItem } from "@/lib/price-list";
import type {
  LocalizedText,
  ServiceLandingEducationItem,
  ServiceLandingPrice,
  ServiceLandingStep,
} from "@/lib/service-landing-content";

export type SlugLandingProfile = {
  /** Modal booking — may differ from page content (e.g. Toyota page → diag content, oil booking) */
  bookServiceId?: ServiceId;
  /** Steps / FAQ / education service key when different from `seo-landing-pages` serviceId */
  contentServiceId?: ServiceId;
  steps?: ServiceLandingStep[];
  education?: ServiceLandingEducationItem[];
  faqExtra?: { q: LocalizedText; a: LocalizedText }[];
  /** Overrides second general FAQ (duration) */
  faqDuration?: LocalizedText;
  price?: ServiceLandingPrice | null;
  galleryTags?: string[];
};

const L = (pl: string, ru: string): LocalizedText => ({ pl, ru });

const chipPriceTable: ServiceLandingPrice = {
  fromZl: getPriceItem("stage1")?.basePrice ?? 1200,
  priceFrom: true,
  materialsExtra: false,
  includes: [
    L("Diagnostyka ECU przed tuningiem", "Диагностика ECU"),
    L("Dobór i zapis mapy Stage 1 / 2", "Подбор и запись Stage 1 / 2"),
    L("Jazda testowa i kontrola parametrów", "Тест-драйв и проверка"),
  ],
  priceTable: [
    { label: L("Stage 1", "Stage 1"), priceZl: getPriceItem("stage1")?.basePrice ?? 1200, priceFrom: true },
    { label: L("Stage 2", "Stage 2"), priceZl: getPriceItem("stage2")?.basePrice ?? 2500, priceFrom: true },
    { label: L("Pops & Bangs", "Pops & Bangs"), priceZl: getPriceItem("pops_bangs")?.basePrice ?? 600, priceFrom: true },
  ],
};

/** Per-slug overrides — all 27 SEO landing URLs */
export const SEO_LANDING_SLUG_PROFILES: Record<string, SlugLandingProfile> = {
  diagnostyka: {
    education: [
      {
        title: L("Diagnostyka OBD w BESS MOTORS", "Диагностика OBD"),
        body: L(
          "Odczyt kodów, parametry na żywo, testy podzespołów — nie tylko kasowanie błędu Check Engine.",
          "Считывание кодов, live-параметры — не только сброс Check Engine."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy diagnostyka jest płatna?", "Диагностика платная?"),
        a: L(
          "Krótki odczyt kodów często bezpłatny — pełna diagnoza według cennika na stronie.",
          "Краткий odczyt часто бесплатен — полная диагностика по прайсу."
        ),
      },
    ],
    faqDuration: L("Diagnostyka komputerowa: zwykle 30–60 min.", "Компьютерная диагностика: обычно 30–60 мин."),
  },
  zawieszenie: {
    faqDuration: L("Diagnostyka i naprawa zawieszenia: od 1 do 4 godzin.", "Подвеска: от 1 до 4 часов."),
  },
  "wymiana-oleju": {
    faqDuration: L("Wymiana oleju i filtra: ok. 1 godziny.", "Замена масла: около 1 часа."),
  },
  hamulce: {
    faqDuration: L("Wymiana klocków: 1–2 godziny; z tarczami dłużej.", "Колодки: 1–2 часа; с дисками дольше."),
  },
  klimatyzacja: {
    faqDuration: L("Serwis klimy: 1–2 godziny.", "Кондиционер: 1–2 часа."),
  },
  geometria: {
    faqDuration: L("Geometria kół: ok. 1 godziny.", "Развал-схождение: около 1 часа."),
  },
  silnik: {
    faqDuration: L("Zależy od zakresu — wycena po diagnostyce silnika.", "Зависит от объёма — смета после диагностики."),
  },
  elektryka: {
    faqDuration: L("Diagnostyka elektryki: 1–3 godziny.", "Электрика: 1–3 часа."),
  },
  przeglad: {
    faqDuration: L("Przygotowanie do przeglądu: 2–4 godziny.", "Подготовка к техосмотру: 2–4 часа."),
    faqExtra: [
      {
        q: L("Co sprawdzacie przed przeglądem?", "Что проверяете перед техосмотром?"),
        a: L(
          "Światła, hamulce, zawieszenie, wycieki, emisja spalin, płyny — lista punktów przed wizytą na stacji.",
          "Свет, тормоза, подвеска, утечки, выхлоп, жидкости — чек-лист перед станцией."
        ),
      },
    ],
  },
  opony: {
    faqDuration: L("Wymiana 4 kół: 45–90 min.", "Замена 4 колёс: 45–90 мин."),
  },
  bmw: {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Serwis BMW w BESS MOTORS", "Сервис BMW"),
        body: L(
          "Diagnostyka ISTA-level, oleje Longlife, hamulce, zawieszenie i elektryka. Znamy typowe usterki N47, B48, xDrive.",
          "Диагностика, масла Longlife, тормоза, подвеска, электрика. Знаем типичные болячки N47, B48, xDrive."
        ),
      },
      {
        title: L("Oleje i serwis okresowy BMW", "Масло и ТО BMW"),
        body: L(
          "Oleje LL-04, LL-12FE, filtry oryginał lub OEM. Naklejka serwisowa z datą i przebiegiem.",
          "Масла LL-04, LL-12FE, фильтры OEM. Сервисная наклейка."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy serwisujecie wszystkie modele BMW?", "Все ли модели BMW?"),
        a: L("Tak — od serii 1 do X5/X6, diesel i benzyna.", "Да — от 1-й серии до X5/X6, дизель и бензин."),
      },
      {
        q: L("Czy używacie olejów zgodnych z BMW LL?", "Масла BMW LL?"),
        a: L("Tak — dobieramy specyfikację LL-04 / LL-12FE pod silnik.", "Да — LL-04 / LL-12FE по мотору."),
      },
    ],
    faqDuration: L("Wizyta serwisowa BMW: od 1 godziny.", "Визит BMW: от 1 часа."),
    galleryTags: ["bmw"],
  },
  mercedes: {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Serwis Mercedes-Benz", "Сервис Mercedes"),
        body: L(
          "Diagnostyka, serwis olejowy MB 229.5, hamulce, klima, elektryka. Obsługa A/B/C/GLA/GLC i klasy E.",
          "Диагностика, масло MB 229.5, тормоза, климат, электрика. A/B/C/GLA/GLC и E-класс."
        ),
      },
      {
        title: L("Oleje MB i AdBlue", "Масла MB и AdBlue"),
        body: L(
          "Dobór specyfikacji 229.5 / 229.51, kontrola poziomu AdBlue i układu SCR.",
          "Подбор 229.5 / 229.51, контроль AdBlue и SCR."
        ),
      },
      {
        title: L("Hamulce i zawieszenie Mercedes", "Тормоза и подвеска"),
        body: L(
          "Klocki, tarcze, amortyzatory — części OEM lub jakości premium, z gwarancją na robociznę.",
          "Колодки, диски, амортизаторы — OEM или premium."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy macie doświadczenie z AdBlue i dieslami?", "AdBlue и дизели?"),
        a: L("Tak — diagnostyka układu SCR i typowych błędów silników CDI.", "Да — SCR и типичные ошибки CDI."),
      },
    ],
    faqDuration: L("Serwis Mercedes: zwykle 1–3 godziny.", "Mercedes: обычно 1–3 часа."),
    galleryTags: ["mercedes"],
  },
  vag: {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Grupa VAG — Audi, VW, Skoda, Seat", "Группа VAG"),
        body: L(
          "Specjalizacja VAG: DSG, rozrząd, olej 504.00, diagnostyka VCDS. Warszawa Aleja Krakowska.",
          "VAG: DSG, ГРМ, масло 504.00, VCDS. Варшава."
        ),
      },
      {
        title: L("Skrzynie DSG i rozrząd", "DSG и ГРМ"),
        body: L(
          "Wymiana oleju DSG, kontrola łańcucha/rozrzedu — według przebiegu i historii serwisu.",
          "Масло DSG, цепь ГРМ — по пробегу и истории."
        ),
      },
      {
        title: L("Elektryka i klima VAG", "Электрика и климат VAG"),
        body: L(
          "Błędy komfortu, oświetlenie, nagrzewnica — diagnostyka modułowa.",
          "Комфорт, свет, печка — модульная диагностика."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy serwisujecie skrzynie DSG?", "DSG?"),
        a: L("Tak — wymiana oleju DSG, diagnostyka i naprawy według wyceny.", "Да — масло DSG, диагностика и ремонт."),
      },
    ],
    faqDuration: L("Wizyta VAG: od 1 godziny.", "VAG: от 1 часа."),
    galleryTags: ["audi", "vw", "vag"],
  },
  kontakt: {
    bookServiceId: "diagnostic",
    steps: [
      {
        title: L("Wybierz termin online", "Выберите время онлайн"),
        description: L(
          "Kalendarz 24/7 — dzień, godzina, rodzaj usługi. Potwierdzenie SMS/Telegram.",
          "Календарь 24/7 — день, час, услуга. Подтверждение SMS/Telegram."
        ),
      },
      {
        title: L("Przyjazd na Aleję Krakowską 48/52", "Приезд на Aleja Krakowska 48/52"),
        description: L(
          "Dogodny dojazd S2 i lotnisko Chopina. Parking przy warsztacie.",
          "Удобно с S2 и аэропорта. Парковка у сервиса."
        ),
      },
      {
        title: L("Obsługa w warsztacie", "Обслуживание"),
        description: L(
          "Mechanik przyjmuje auto, ustala zakres i orientacyjny czas zakończenia.",
          "Механик принимает авто, согласует объём и срок."
        ),
      },
      {
        title: L("Odbiór lub kontakt w sprawie postępu", "Выдача или связь"),
        description: L(
          "Status naprawy online w kliencie lub telefon — wiesz, kiedy odebrać auto.",
          "Статус онлайн в кабинете или звонок — знаете, когда забрать авто."
        ),
      },
    ],
    education: [
      {
        title: L("Jak umówić wizytę?", "Как записаться?"),
        body: L(
          "Online, telefon +48 791 257 229, WhatsApp lub Telegram @bessmotors_bot — wybierz, co wygodnie.",
          "Онлайн, телефон, WhatsApp или Telegram — как удобнее."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Gdzie dokładnie jest warsztat?", "Где сервис?"),
        a: L("Aleja Krakowska 48/52, 02-284 Warszawa (Włochy).", "Aleja Krakowska 48/52, Warszawa."),
      },
      {
        q: L("Czy mogę umówić się na dziś?", "Можно на сегодня?"),
        a: L("Sprawdź wolne terminy w kalendarzu — często mamy slot tego samego dnia.", "Смотрите календарь — часто есть слот в тот же день."),
      },
    ],
    price: {
      fromZl: 0,
      priceFrom: false,
      materialsExtra: false,
      includes: [
        L("Rezerwacja online 24/7", "Онлайн-запись 24/7"),
        L("Potwierdzenie terminu", "Подтверждение времени"),
        L("Konsultacja przy przyjęciu auta", "Консультация при приёме"),
      ],
      note: L("Ceny poszczególnych usług — w cenniku na stronie.", "Цены услуг — в прайсе на сайте."),
    },
  },
  "warszawa-wlochy": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Mechanik Włochy / Okęcie", "Механик Włochy / Okęcie"),
        body: L(
          "BESS MOTORS przy Alei Krakowskiej — 5 min od trasy na lotnisko. Diagnostyka, opony, olej, hamulce, klima.",
          "У Alei Krakowskiej — 5 мин до аэропорта. Диагностика, шины, масло, тормоза."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy jest parking?", "Есть парковка?"),
        a: L("Tak — możesz zostawić auto na czas naprawy przy warsztacie.", "Да — парковка на время ремонта."),
      },
    ],
    faqDuration: L("Wizyta: od 30 min (diagnostyka) do całego dnia (naprawa).", "Визит: от 30 мин до полного дня."),
  },
  "warszawa-ursynow": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Serwis dla mieszkańców Ursynowa", "Сервис для Ursynów"),
        body: L(
          "Dojazd z Ursynowa i Mokotowa przez S2 lub Al. Krakowską — ok. 15–20 min. Umów wizytę bez kolejki.",
          "Из Ursynów и Mokotów — 15–20 мин. Запись без очереди."
        ),
      },
      {
        title: L("Usługi na miejscu", "Услуги на месте"),
        body: L(
          "Olej, opony, hamulce, geometria, diagnostyka — kompleksowo w jednym warsztacie.",
          "Масло, шины, тормоза, развал, диагностика — всё в одном сервисе."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Jak dojechać z Ursynowa?", "Как доехать с Ursynów?"),
        a: L("S2 do Włoch lub Aleja Krakowska 48/52 — ok. 15–20 min.", "S2 до Włoch или Aleja Krakowska — 15–20 мин."),
      },
    ],
    faqDuration: L("Czas zależy od usługi — podajemy przy rezerwacji.", "Время — при записи."),
  },
  "serwis-audi": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Serwis Audi Warszawa", "Сервис Audi"),
        body: L(
          "Quattro, TFSI, TDI — diagnostyka VAG, olej 504.00, hamulce, DSG, elektryka. Nie musisz jechać do ASO.",
          "Quattro, TFSI, TDI — VAG, масло 504.00, DSG, электрика."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy obsługujecie Audi A3/A4/Q5?", "A3/A4/Q5?"),
        a: L("Tak — wszystkie modele Audi grupy VAG.", "Да — все модели VAG."),
      },
    ],
    galleryTags: ["audi"],
  },
  "serwis-toyota": {
    bookServiceId: "oil",
    contentServiceId: "diagnostic",
    education: [
      {
        title: L("Toyota i Lexus", "Toyota и Lexus"),
        body: L(
          "Hybrydy i benzyna — olej 0W-20/0W-16, hamulce, diagnostyka Check Engine, serwis okresowy.",
          "Гибриды и бензин — масло 0W-20, тормоза, Check Engine."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy serwisujecie Prius / hybrid?", "Prius / hybrid?"),
        a: L("Tak — obsługa hybryd po procedurze producenta.", "Да — гибриды по процедуре."),
      },
    ],
  },
  "serwis-opel": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Opel i Chevrolet", "Opel и Chevrolet"),
        body: L(
          "Astra, Insignia, Corsa — diagnostyka, zawieszenie, hamulce, olej Dexos2.",
          "Astra, Insignia — диагностика, подвеска, Dexos2."
        ),
      },
      {
        title: L("Typowe usterki Opla", "Типичные болячки Opel"),
        body: L(
          "EGR, kolektor, elektryka — diagnozujemy przed wymianą części.",
          "EGR, коллектор, электрика — диагностика до замены."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy macie olej Dexos2?", "Dexos2?"),
        a: L("Tak — dobieramy specyfikację pod silnik.", "Да — по мотору."),
      },
    ],
    faqDuration: L("Serwis Opel: od 1 godziny.", "Opel: от 1 часа."),
  },
  "serwis-ford": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Ford Focus, Kuga, Mondeo", "Ford Focus, Kuga"),
        body: L(
          "Ecoboost i diesel — typowe usterki, rozrząd, olej, hamulce, elektryka.",
          "Ecoboost и дизель — ГРМ, масло, тормоза."
        ),
      },
      {
        title: L("PowerShift / automat", "PowerShift / АКПП"),
        body: L(
          "Diagnostyka skrzyni, wymiana oleju ATF według zaleceń producenta.",
          "Диагностика КПП, замена ATF."
        ),
      },
    ],
    faqDuration: L("Ford: zwykle 1–3 godziny.", "Ford: 1–3 часа."),
  },
  "serwis-renault": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Renault / Dacia", "Renault / Dacia"),
        body: L(
          "Megane, Clio, Duster — diagnostyka, hamulce, zawieszenie, klima.",
          "Megane, Clio, Duster — диагностика, тормоза, кондиционер."
        ),
      },
      {
        title: L("Klima i elektryka Renault", "Климат Renault"),
        body: L(
          "Nabicie klimy, odgrzybianie, błędy BSI — obsługa po diagnozie.",
          "Заправка, антибактериальная, BSI."
        ),
      },
    ],
    faqDuration: L("Renault / Dacia: od 1 godziny.", "Renault: от 1 часа."),
  },
  "serwis-peugeot": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Peugeot / Citroën PSA", "Peugeot / Citroën"),
        body: L(
          "Silniki PureTech i HDi — diagnostyka, rozrząd, hamulce, olej.",
          "PureTech и HDi — диагностика, ГРМ, масло."
        ),
      },
      {
        title: L("PureTech — rozrząd na czas", "PureTech — ГРМ вовремя"),
        body: L(
          "Kontrola łańcucha rozrządu i oleju — zapobiega kosztownym naprawom.",
          "Контроль цепи ГРМ и масла — профилактика."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy serwisujecie Citroën?", "Citroën?"),
        a: L("Tak — grupa PSA, te same procedury.", "Да — группа PSA."),
      },
    ],
    faqDuration: L("Peugeot / Citroën: od 1 godziny.", "Peugeot: от 1 часа."),
  },
  "check-engine": {
    bookServiceId: "diagnostic",
    steps: [
      {
        title: L("Opis objawów i rezerwacja", "Симптомы и запись"),
        description: L(
          "Świeci się kontrolka — umów termin, opisz kiedy się zapala (na zimno, pod obciążeniem).",
          "Горит лампа — запишитесь, опишите когда загорается."
        ),
      },
      {
        title: L("Odczyt kodów OBD", "Считывание OBD"),
        description: L(
          "Podłączamy skaner, odczytujemy błędy aktualne i zapisane w pamięci ECU.",
          "Сканер, текущие и сохранённые коды ECU."
        ),
      },
      {
        title: L("Analiza przyczyny", "Анализ причины"),
        description: L(
          "Sprawdzamy parametry na żywo — nie tylko kasujemy błąd, szukamy źródła.",
          "Живые параметры — ищем причину, не только сброс."
        ),
      },
      {
        title: L("Plan naprawy i wycena", "План и смета"),
        description: L(
          "Dostajesz listę rekomendowanych napraw — decydujesz co robimy od razu.",
          "Список рекомендаций — решаете, что делаем сейчас."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy kasowanie błędu wystarczy?", "Достаточно сброса?"),
        a: L(
          "Nie zawsze — jeśli usterka zostaje, lampka wróci. Diagnozujemy przyczynę.",
          "Не всегда — если неисправность остаётся, лампа вернётся."
        ),
      },
    ],
    price: {
      fromZl: getPriceItem("check_engine")?.basePrice === 0 ? 150 : 150,
      priceFrom: true,
      materialsExtra: false,
      includes: [
        L("Odczyt kodów Check Engine", "Считывание Check Engine"),
        L("Omówienie z mechanikiem", "Разбор с механиком"),
        L("Rekomendacje napraw", "Рекомендации"),
      ],
      note: L("Krótki odczyt kodów może być bezpłatny — pełna diagnoza według cennika.", "Краткий оdczyt может быть бесплатным."),
    },
  },
  "klocki-hamulcowe": {
    bookServiceId: "brakePads",
    faqDuration: L("Wymiana klocków: ok. 1–2 godziny.", "Колодки: 1–2 часа."),
  },
  "serwis-klimatyzacji": {
    bookServiceId: "acRefill",
    faqDuration: L("Nabicie i odgrzybianie: 1–2 godziny.", "Заправка: 1–2 часа."),
  },
  "chip-tuning-warszawa": {
    bookServiceId: "chip",
    price: chipPriceTable,
    faqDuration: L("Stage 1: zwykle 1 dzień roboczy.", "Stage 1: обычно 1 рабочий день."),
  },
  promocje: {
    bookServiceId: "otherReason",
    steps: [
      {
        title: L("Sprawdź aktualne promocje", "Актуальные акции"),
        description: L(
          "Rabaty na wybrane usługi i sezonowe oferty — aktualizujemy na stronie i w Telegramie.",
          "Скидки на услуги — на сайте и в Telegram."
        ),
      },
      {
        title: L("Zarezerwuj z kodem promocyjnym", "Запись с промокодом"),
        description: L(
          "Przy rezerwacji online wpisz kod — zniżka naliczy się przy rozliczeniu.",
          "Введите код при онлайн-записи."
        ),
      },
      {
        title: L("Wizyta w warsztacie", "Визит"),
        description: L(
          "Realizujemy usługę według warunków promocji — bez ukrytych dopłat.",
          "Услуга по условиям акции — без скрытых доплат."
        ),
      },
      {
        title: L("Odbiór z rabatem", "Выдача со скидкой"),
        description: L(
          "Paragon z zastosowaną zniżką — zachowaj na kolejną wizytę program poleceń.",
          "Чек со скидкой — программа рефералов."
        ),
      },
    ],
    education: [
      {
        title: L("Program poleceń", "Реферальная программа"),
        body: L(
          "Poleć znajomego — oboje dostajecie bonus na kolejną wizytę. Szczegóły na /referral.",
          "Приведи друга — бонус обоим. Подробности на /referral."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Gdzie wpisać kod rabatowy?", "Куда ввести промокод?"),
        a: L("W formularzu rezerwacji online lub podaj mechanikowi przy przyjęciu.", "В форме записи или механику."),
      },
    ],
    price: {
      fromZl: 0,
      priceFrom: false,
      materialsExtra: false,
      includes: [
        L("Aktualne kody promocyjne online", "Промокоды онлайн"),
        L("Rabat przy rozliczeniu", "Скидка при оплате"),
      ],
      note: L("Warunki każdej promocji — w opisie akcji.", "Условия каждой акции — в описании."),
    },
  },
};

export function getSlugLandingProfile(slug: string): SlugLandingProfile | undefined {
  return SEO_LANDING_SLUG_PROFILES[slug];
}

export function resolveLandingBookServiceId(
  slug: string,
  serviceId?: ServiceId
): ServiceId | undefined {
  return getSlugLandingProfile(slug)?.bookServiceId ?? serviceId;
}

/** Content blocks (price/steps/education/FAQ) — never mix with booking-only overrides */
export function resolveLandingContentServiceId(
  slug: string,
  pageServiceId?: ServiceId
): ServiceId | undefined {
  const profile = getSlugLandingProfile(slug);
  return profile?.contentServiceId ?? pageServiceId ?? profile?.bookServiceId;
}
