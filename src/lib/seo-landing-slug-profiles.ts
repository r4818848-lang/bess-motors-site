import type { ServiceId } from "@/lib/services-catalog";
import { getPriceItem } from "@/lib/price-list";
import { acHookupPricePln, acR134aPer100gPln, acRechargeFromPln } from "@/lib/ac-recharge-prices";
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

/** Shown on brand SEO landings — avoids confusion with official dealerships */
const BRAND_INDEPENDENT_FAQ = {
  q: L(
    "Czy jesteście autoryzowanym dealerem lub salonem marki?",
    "Вы официальный дилер или салон марки?"
  ),
  a: L(
    "Nie. BESS MOTORS to niezależny warsztat samochodowy. Obsługujemy wiele marek; współpracujemy z dostawcami części i olejów (m.in. Inter Cars, Motul, Castrol). Nazwy marek należą do ich właścicieli.",
    "Нет. BESS MOTORS — независимый автосервис. Мы обслуживаем разные марки и сотрудничаем с поставщиками запчастей и масел (Inter Cars, Motul, Castrol и др.). Названия брендов принадлежат правообладателям."
  ),
};

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
      {
        title: L("Raport po diagnostyce", "Отчёт после диагностики"),
        body: L(
          "Dostajesz listę kodów błędów z wyjaśnieniem, priorytetami napraw i orientacyjną wyceną. Bez żargonu — wiesz co jest pilne.",
          "Список кодов с объяснением, приоритетами и ориентировочной сметой. Без жаргона."
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
    education: [
      {
        title: L("Pełny serwis olejowy — nie tylko wlewanie", "Полный масляный сервис"),
        body: L(
          "Spuszczamy stary olej, wymieniamy filtr oleju, uzupełniamy specyfikacją pod VIN. Kontrolujemy poziom i szczelność — auto gotowe z naklejką serwisową.",
          "Сливаем старое масло, меняем фильтр, заливаем по VIN. Проверяем уровень и герметичность — наклейка о сервисе."
        ),
      },
      {
        title: L("Marki oleju w warsztacie", "Масла в сервисе"),
        body: L(
          "Castrol, Motul, Shell, Liqui Moly — dobieramy normę producenta (VW 504.00, BMW LL-04, MB 229.5). Możesz przywieźć własny olej po wcześniejszym uzgodnieniu.",
          "Castrol, Motul, Shell, Liqui Moly — норма производителя. Можно со своим маслом по согласованию."
        ),
      },
    ],
  },
  hamulce: {
    faqDuration: L("Wymiana klocków: 1–2 godziny; z tarczami dłużej.", "Колодки: 1–2 часа; с дисками дольше."),
    education: [
      {
        title: L("Klocki, tarcze i pełny układ hamulcowy", "Колодки, диски и вся тормозная система"),
        body: L(
          "Nie ograniczamy się do klocków — wymieniamy tarcze, przewody, zaciski i płyn hamulcowy. Mierzymy grubość tarcz i klocków, sprawdzamy szczelność układu.",
          "Не только колодки — диски, шланги, суппорты и тормозная жидкость. Замеряем толщину дисков и колодок, проверяем герметичность."
        ),
      },
      {
        title: L("Przejrzyste ceny — bez niespodzianek", "Прозрачные цены"),
        body: L(
          "Klocki na jedną oś od 120 zł, tarcze z klockami od 220 zł za oś. Przed montażem pokazujemy zużyte części i akceptujesz zakres.",
          "Колодки на ось от 120 zł, диски с колодками от 220 zł за ось. Перед работой показываем изношенные детали."
        ),
      },
    ],
    price: {
      fromZl: 120,
      priceFrom: false,
      materialsExtra: true,
        includes: [
        L("Wymiana klocków hamulcowych", "Замена тормозных колодок"),
        L("Wymiana tarcz hamulcowych (gdy zużyte)", "Замена тормозных дисков при износе"),
        L("Kontrola zacisków, przewodów i płynu", "Проверка суппортов, шлангов и жидкости"),
        L("Jazda testowa po naprawie", "Тест-драйв после ремонта"),
      ],
      priceTable: [
        {
          label: L("Wymiana klocków (jedna oś)", "Замена колодок (одна ось)"),
          priceZl: 120,
        },
        {
          label: L("Tarcze + klocki (jedna oś)", "Диски + колодки (одна ось)"),
          priceZl: 220,
        },
      ],
    },
  },
  klimatyzacja: {
    faqDuration: L("Serwis klimy: 1–2 godziny.", "Кондиционер: 1–2 часа."),
    galleryTags: ["klim", "ac"],
    education: [
      {
        title: L("Sezon letni — czas na serwis klimatyzacji", "Летний сезон — пора обслужить кондиционер"),
        body: L(
          "Nawet gdy klima jeszcze chłodzi, czynnik naturalnie ubywa. Przed upałami warto zrobić próżnię, kontrolę szczelności i uzupełnienie R134a lub R1234yf — mniejsze obciążenie sprężarki i komfort w aucie.",
          "Даже если кондиционер ещё холодит, хладагент со временем уходит. Перед жарой — вакуум, проверка герметичности и заправка R134a или R1234yf: меньше нагрузка на компрессор и комфорт в салоне."
        ),
      },
      {
        title: L("Co robimy w BESS MOTORS", "Что делаем в BESS MOTORS"),
        body: L(
          "Diagnostyka układu, napełnianie czynnikiem, ozonowanie i odgrzybianie, naprawa nieszczelności, wymiana sprężarki lub chłodnicy — obsługujemy większość aut osobowych.",
          "Диагностика, заправка, озонирование и антигрибок, устранение утечек, замена компрессора или радиатора — обслуживаем большинство легковых авто."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Ile kosztuje nabijanie klimatyzacji?", "Сколько стоит заправка кондиционера?"),
        a: L(
          `Podłączenie układu ${acHookupPricePln()} zł, freon R134a ${acR134aPer100gPln()} zł/100 g — dokładna ilość czynnika zależy od modelu. R1234yf według cennika.`,
          `Подключение ${acHookupPricePln()} zł, фреон R134a ${acR134aPer100gPln()} zł/100 г — объём зависит от модели. R1234yf по прайсу.`
        ),
      },
      {
        q: L("Od ile zł kosztuje pełna zaprawa klimy?", "От какой суммы заправка кондиционера?"),
        a: L(
          `Minimum to podłączenie (${acHookupPricePln()} zł) plus 100 g czynnika (${acR134aPer100gPln()} zł) — od ${acRechargeFromPln()} zł. Większość aut wymaga więcej niż 100 g.`,
          `Минимум: подключение (${acHookupPricePln()} zł) + 100 г фреона (${acR134aPer100gPln()} zł) — от ${acRechargeFromPln()} zł. Большинству авто нужно больше 100 г.`
        ),
      },
      {
        q: L("Czy można umówić się tego samego dnia?", "Можно записаться в тот же день?"),
        a: L(
          "Tak — w sezonie letnim staramy się przyjąć auto tego samego dnia. Zapis online lub telefon +48 791 257 229.",
          "Да — в летний сезон стараемся принять авто в тот же день. Онлайн-запись или телефон +48 791 257 229."
        ),
      },
    ],
    price: {
      fromZl: acRechargeFromPln(),
      priceFrom: true,
      materialsExtra: true,
      includes: [
        L("Podłączenie układu i próżniowanie", "Подключение и вакуумирование"),
        L("Napełnianie R134a lub R1234yf", "Заправка R134a или R1234yf"),
        L("Kontrola szczelności i ciśnienia", "Проверка герметичности и давления"),
        L("Odgrzybianie / ozonowanie (opcjonalnie)", "Антигрибок / озонирование (опционально)"),
      ],
      priceTable: [
        {
          label: L("Podłączenie układu klimatyzacji", "Подключение системы кондиционера"),
          priceZl: acHookupPricePln(),
          priceFrom: false,
        },
        {
          label: L("Napełnianie R134a (za 100 g)", "Заправка R134a (за 100 г)"),
          priceZl: acR134aPer100gPln(),
          priceFrom: false,
        },
        {
          label: L("Napełnianie R1234yf (za 100 g)", "Заправка R1234yf (за 100 г)"),
          priceZl: getPriceItem("ac_r1234yf")?.basePrice ?? 100,
          priceFrom: true,
        },
        {
          label: L("Diagnostyka klimatyzacji", "Диагностика кондиционера"),
          priceZl: getPriceItem("ac_diag")?.basePrice ?? 150,
          priceFrom: true,
        },
        {
          label: L("Odgrzybianie klimatyzacji", "Антигрибок кондиционера"),
          priceZl: getPriceItem("ac_clean")?.basePrice ?? 150,
          priceFrom: true,
        },
      ],
    },
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
        title: L("Niezależny serwis BMW w BESS MOTORS", "Независимый сервис BMW"),
        body: L(
          "Zaawansowana diagnostyka, oleje Longlife, hamulce, zawieszenie i elektryka. Znamy typowe usterki N47, B48, xDrive. Nie jesteśmy dealerem BMW.",
          "Диагностика, масла Longlife, тормоза, подвеска. Знаем N47, B48, xDrive. Мы не дилер BMW."
        ),
      },
      {
        title: L("Oleje i serwis okresowy BMW", "Масло и ТО BMW"),
        body: L(
          "Oleje LL-04, LL-12FE, filtry OEM/OES od sprawdzonych dostawców. Naklejka serwisowa z datą i przebiegiem.",
          "Масла LL-04, LL-12FE, фильтры OEM/OES. Сервисная наклейка."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
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
        title: L("Niezależny serwis Mercedes-Benz", "Независимый сервис Mercedes"),
        body: L(
          "Diagnostyka, serwis olejowy MB 229.5, hamulce, klima, elektryka. Obsługa A/B/C/GLA/GLC i klasy E. Nie jesteśmy autoryzowanym salonem Mercedes.",
          "Диагностика, масло MB 229.5, тормоза, климат. Мы не официальный салон Mercedes."
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
      BRAND_INDEPENDENT_FAQ,
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
          "Doświadczenie VAG: DSG, rozrząd, olej 504.00, diagnostyka. Niezależny warsztat — nie jesteśmy dealerem VAG.",
          "Опыт VAG: DSG, ГРМ, масло 504.00. Независимый сервис, не дилер VAG."
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
      BRAND_INDEPENDENT_FAQ,
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
  "warszawa-mokotow": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Serwis dla południowego Mokotowa", "Сервис для южного Mokotów"),
        body: L(
          "Z Służewca, Służewca lub Okęcia dojazd do Alei Krakowskiej 48/52 zajmuje zwykle 10–15 min. Diagnostyka, opony, hamulce, olej.",
          "Из Służewiec/Okęcie — 10–15 мин до Aleja Krakowska."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy obsługujecie kierowców z Mokotowa?", "Обслуживаете Mokotów?"),
        a: L(
          "Tak — wielu klientów dojeżdża z południowego Mokotowa. Warsztat leży przy głównej Alei Krakowskiej (Włochy).",
          "Да — многие клиенты едут с южного Mokotów."
        ),
      },
    ],
    faqDuration: L("Wizyta: od 30 min (diagnostyka) do całego dnia.", "Визит: от 30 мин до дня."),
  },
  "warszawa-ochota": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Mechanik blisko Ochoty i Rakowca", "Механик рядом с Ochota"),
        body: L(
          "BESS MOTORS — ok. 15 min autem z Rakowca lub Szczęśliwic. Kompleksowy serwis: diagnostyka, hamulce, klima, opony.",
          "Ок. 15 мин от Rakowiec. Диагностика, тормоза, кондиционер."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Jak dojechać z Ochoty?", "Как доехать с Ochota?"),
        a: L(
          "Aleja Krakowska 48/52 (Włochy) — trasa przez Południową obwodnicę lub Al. Krakowską. Parking przy warsztacie.",
          "Aleja Krakowska 48/52 — через obwodnicę или Aleja Krakowska."
        ),
      },
    ],
    faqDuration: L("Czas naprawy zależy od zakresu — informujemy po diagnostyce.", "Время — после диагностики."),
  },
  "serwis-audi": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Niezależny serwis Audi Warszawa", "Независимый сервис Audi"),
        body: L(
          "Quattro, TFSI, TDI — diagnostyka VAG, olej 504.00, hamulce, DSG, elektryka. Niezależny warsztat — nie jesteśmy salonem Audi.",
          "Quattro, TFSI, TDI — VAG, DSG. Независимый сервис, не салон Audi."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
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
        title: L("Niezależny serwis Toyota i Lexus", "Независимый сервис Toyota / Lexus"),
        body: L(
          "Hybrydy i benzyna — olej 0W-20/0W-16, hamulce, diagnostyka Check Engine, serwis okresowy. Nie jesteśmy dealerem Toyota.",
          "Гибриды и бензин — масло 0W-20, тормоза. Мы не дилер Toyota."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
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
      BRAND_INDEPENDENT_FAQ,
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
    faqExtra: [BRAND_INDEPENDENT_FAQ],
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
    faqExtra: [BRAND_INDEPENDENT_FAQ],
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
      BRAND_INDEPENDENT_FAQ,
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
