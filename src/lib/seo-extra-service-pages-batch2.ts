/**
 * Extra SEO service landings — batch 2 (30 Warszawa URLs).
 * Body copy: PL / RU / EN / UK via LocalizedText.
 * Merged into EXTRA_SEO_* via seo-extra-service-pages.ts
 */
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import type { LocalizedText } from "@/lib/service-landing-content";
import type { SlugLandingProfile } from "@/lib/seo-landing-slug-profiles";
import { getPriceItem } from "@/lib/price-list";

const L = (pl: string, ru: string, en?: string, uk?: string): LocalizedText => ({
  pl, ru, en, uk,
});

export const EXTRA_SEO_SERVICE_PAGES_BATCH2: SeoLandingPage[] = [
  {
    slug: "wulkanizacja-warszawa",
    title: "Wulkanizacja i wymiana opon Warszawa",
    line1: "Wymiana, wyważanie i naprawa opon",
    line2: "Warszawa Włochy — Aleja Krakowska 48/52",
    metaTitle: "Wulkanizacja Warszawa | Wymiana opon",
    metaDescription:
      "Wulkanizacja Warszawa Włochy — wymiana i wyważanie opon, naprawa przebicia. BESS MOTORS, Aleja Krakowska 48/52. Umów wizytę lub zadzwoń +48 791 257 229.",
    serviceId: "tires",
    icon: "Circle",
  },
  {
    slug: "wymiana-opon-warszawa",
    title: "Wymiana opon Warszawa",
    line1: "Komplet 4 kół z wyważaniem",
    line2: "Szybki termin we Włochach",
    metaTitle: "Wymiana opon Warszawa",
    metaDescription:
      "Wymiana opon Warszawa Włochy z wyważaniem — komplet 4 kół. BESS MOTORS, Aleja Krakowska 48/52. Zapis online lub telefon +48 791 257 229.",
    serviceId: "tires",
    icon: "Circle",
  },
  {
    slug: "wywazanie-kol-warszawa",
    title: "Wyważanie kół Warszawa",
    line1: "Usuń wibracje kierownicy",
    line2: "Wyważanie opon na maszynie",
    metaTitle: "Wyważanie kół Warszawa",
    metaDescription:
      "Wyważanie kół Warszawa Włochy — mniej wibracji, równe zużycie opon. BESS MOTORS, Aleja Krakowska 48/52. Umów wizytę.",
    serviceId: "tires",
    icon: "Circle",
  },
  {
    slug: "naprawa-opon-warszawa",
    title: "Naprawa opon Warszawa",
    line1: "Naprawa przebitej opony",
    line2: "Demontaż, naprawa, montaż i wyważanie",
    metaTitle: "Naprawa opon Warszawa",
    metaDescription:
      "Naprawa opon Warszawa — przebicie, wulkanizacja opon. BESS MOTORS Włochy, Aleja Krakowska 48/52. Zapytaj o termin lub umów wizytę.",
    serviceId: "tires",
    icon: "Circle",
  },
  {
    slug: "wymiana-klockow-hamulcowych-warszawa",
    title: "Wymiana klocków hamulcowych Warszawa",
    line1: "Przód i tył — wycena przed montażem",
    line2: "Kod BessMotors na robociznę klocków",
    metaTitle: "Wymiana klocków hamulcowych Warszawa",
    metaDescription:
      "Wymiana klocków hamulcowych Warszawa — robocizna od 100 zł (kod BessMotors). BESS MOTORS Włochy. Umów wizytę lub zadzwoń +48 791 257 229.",
    serviceId: "brakePads",
    icon: "Disc",
  },
  {
    slug: "wymiana-tarcz-hamulcowych-warszawa",
    title: "Wymiana tarcz hamulcowych Warszawa",
    line1: "Tarcze z klockami lub osobno",
    line2: "Pomiar grubości i bicia przed decyzją",
    metaTitle: "Wymiana tarcz hamulcowych Warszawa",
    metaDescription:
      "Wymiana tarcz hamulcowych Warszawa — pomiar, wycena, montaż. BESS MOTORS Włochy, Aleja Krakowska 48/52. Zapis online.",
    serviceId: "brakePads",
    icon: "Disc",
  },
  {
    slug: "wymiana-plynu-hamulcowego-warszawa",
    title: "Wymiana płynu hamulcowego Warszawa",
    line1: "Świeży płyn i odpowietrzenie",
    line2: "Bezpieczeństwo pedału hamulca",
    metaTitle: "Wymiana płynu hamulcowego Warszawa",
    metaDescription:
      "Wymiana płynu hamulcowego Warszawa — wymiana i odpowietrzenie układu. BESS MOTORS Włochy. Umów wizytę lub zapytaj o wycenę.",
    serviceId: "brakesFull",
    icon: "Disc",
  },
  {
    slug: "wymiana-amortyzatorow-warszawa",
    title: "Wymiana amortyzatorów Warszawa",
    line1: "Przód / tył — diagnostyka przed wymianą",
    line2: "Mniej kołysania, lepsza przyczepność",
    metaTitle: "Wymiana amortyzatorów Warszawa",
    metaDescription:
      "Wymiana amortyzatorów Warszawa — diagnostyka zawieszenia i montaż. BESS MOTORS Włochy, Aleja Krakowska 48/52. Wycena przed pracą.",
    serviceId: "suspension",
    icon: "Settings",
  },
  {
    slug: "wymiana-wahaczy-warszawa",
    title: "Wymiana wahaczy Warszawa",
    line1: "Luzy, stuki, nierówne zużycie opon",
    line2: "Wycena po diagnostyce na podnośniku",
    metaTitle: "Wymiana wahaczy Warszawa",
    metaDescription:
      "Wymiana wahaczy Warszawa — stuki i luzy w zawieszeniu. BESS MOTORS Włochy. Geometria zalecana po wymianie. Umów wizytę.",
    serviceId: "suspension",
    icon: "Settings",
  },
  {
    slug: "naprawa-ukladu-kierowniczego-warszawa",
    title: "Naprawa układu kierowniczego Warszawa",
    line1: "Luzy, stuki, ściąganie auta",
    line2: "Maglownica, końcówki, diagnostyka",
    metaTitle: "Naprawa układu kierowniczego Warszawa",
    metaDescription:
      "Naprawa układu kierowniczego Warszawa — maglownica, drążki, końcówki. BESS MOTORS Włochy, Aleja Krakowska 48/52. Wycena po diagnostyce.",
    serviceId: "suspension",
    icon: "Crosshair",
  },
  {
    slug: "wymiana-przekladni-kierowniczej-warszawa",
    title: "Wymiana przekładni kierowniczej Warszawa",
    line1: "Maglownica — wycena indywidualna",
    line2: "Diagnostyka przed demontażem",
    metaTitle: "Wymiana przekładni kierowniczej Warszawa",
    metaDescription:
      "Wymiana przekładni kierowniczej (maglownicy) Warszawa. BESS MOTORS Włochy — diagnostyka, wycena, montaż. Aleja Krakowska 48/52.",
    serviceId: "suspension",
    icon: "Crosshair",
  },
  {
    slug: "wymiana-drazkow-kierowniczych-warszawa",
    title: "Wymiana drążków kierowniczych Warszawa",
    line1: "Końcówki i drążki — mniej luzu na kierownicy",
    line2: "Po wymianie zalecana geometria",
    metaTitle: "Wymiana drążków kierowniczych Warszawa",
    metaDescription:
      "Wymiana drążków i końcówek kierowniczych Warszawa. BESS MOTORS Włochy. Umów wizytę lub zadzwoń +48 791 257 229.",
    serviceId: "suspension",
    icon: "Crosshair",
  },
  {
    slug: "wymiana-filtrow-warszawa",
    title: "Wymiana filtrów samochodowych Warszawa",
    line1: "Olejowy, powietrza, kabinowy, paliwa",
    line2: "Dobór filtrów po VIN",
    metaTitle: "Wymiana filtrów Warszawa",
    metaDescription:
      "Wymiana filtrów Warszawa — powietrza, kabinowy, paliwa, olejowy. BESS MOTORS Włochy, Aleja Krakowska 48/52. Zapis online.",
    serviceId: "filters",
    icon: "Filter",
  },
  {
    slug: "wymiana-plynu-chlodniczego-warszawa",
    title: "Wymiana płynu chłodniczego Warszawa",
    line1: "Świeży płyn i kontrola układu",
    line2: "Mniej ryzyka przegrzania silnika",
    metaTitle: "Wymiana płynu chłodniczego Warszawa",
    metaDescription:
      "Wymiana płynu chłodniczego Warszawa — spust, napełnienie, kontrola. BESS MOTORS Włochy. Umów wizytę lub zapytaj o wycenę.",
    serviceId: "otherReason",
    icon: "Droplets",
  },
  {
    slug: "wymiana-swiec-zaplonowych-warszawa",
    title: "Wymiana świec zapłonowych Warszawa",
    line1: "Równa praca silnika benzynowego",
    line2: "Dobór świec pod silnik / VIN",
    metaTitle: "Wymiana świec zapłonowych Warszawa",
    metaDescription:
      "Wymiana świec zapłonowych Warszawa — lepszy rozruch i spalanie. BESS MOTORS Włochy, Aleja Krakowska 48/52. Umów wizytę.",
    serviceId: "engine",
    icon: "Zap",
  },
  {
    slug: "wymiana-alternatora-warszawa",
    title: "Wymiana alternatora Warszawa",
    line1: "Ładowanie akumulatora i elektryka",
    line2: "Diagnostyka przed wymianą",
    metaTitle: "Wymiana alternatora Warszawa",
    metaDescription:
      "Wymiana alternatora Warszawa — diagnostyka ładowania, montaż. BESS MOTORS Włochy. Wycena przed pracą, zapis online.",
    serviceId: "starterGen",
    icon: "Battery",
  },
  {
    slug: "wymiana-rozrusznika-warszawa",
    title: "Wymiana rozrusznika Warszawa",
    line1: "Trudny rozruch, klikania, brak obrotów",
    line2: "Sprawdzenie akumulatora i instalacji",
    metaTitle: "Wymiana rozrusznika Warszawa",
    metaDescription:
      "Wymiana rozrusznika Warszawa — diagnostyka rozruchu i montaż. BESS MOTORS Włochy, Aleja Krakowska 48/52. Umów wizytę.",
    serviceId: "starterGen",
    icon: "Battery",
  },
  {
    slug: "naprawa-wydechu-warszawa",
    title: "Naprawa układu wydechowego Warszawa",
    line1: "Spawanie, nieszczelności, hałas",
    line2: "Katalizator i tłumik — wycena po oględzinach",
    metaTitle: "Naprawa układu wydechowego Warszawa",
    metaDescription:
      "Naprawa układu wydechowego Warszawa — spawanie, tłumik, nieszczelności. BESS MOTORS Włochy. Zapytaj o wycenę lub umów wizytę.",
    serviceId: "exhaust",
    icon: "Flame",
  },
  {
    slug: "diagnostyka-silnika-warszawa",
    title: "Diagnostyka silnika Warszawa",
    line1: "Moc, dym, stuki, Check Engine",
    line2: "Komputer + ocena mechaniczna",
    metaTitle: "Diagnostyka silnika Warszawa",
    metaDescription:
      "Diagnostyka silnika Warszawa — Check Engine, parametry, wycena napraw. BESS MOTORS Włochy, Aleja Krakowska 48/52. Umów wizytę.",
    serviceId: "engine",
    icon: "Cog",
  },
  {
    slug: "test-kompresji-warszawa",
    title: "Pomiar kompresji silnika Warszawa",
    line1: "Ocena stanu cylindrów",
    line2: "Gdy silnik słabo ciągnie lub nierówno pracuje",
    metaTitle: "Pomiar kompresji silnika Warszawa",
    metaDescription:
      "Pomiar kompresji silnika Warszawa — diagnostyka stanu silnika. BESS MOTORS Włochy. Zapytaj o wycenę lub umów wizytę.",
    serviceId: "engine",
    icon: "Gauge",
  },
  {
    slug: "diagnostyka-dymem-warszawa",
    title: "Diagnostyka dymem układu dolotowego Warszawa",
    line1: "Szukanie nieszczelności dolotu",
    line2: "Gdy błędy mieszanki i nierówna praca",
    metaTitle: "Diagnostyka dymem Warszawa",
    metaDescription:
      "Diagnostyka dymem Warszawa — nieszczelności układu dolotowego. BESS MOTORS Włochy, Aleja Krakowska 48/52. Zapytaj o wycenę.",
    serviceId: "diagnostic",
    icon: "Wind",
  },
  {
    slug: "diagnostyka-przed-zakupem-warszawa",
    title: "Sprawdzenie samochodu przed zakupem Warszawa",
    line1: "Oględziny + diagnostyka przed transakcją",
    line2: "Raport z rekomendacjami",
    metaTitle: "Sprawdzenie samochodu przed zakupem Warszawa",
    metaDescription:
      "Sprawdzenie samochodu przed zakupem Warszawa — diagnostyka i oględziny. BESS MOTORS Włochy. Umów termin przed odbiorem auta.",
    serviceId: "diagnostic",
    icon: "ScanLine",
  },
  {
    slug: "wymiana-pompy-wody-warszawa",
    title: "Wymiana pompy wody Warszawa",
    line1: "Często przy rozrządzie lub wycieku",
    line2: "Kontrola chłodzenia po montażu",
    metaTitle: "Wymiana pompy wody Warszawa",
    metaDescription:
      "Wymiana pompy wody Warszawa — wyciek, hałas, przegrzewanie. BESS MOTORS Włochy. Wycena przed pracą, zapis online.",
    serviceId: "timingBelt",
    icon: "Droplets",
  },
  {
    slug: "wymiana-uszczelki-pokrywy-zaworow-warszawa",
    title: "Wymiana uszczelki pokrywy zaworów Warszawa",
    line1: "Wyciek oleju na silniku",
    line2: "Czysty silnik, mniej zapachu spalenizny",
    metaTitle: "Wymiana uszczelki pokrywy zaworów Warszawa",
    metaDescription:
      "Wymiana uszczelki pokrywy zaworów Warszawa — usuwanie wycieków oleju. BESS MOTORS Włochy, Aleja Krakowska 48/52. Umów wizytę.",
    serviceId: "engine",
    icon: "Cog",
  },
  {
    slug: "wymiana-poduszki-silnika-warszawa",
    title: "Wymiana poduszki silnika Warszawa",
    line1: "Wibracje na biegu jałowym",
    line2: "Diagnostyka mocowań silnika",
    metaTitle: "Wymiana poduszki silnika Warszawa",
    metaDescription:
      "Wymiana poduszki silnika Warszawa — wibracje i stuki przy ruszaniu. BESS MOTORS Włochy. Wycena po oględzinach.",
    serviceId: "engine",
    icon: "Cog",
  },
  {
    slug: "wymiana-lozyska-kola-warszawa",
    title: "Wymiana łożyska koła Warszawa",
    line1: "Hużenie przy jeździe, luz na kole",
    line2: "Diagnostyka i wymiana piasty / łożyska",
    metaTitle: "Wymiana łożyska koła Warszawa",
    metaDescription:
      "Wymiana łożyska koła Warszawa — hałas i luz na kole. BESS MOTORS Włochy, Aleja Krakowska 48/52. Umów wizytę.",
    serviceId: "suspension",
    icon: "Circle",
  },
  {
    slug: "serwis-skrzyni-automatycznej-warszawa",
    title: "Serwis automatycznej skrzyni biegów Warszawa",
    line1: "ATF, filtr, diagnostyka automatu",
    line2: "Dobór oleju i procedury po VIN",
    metaTitle: "Serwis automatycznej skrzyni biegów Warszawa",
    metaDescription:
      "Serwis automatycznej skrzyni biegów Warszawa — olej ATF, filtr, diagnostyka. BESS MOTORS Włochy. Wycena indywidualna.",
    serviceId: "transmission",
    icon: "Settings2",
  },
  {
    slug: "wymiana-oleju-dsg-warszawa",
    title: "Wymiana oleju w skrzyni DSG Warszawa",
    line1: "Olej DSG według procedury",
    line2: "Filtr gdy przewidziany przez producenta",
    metaTitle: "Wymiana oleju DSG Warszawa",
    metaDescription:
      "Wymiana oleju DSG Warszawa — procedura, filtr, dobór oleju. BESS MOTORS Włochy, Aleja Krakowska 48/52. Umów wizytę.",
    serviceId: "transmission",
    icon: "Settings2",
  },
  {
    slug: "serwis-haldex-warszawa",
    title: "Serwis Haldex Warszawa",
    line1: "Napęd 4×4 — olej i filtr Haldex",
    line2: "Typowe dla VAG i wybranych modeli",
    metaTitle: "Serwis Haldex Warszawa",
    metaDescription:
      "Serwis Haldex Warszawa — wymiana oleju/filtrów układu Haldex. BESS MOTORS Włochy. Zapytaj o wycenę po modelu / VIN.",
    serviceId: "transmission",
    icon: "Settings2",
  },
  {
    slug: "mechanik-warszawa-okecie",
    title: "Mechanik samochodowy Warszawa Okęcie",
    line1: "Blisko lotniska — Aleja Krakowska 48/52",
    line2: "Ok. 5 min od Okęcia · parking przy serwisie",
    metaTitle: "Mechanik Warszawa Okęcie",
    metaDescription:
      "Mechanik Warszawa Okęcie — BESS MOTORS przy Alei Krakowskiej 48/52 (Włochy), ok. 5 min od Okęcia. Diagnostyka, olej, hamulce, opony. Umów wizytę.",
    serviceId: "diagnostic",
    icon: "Gauge",
  },
];

export const EXTRA_SEO_SERVICE_PROFILES_BATCH2: Record<string, SlugLandingProfile> = {
  "wulkanizacja-warszawa": {
    bookServiceId: "tires",
    contentServiceId: "tires",
    faqDuration: L("Wymiana kompletu 4 kół zwykle 45–90 minut — zależnie od rozmiaru i kolejki.", "Замена комплекта обычно 45–90 минут.", "A set of 4 usually takes 45–90 minutes — depending on size and queue.", "Заміна комплекта зазвичай 45–90 минут."),
    price: {
          fromZl: getPriceItem("tire_change_steel_15_17")?.basePrice ?? 160,
          priceFrom: true,
          materialsExtra: false,
          note: L("Orientacyjnie od ceny kompletu R15–R17 (felgi stalowe) według cennika. Większe rozmiary i aluminiowe — drożej. Szczegóły na /opony i /cennik.", "Ориентировочно от цены комплекта R15–R17 по прайсу.", "From the R15–R17 steel-wheel set price on the list. Larger sizes and alloys cost more. Details on /opony and /cennik.", "Ориентировочно от цены комплекта R15–R17 по прайсу."),
          includes: [
            L("Demontaż i montaż opon", "Демонтаж и монтаж", "Tyre removal and fitting", "Демонтаж і монтаж"),
            L("Wyważanie kół", "Балансировка", "Wheel balancing", "Балансування"),
            L("Kontrola ciśnienia", "Проверка давления", "Pressure check", "Проверка давления"),
            L("Wycena przed startem prac", "Смета до работ", "Quote before work starts", "Кошторис до работ"),
          ],
        },
    education: [
      {
        title: L("Wulkanizacja w Warszawie Włochy", "Шиномонтаж в Włochy", "Tyre fitting in Warsaw Włochy", "Шиномонтаж в Włochy"),
        body: L("W BESS MOTORS robimy sezonową wymianę opon, wyważanie i naprawy przebić. Warsztat przy Alei Krakowskiej 48/52 — łatwy dojazd z Okęcia i południowej Warszawy.", "Сезонная замена, балансировка и ремонт проколов. Aleja Krakowska 48/52.", "At BESS MOTORS we do seasonal tyre changes, balancing and puncture repairs. Workshop at Aleja Krakowska 48/52 — easy from Okęcie and southern Warsaw.", "Сезонная заміна, балансування і ремонт проколов. Aleja Krakowska 48/52."),
      },
      {
        title: L("Kiedy jechać na wulkanizację?", "Когда ехать", "When to book tyre fitting?", "Коли ехать"),
        body: L("Przed zmianą sezonu, po przebiciu, gdy czuć wibracje kierownicy albo opony zużywają się nierówno. Lepiej umówić termin niż stać w kolejce.", "Смена сезона, прокол, вибрации руля, неравномерный износ.", "Before the season change, after a puncture, when you feel steering vibration or uneven tyre wear. Booking beats waiting in a queue.", "Смена сезона, прокол, вибрации руля, неравномерный износ."),
      },
      {
        title: L("Jak wygląda obsługa", "Как проходит сервис", "How we handle your car", "Как проходит сервис"),
        body: L("Przyjmujemy auto, zdejmujemy koła, montujemy opony, wyważamy i ustawiamy ciśnienie. Przy przebiciu oceniamy, czy naprawa ma sens.", "Снимаем колёса, монтируем, балансируем, давление. При проколе оцениваем ремонт.", "We take the car in, remove the wheels, fit tyres, balance and set pressure. For punctures we check if repair is safe.", "Снимаем коліса, монтируем, балансируем, давление. При проколе оцениваем ремонт."),
      },
      {
        title: L("Czas i cena", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Komplet zwykle 45–90 min. Ceny według rozmiaru — od pozycji w cenniku wulkanizacji. Olej i inne usługi nie są w tej cenie.", "45–90 мин. Цены по размеру в прайсе.", "A full set usually 45–90 min. Prices by size — see the tyre price list. Oil and other jobs are not included.", "45–90 мин. Ціни по размеру в прайсе."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy trzeba umawiać wizytę?", "Нужна запись?", "Do I need an appointment?", "Потрібен запис?"),
        a: L("Tak — rezerwacja skraca oczekiwanie. Zadzwoń +48 791 257 229 lub umów online.", "Да — запись сокращает ожидание. Звоните +48 791 257 229 или онлайн.", "Yes — booking shortens waiting. Call +48 791 257 229 or book online.", "Так — запис скорочує очікування. Телефонуйте +48 791 257 229 або онлайн."),
      },
      {
        q: L("Czy wyważacie po każdej wymianie?", "Балансируете после замены?", "Do you balance after every change?", "Балансируете після заміни?"),
        a: L("Tak — wyważanie jest częścią kompleksowej wymiany opon.", "Да — балансировка входит в комплексную замену.", "Yes — balancing is part of a full tyre change.", "Так — балансування входит в комплексную заміну."),
      },
      {
        q: L("Macie przechowywanie opon?", "Есть хранение шин?", "Do you store tyres?", "Есть хранение шин?"),
        a: L("Tak — sezonowe przechowywanie; zapytaj przy rezerwacji.", "Да — сезонное хранение, уточните при записи.", "Yes — seasonal storage; ask when you book.", "Так — сезонное хранение, уточните при записи."),
      },
    ],
  },

  "wymiana-opon-warszawa": {
    bookServiceId: "tires",
    contentServiceId: "tires",
    faqDuration: L("Wymiana 4 opon z wyważaniem: zwykle 45–90 minut.", "Замена 4 шин: обычно 45–90 минут.", "Tyre change for 4 with balancing: usually 45–90 minutes.", "Заміна 4 шин: зазвичай 45–90 минут."),
    price: {
          fromZl: getPriceItem("tire_change_steel_15_17")?.basePrice ?? 160,
          priceFrom: true,
          materialsExtra: false,
          note: L("Cena za kompleksową wymianę kompletu zależy od rozmiaru i typu felg — szczegóły w cenniku i na stronie /opony.", "Цена комплекта зависит от размера и дисков — см. прайс и /opony.", "Full-set price depends on size and rim type — see the price list and /opony.", "Цена комплекта зависит от размера і дисков — см. прайс і /opony."),
          includes: [
            L("Wymiana opon na komplecie 4 kół", "Замена шин на 4 колёсах", "Tyre change on a set of 4", "Заміна шин на 4 колісах"),
            L("Wyważanie", "Балансировка", "Balancing", "Балансування"),
            L("Kontrola ciśnienia", "Проверка давления", "Pressure check", "Проверка давления"),
          ],
        },
    education: [
      {
        title: L("Wymiana opon z wyważaniem", "Замена шин с балансировкой", "Tyre change with balancing", "Заміна шин с балансировкой"),
        body: L("Sezonowa zmiana opon to nie tylko przełożenie gumy — ważne jest wyważenie i prawidłowe ciśnienie. W BESS MOTORS robimy to w jednym podejściu.", "Сезонная смена с балансировкой и давлением за один визит.", "Seasonal change is more than swapping rubber — balancing and correct pressure matter. We do it in one visit.", "Сезонная смена с балансировкой і давлением за один визит."),
      },
      {
        title: L("Kiedy wymieniać opony?", "Когда менять", "When to change tyres?", "Коли менять"),
        body: L("Gdy temperatura spada poniżej ok. 7°C (opony zimowe) lub wraca wiosna (letnie), albo gdy bieżnik jest na granicy zużycia / uszkodzony.", "По сезону или при износе/повреждении протектора.", "When temperatures drop below about 7°C (winter) or spring returns (summer), or when tread is worn or damaged.", "По сезону або при износе/повреждении протектора."),
      },
      {
        title: L("Objawy złego montażu lub zużycia", "Симптомы", "Symptoms of bad fit or wear", "Симптомы"),
        body: L("Wibracje, ściąganie, hałas z opony, szybkie zużycie barku — warto sprawdzić wyważenie i geometrię.", "Вибрации, увод, шум, износ плеча.", "Vibration, pulling, tyre noise, fast shoulder wear — check balancing and alignment.", "Вибрации, увод, шум, износ плеча."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and cost", "Срок і ціна"),
        body: L("Zwykle do 90 minut. Koszt według rozmiaru R — patrz cennik. Opony jako towar wyceniamy osobno, jeśli zamawiasz u nas.", "До 90 мин. Цена по размеру R в прайсе.", "Usually up to 90 minutes. Cost by R-size — see the price list.", "До 90 мин. Цена по размеру R в прайсе."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy mogę przywieźć własne opony?", "Можно свои шины?", "Can I bring my own tyres?", "Можна свои шины?"),
        a: L("Tak — montujemy Twoje opony lub komplet na felgach.", "Да — монтируем ваши шины.", "Yes — we fit your tyres or a set already on rims.", "Так — монтируем ваши шины."),
      },
      {
        q: L("Czy robicie RunFlat?", "Делаете RunFlat?", "Do you fit RunFlat?", "Делаете RunFlat?"),
        a: L("Tak — montaż RunFlat jest w cenniku; dopytaj przy zapisie.", "Да — монтаж RunFlat в прайсе.", "Yes — RunFlat fitting is on the price list; ask when booking.", "Так — монтаж RunFlat в прайсе."),
      },
      {
        q: L("Ile trwa wymiana?", "Сколько длится?", "How long does it take?", "Сколько длится?"),
        a: L("Orientacyjnie 45–90 minut na komplet, zależnie od rozmiaru.", "Ориентировочно 45–90 минут.", "About 45–90 minutes per set, depending on size.", "Ориентировочно 45–90 минут."),
      },
    ],
  },

  "wywazanie-kol-warszawa": {
    bookServiceId: "tires",
    contentServiceId: "tires",
    faqDuration: L("Wyważanie kompletu zwykle ok. 30–60 minut.", "Балансировка комплекта обычно 30–60 минут.", "Balancing a full set usually takes about 30–60 minutes.", "Балансування комплекта зазвичай 30–60 минут."),
    price: {
          fromZl: getPriceItem("wheel_balance")?.basePrice ?? 15,
          priceFrom: true,
          materialsExtra: false,
          note: L("Wyważanie 1 koła według cennika (cena „od”). Komplet = 4 koła.", "Балансировка 1 колеса по прайсу. Комплект = 4 колеса.", "Balancing per wheel from the price list. A set = 4 wheels.", "Балансування 1 коліса по прайсу. Комплект = 4 коліса."),
          includes: [
            L("Wyważanie na maszynie", "Балансировка на станке", "Machine balancing", "Балансування на станке"),
            L("Kontrola ciężarków", "Проверка грузиков", "Weight check", "Проверка грузиков"),
            L("Ocena stanu felgi i opony", "Оценка диска и шины", "Rim and tyre condition check", "Оценка диска і шины"),
          ],
        },
    education: [
      {
        title: L("Po co wyważać koła?", "Зачем балансировать", "Why balance wheels?", "Зачем балансировать"),
        body: L("Niewyważone koło daje wibracje na kierownicy lub fotelu, szybciej zużywa opony i obciąża zawieszenie. Wyważanie przywraca równomierny obrót.", "Убирает вибрации и снижает износ шин и подвески.", "An unbalanced wheel causes vibration, faster tyre wear and extra stress on suspension. Balancing restores smooth rotation.", "Убирает вибрации і снижает износ шин і підвіски."),
      },
      {
        title: L("Kiedy warto przyjechać?", "Когда ехать", "When to book?", "Коли ехать"),
        body: L("Po wymianie opon, po uderzeniu w dziurę, gdy czujesz drgania od pewnej prędkości albo po sezonowym przełożeniu kół bez wyważenia.", "После замены шин, ямы или появления вибраций.", "After a tyre change, after hitting a pothole, when you feel vibration above a certain speed, or after seasonal swap without balancing.", "Після заміни шин, ямы або появления вибраций."),
      },
      {
        title: L("Objawy", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Drgania kierownicy (przód) lub fotela (tył), nierówne zużycie bieżnika, hałas narastający z prędkością.", "Вибрации руля/сиденья, неравномерный износ.", "Steering shake (front) or seat vibration (rear), uneven tread wear, noise that grows with speed.", "Вибрации руля/сиденья, неравномерный износ."),
      },
      {
        title: L("Czas i cena", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Pojedyncze koło szybko; komplet zwykle do godziny. Cena od pozycji „wyważanie 1 koła” w cenniku.", "Комплект обычно до часа. Цена от позиции в прайсе.", "One wheel is quick; a full set usually within an hour. Price from the “balancing 1 wheel” item on the list.", "Комплект зазвичай до год. Цена от позиции в прайсе."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy wyważanie jest w cenie wymiany opon?", "Балансировка входит в замену?", "Is balancing included in a tyre change?", "Балансування входит в заміну?"),
        a: L("Przy kompleksowej wymianie opon — tak. Osobne wyważanie rozliczamy według cennika.", "При комплексной замене — да. Отдельно — по прайсу.", "Yes for a full tyre change. Standalone balancing is priced separately.", "При комплексной замене — да. Отдельно — по прайсу."),
      },
      {
        q: L("Czy geometria to to samo?", "Геометрия это то же?", "Is balancing the same as alignment?", "Геометрия это то же?"),
        a: L("Nie. Wyważanie dotyczy koła; geometria ustawia kąty zawieszenia. Przy ściąganiu auta często potrzeba obu.", "Нет — балансировка и развал-схождение разные услуги.", "No. Balancing is the wheel; alignment sets suspension angles.", "Ні — балансування і развал-схождение разные услуги."),
      },
      {
        q: L("Ile kół wyważać?", "Сколько колёс?", "How many wheels to balance?", "Сколько коліс?"),
        a: L("Zalecamy cały komplet — wibracje bywają z tyłu, nie tylko z przodu.", "Рекомендуем весь комплект.", "We recommend the full set — vibration can come from the rear too.", "Рекомендуем весь комплект."),
      },
    ],
  },

  "naprawa-opon-warszawa": {
    bookServiceId: "tires",
    contentServiceId: "tires",
    faqDuration: L("Naprawa przebicia zwykle ok. 30–60 minut — jeśli opona nadaje się do naprawy.", "Ремонт прокола обычно 30–60 минут.", "Puncture repair usually about 30–60 minutes if the tyre can be repaired safely.", "Ремонт прокола зазвичай 30–60 минут."),
    price: {
          fromZl: getPriceItem("puncture_repair")?.basePrice ?? 80,
          priceFrom: true,
          materialsExtra: false,
          note: L("Naprawa przebicia — cena „od” według cennika. Boczne uszkodzenia często wykluczają naprawę — wtedy proponujemy wymianę opony.", "Ремонт прокола — цена «от» по прайсу. Боковые повреждения часто не ремонтируются.", "Puncture repair from the price list. Sidewall damage often cannot be repaired — then we propose a new tyre.", "Ремонт прокола — ціна «от» по прайсу. Боковые повреждения часто не ремонтируются."),
          includes: [
            L("Demontaż koła i opony", "Демонтаж колеса и шины", "Wheel and tyre removal", "Демонтаж коліса і шины"),
            L("Naprawa przebicia (gdy możliwa)", "Ремонт прокола при возможности", "Puncture repair when possible", "Ремонт прокола при возможнасти"),
            L("Montaż i wyważanie", "Монтаж и балансировка", "Refit and balancing", "Монтаж і балансування"),
          ],
        },
    education: [
      {
        title: L("Naprawa przebitej opony", "Ремонт проколотой шины", "Puncture repair", "Ремонт проколотой шины"),
        body: L("Nie każde uszkodzenie da się bezpiecznie naprawić. Oceniamy miejsce przebicia (bieżnik vs bok) i decydujemy, czy wulkanizacja opony ma sens.", "Оцениваем место повреждения и безопасность ремонта.", "Not every damage can be repaired safely. We check the location (tread vs sidewall) and decide if repair makes sense.", "Оцениваем место повреждения і безопасность ремонта."),
      },
      {
        title: L("Kiedy jechać natychmiast?", "Когда ехать сразу", "When to come immediately?", "Коли ехать сразу"),
        body: L("Spadek ciśnienia, kontrolka TPMS, głośne syczenie, opona „na felgach”. Lepiej nie jechać daleko na uszkodzonej oponie.", "Падение давления, TPMS, шипение — не ехать далеко.", "Pressure loss, TPMS light, loud hissing, or driving on a flat — do not continue far on a damaged tyre.", "Падение давления, TPMS, шипение — не ехать далеко."),
      },
      {
        title: L("Jak wygląda naprawa", "Как проходит ремонт", "How repair works", "Как проходит ремонт"),
        body: L("Zdejmujemy koło, demontujemy oponę, naprawiamy przebicie, montujemy, wyważamy i ustawiamy ciśnienie.", "Снятие, ремонт, монтаж, балансировка, давление.", "We remove the wheel, demount the tyre, repair the puncture, remount, balance and set pressure.", "Снятие, ремонт, монтаж, балансування, давление."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and cost", "Срок і ціна"),
        body: L("Zwykle 30–60 min. Cena od pozycji naprawy przebicia w cenniku. Jeśli opona nie nadaje się do naprawy — mówimy wprost i proponujemy wymianę.", "30–60 мин. Цена от прайса; при невозможности ремонта предложим замену.", "Usually 30–60 min. Price from the puncture-repair item. If the tyre cannot be repaired, we say so and suggest replacement.", "30–60 мин. Цена от прайса; при невозможнасти ремонта предложим заміну."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy naprawiacie bok opony?", "Ремонтируете боковину?", "Do you repair sidewalls?", "Ремонтируете боковину?"),
        a: L("Bok opony rzadko kwalifikuje się do bezpiecznej naprawy. Oceniamy na miejscu — bezpieczeństwo jest pierwsze.", "Боковина редко ремонтируется безопасно — оценим на месте.", "Sidewalls rarely qualify for a safe repair. We assess on site — safety first.", "Боковина редко ремонтируется безопасно — оценим на месте."),
      },
      {
        q: L("Czy mogę jechać na kit naprawczy?", "Можно на герметике?", "Can I drive on sealant?", "Можна на герметике?"),
        a: L("Kit to rozwiązanie awaryjne. Potem warto zdjąć oponę i ocenić uszkodzenie w warsztacie.", "Герметик — временно; потом нужна оценка в сервисе.", "Sealant is an emergency fix. Afterwards the tyre should be inspected in the workshop.", "Герметик — временно; потом нужна оценка в сервисе."),
      },
      {
        q: L("Ile to kosztuje?", "Сколько стоит?", "How much does it cost?", "Сколько стоит?"),
        a: L("Orientacyjnie od ceny naprawy przebicia w cenniku. Potwierdzimy po oględzinach.", "От цены в прайсе — подтвердим после осмотра.", "From the puncture-repair price on the list. We confirm after inspection.", "От цены в прайсе — подтвердим після осмотра."),
      },
    ],
  },

  "wymiana-klockow-hamulcowych-warszawa": {
    bookServiceId: "brakePads",
    contentServiceId: "brakePads",
    faqDuration: L("Wymiana klocków zwykle 1–2 godziny na oś.", "Замена колодок обычно 1–2 часа на ось.", "Replacement usually 1–2 hours", "Заміна колодок зазвичай 1–2 год на ось."),
    price: {
          fromZl: 100,
          compareAtZl: 120,
          priceFrom: true,
          materialsExtra: true,
          note: L("Robocizna klocków przód od 100 zł (kod BessMotors). Części osobno po akceptacji. Tarcze oceniamy przed montażem.", "Работа передних колодок от 100 zł (код BessMotors). Детали отдельно.", "Labour days 100 zł ( BessMotors). parts", "Робота передних колодок от 100 zł (код BessMotors). Детали отдельно."),
          includes: [
            L("Pomiar grubości klocków i tarcz", "Замер колодок и дисков", "And", "Замер колодок і дисков"),
            L("Wymiana klocków według wyceny", "Замена колодок по смете", "Replacement quote", "Заміна колодок по смете"),
            L("Kontrola przewodów i płynu", "Проверка трубок и жидкости", "And", "Проверка трубок і жидкости"),
          ],
        },
    education: [
      {
        title: L("Wymiana klocków w BESS MOTORS", "Замена колодок", "Replacement", "Заміна колодок"),
        body: L("Wymieniamy klocki przód i tył. Przed startem mierzymy tarcze — jeśli są w normie, nie dokładamy niepotrzebnej wymiany.", "Меняем колодки; диски меряем до решения о замене.", "; replacement", "Меняем колодки; диски меряем до решения о замене."),
      },
      {
        title: L("Kiedy wymieniać klocki?", "Когда менять", "When", "Коли менять"),
        body: L("Pisk, metaliczny dźwięk, dłuższa droga hamowania, kontrolka zużycia albo cienka okładzina przy przeglądzie.", "Скрип, металлический звук, увеличенный путь торможения.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Скрип, металлический звук, увеличенный путь торможения."),
      },
      {
        title: L("Objawy", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Piszczenie, auto ściąga przy hamowaniu, wibracje na pedale (często tarcze), spadek skuteczności.", "Скрип, увод, вибрации педали, слабые тормоза.", "Brake", "Скрип, увод, вибрации педали, слабые гальма."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("1–2 h na oś. Robocizna od 100 zł + klocki. Potwierdzamy zakres przed montażem.", "1–2 ч на ось. Работа от 100 zł + колодки.", "1–2 . labour 100 zł +", "1–2 ч на ось. Робота от 100 zł + колодки."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy zawsze z tarczami?", "Всегда с дисками?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Всегда с дисками?"),
        a: L("Nie. Jeśli tarcze mają zapas grubości i nie biją — wymieniamy same klocki.", "Нет — если диски в норме, меняем только колодки.", "No — if", "Ні — якщо диски в норме, міняємо только колодки."),
      },
      {
        q: L("Przód i tył naraz?", "Перед и зад сразу?", "Before and ?", "Перед і зад сразу?"),
        a: L("Często zużywają się różnie. Oceniamy obie osie i proponujemy sensowny zakres.", "Оцениваем обе оси и предлагаем объём.", "And", "Оцениваем обе оси і пропонуємо объём."),
      },
      {
        q: L("Jak umówić?", "Как записаться?", "How booking?", "Как записаться?"),
        a: L("Online, telefon +48 791 257 229 albo WhatsApp.", "Онлайн, телефон +48 791 257 229 или WhatsApp.", "+48 791 257 229 or WhatsApp", "Онлайн, телефон +48 791 257 229 або WhatsApp."),
      },
    ],
  },

  "wymiana-tarcz-hamulcowych-warszawa": {
    bookServiceId: "brakePads",
    contentServiceId: "brakePads",
    faqDuration: L("Wymiana tarcz z klockami zwykle 1,5–3 godziny na oś.", "Замена дисков с колодками обычно 1,5–3 часа на ось.", "Replacement usually 1,5–3 hours", "Заміна дисков с колодками зазвичай 1,5–3 год на ось."),
    price: {
          fromZl: getPriceItem("brake_disc_front")?.basePrice ?? 220,
          priceFrom: true,
          materialsExtra: true,
          note: L("Orientacyjna robocizna tarcz + klocków przód według cennika. Części osobno. Tył wyceniamy osobno.", "Ориентировочная работа передних дисков+колодок по прайсу. Детали отдельно.", "Labour days + price list. parts", "Ориентировочная робота передних дисков+колодок по прайсу. Детали отдельно."),
          includes: [
            L("Pomiar grubości i bicia tarcz", "Замер толщины и биения", "And", "Замер толщины і биения"),
            L("Wymiana tarcz i klocków według wyceny", "Замена дисков и колодок", "Replacement and", "Заміна дисков і колодок"),
            L("Kontrola układu po montażu", "Проверка системы после монтажа", "After", "Проверка системы після монтажа"),
          ],
        },
    education: [
      {
        title: L("Kiedy wymieniać tarcze?", "Когда менять диски", "When", "Коли менять диски"),
        body: L("Gdy grubość jest poniżej minimum, jest rowkowanie, pęknięcia albo bicie (pulsowanie pedału). Często wymieniamy razem z klockami.", "Толщина ниже минимума, биение, трещины — часто вместе с колодками.", "Min, , — hours", "Толщина ниже минимума, биение, трещины — часто вместе с колодками."),
      },
      {
        title: L("Objawy zużytych tarcz", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Pulsowanie kierownicy lub pedału przy hamowaniu, drgania, spadek skuteczności, widoczne rowki.", "Пульсация педали/руля, вибрации, канавки.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Пульсация педали/руля, вибрации, канавки."),
      },
      {
        title: L("Jak pracujemy", "Как работаем", "How we work", "Как роботаем"),
        body: L("Mierzymy tarcze, pokazujemy stan, dobieramy części po VIN i wymieniamy po akceptacji wyceny.", "Замер, смета, детали по VIN, замена после согласия.", "Quote, parts by VIN, replacement after", "Замер, кошторис, детали по VIN, заміна після согласия."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Zwykle 1,5–3 h na oś. Robocizna według cennika + części. Nie dokładamy tarcz „na zapas”, jeśli nie trzeba.", "1,5–3 ч на ось. Работа по прайсу + детали.", "1,5–3 . labour price list + parts", "1,5–3 ч на ось. Робота по прайсу + детали."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy tarcze zawsze z klockami?", "Диски всегда с колодками?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Диски всегда с колодками?"),
        a: L("Przy wymianie tarcz praktycznie zawsze zakładamy nowe klocki — stare mogą uszkodzić nowe tarcze.", "Да, почти всегда новые колодки вместе с дисками.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Да, почти всегда новые колодки вместе с дисками."),
      },
      {
        q: L("Przód droższy niż tył?", "Перед дороже зада?", "Before ?", "Перед дороже зада?"),
        a: L("Często tak — większe obciążenie i większe elementy. Wyceniamy oś po oględzinach.", "Часто да — оценим ось после осмотра.", "Hours — after", "Часто да — оценим ось після осмотра."),
      },
      {
        q: L("Czy odpowietrzacie hamulce?", "Прокачиваете тормоза?", "Brake?", "Прокачиваете гальма?"),
        a: L("Gdy otwieramy układ lub wymieniamy płyn — tak. Przy samej wymianie tarcz/klocków zwykle nie trzeba.", "При вскрытии контура или замене жидкости — да.", "Or replacement —", "При вскрытии контура або замене жидкости — да."),
      },
    ],
  },

  "wymiana-plynu-hamulcowego-warszawa": {
    bookServiceId: "brakesFull",
    contentServiceId: "brakePads",
    faqDuration: L("Wymiana płynu hamulcowego zwykle ok. 1 godziny.", "Замена тормозной жидкости обычно около 1 часа.", "Replacement brake usually 1 hours", "Заміна гальмівной жидкости зазвичай около 1 год."),
    price: {
          fromZl: getPriceItem("brake_fluid")?.basePrice ?? 150,
          priceFrom: true,
          materialsExtra: true,
          note: L("Wymiana płynu hamulcowego według cennika. Rodzaj płynu (DOT) dobieramy do modelu.", "Замена тормозной жидкости по прайсу. Тип DOT — по модели.", "Replacement brake price list. DOT —", "Заміна гальмівной жидкости по прайсу. Тип DOT — по модели."),
          includes: [
            L("Spust starego płynu", "Слив старой жидкости", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Слив старой жидкости"),
            L("Napełnienie właściwym DOT", "Заливка нужного DOT", "You need DOT", "Заливка потрібного DOT"),
            L("Odpowietrzenie układu", "Прокачка системы", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Прокачка системы"),
          ],
        },
    education: [
      {
        title: L("Po co wymieniać płyn hamulcowy?", "Зачем менять жидкость", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Зачем менять жидкость"),
        body: L("Płyn pochłania wilgoć — spada temperatura wrzenia i pedał może stać się „gumowy”. Wymiana przywraca pewne hamowanie.", "Жидкость набирает влагу — падает температура кипения.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Жидкость набирает влагу — падает температура кипения."),
      },
      {
        title: L("Kiedy wymieniać?", "Когда менять", "When", "Коли менять"),
        body: L("Według zaleceń producenta (często co 2 lata) albo gdy płyn jest ciemny / test pokazuje wysoką wilgotność.", "По регламенту или при тёмной/влажной жидкости.", "Or /", "По регламенту або при тёмной/влажной жидкости."),
      },
      {
        title: L("Objawy", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Miękki pedał, dłuższa droga hamowania po mocnym hamowaniu, kontrolka poziomu płynu.", "Мягкая педаль, длинный путь торможения, лампа уровня.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Мягкая педаль, длинный путь торможения, лампа уровня."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Ok. 1 h. Cena według cennika + płyn. Przy okazji sprawdzamy klocki i tarcze.", "Около 1 ч. Цена по прайсу + жидкость.", "1 . price list +", "Около 1 ч. Цена по прайсу + жидкость."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Jaki DOT wlewacie?", "Какой DOT?", "DOT?", "Какой DOT?"),
        a: L("Taki, jaki przewiduje producent Twojego auta — sprawdzamy po modelu / VIN.", "По рекомендации производителя / VIN.", "/ VIN", "По рекомендации производителя / VIN."),
      },
      {
        q: L("Czy to to samo co odpowietrzanie?", "Это прокачка?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Це прокачка?"),
        a: L("Wymiana obejmuje spust i odpowietrzenie. Samo odpowietrzanie po naprawie bywa osobną pozycją.", "Замена включает прокачку; отдельно после ремонта может быть другая позиция.", "Replacement ; after", "Заміна включает прокачку; отдельно після ремонта может быть другая позиция."),
      },
      {
        q: L("Czy mogę jeździć ze starym płynem?", "Можно ездить со старой?", "You can ?", "Можна ездить со старой?"),
        a: L("Krótko tak, ale ryzyko spadku skuteczności rośnie — lepiej nie odkładać.", "Кратко да, но риск падения эффективности растёт.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Кратко да, но риск падения эффективности растёт."),
      },
    ],
  },

  "wymiana-amortyzatorow-warszawa": {
    bookServiceId: "suspension",
    contentServiceId: "suspension",
    faqDuration: L("Wymiana amortyzatorów zwykle pół dnia–1 dzień — zależnie od osi i modelu.", "Замена амортизаторов обычно от полдня до дня.", "Replacement usually days days", "Заміна амортизаторов зазвичай от полдня до дня."),
    price: {
          fromZl: getPriceItem("shock_replace")?.basePrice ?? 250,
          priceFrom: true,
          materialsExtra: true,
          note: L("Robocizna za amortyzator według cennika (cena „od”). Części osobno. Często wymieniamy parami na osi.", "Работа за амортизатор по прайсу. Детали отдельно. Часто парой на оси.", "Labour price list. parts . hours", "Робота за амортизатор по прайсу. Детали отдельно. Часто парой на оси."),
          includes: [
            L("Diagnostyka zawieszenia", "Диагностика подвески", "Diagnostics suspension", "Діагностика підвіски"),
            L("Wymiana amortyzatorów według wyceny", "Замена амортизаторов по смете", "Replacement quote", "Заміна амортизаторов по смете"),
            L("Kontrola sprężyn i poduszek", "Проверка пружин и опор", "And", "Проверка пружин і опор"),
          ],
        },
    education: [
      {
        title: L("Kiedy wymieniać amortyzatory?", "Когда менять амортизаторы", "When", "Коли менять амортизаторы"),
        body: L("Auto kołysze się na falach, dłużej dobija na dziurach, wyciek oleju z amortyzatora albo nierówne zużycie opon.", "Раскачка, долгий отбой, течь, неравномерный износ шин.", "Tyres", "Раскачка, долгий отбой, теча, неравномерный износ шин."),
      },
      {
        title: L("Objawy", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Pływanie na autostradzie, stuki z nadkola, „klepanie” na progach, gorsza przyczepność na mokrym.", "Плавание на трассе, стуки в арке, хуже сцепление.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Плавание на трассе, стуки в арке, хуже сцепление."),
      },
      {
        title: L("Jak wygląda wymiana", "Как проходит замена", "How replacement works", "Как проходит заміна"),
        body: L("Diagnozujemy na podnośniku, wyceniamy oś/komplet, wymieniamy po akceptacji i sprawdzamy stan sprężyn oraz łożysk górnych.", "Диагностика, смета, замена после согласия, проверка пружин и опор.", "Diagnostics, quote, replacement after , and", "Діагностика, кошторис, заміна після согласия, проверка пружин і опор."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Zależnie od napędu i rdzy — często kilka godzin. Robocizna od pozycji w cenniku + amortyzatory.", "Часто несколько часов. Работа по прайсу + детали.", "Hours several hours. labour price list + parts", "Часто кілька годин. Робота по прайсу + детали."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy wymieniać parami?", "Менять парой?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Менять парой?"),
        a: L("Tak — na tej samej osi zalecamy parę, żeby zachowanie auta było równe.", "Да — на одной оси рекомендуем пару.", "Yes — days", "Так — на одной оси рекомендуємо пару."),
      },
      {
        q: L("Czy po wymianie robicie geometrię?", "Делаете геометрию?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Делаете геометрию?"),
        a: L("Po niektórych konstrukcjach zalecamy geometrię. Możesz umówić ją u nas osobno.", "После некоторых конструкций рекомендуем геометрию.", "After", "Після некоторых конструкций рекомендуємо геометрию."),
      },
      {
        q: L("Ile kosztują części?", "Сколько детали?", "Parts?", "Сколько детали?"),
        a: L("Dobieramy po VIN i podajemy w wycenie przed montażem — bez niespodzianek.", "Подбор по VIN и сумма в смете до монтажа.", "By VIN and quote", "Подбор по VIN і сумма в смете до монтажа."),
      },
    ],
  },

  "wymiana-wahaczy-warszawa": {
    bookServiceId: "suspension",
    contentServiceId: "suspension",
    faqDuration: L("Wymiana wahacza zwykle kilka godzin — zależnie od strony i dostępu.", "Замена рычага обычно несколько часов.", "Replacement usually several hours", "Заміна рычага зазвичай кілька годин."),
    price: {
          fromZl: getPriceItem("arm_replace")?.basePrice ?? 250,
          priceFrom: true,
          materialsExtra: true,
          note: L("Robocizna wymiany wahacza według cennika. Po wymianie często zalecana geometria kół.", "Работа по замене рычага по прайсу. После часто нужна геометрия.", "Labour replacement price list. after hours", "Робота по замене рычага по прайсу. Після часто нужна геометрия."),
          includes: [
            L("Diagnostyka luzów", "Диагностика люфтов", "Diagnostics", "Діагностика люфтов"),
            L("Wymiana wahacza według wyceny", "Замена рычага по смете", "Replacement quote", "Заміна рычага по смете"),
            L("Kontrola sworzni i tulei", "Проверка шаровых и сайлентблоков", "And", "Проверка шаровых і сайлентблоков"),
          ],
        },
    education: [
      {
        title: L("Kiedy wymieniać wahacz?", "Когда менять рычаг", "When", "Коли менять рычаг"),
        body: L("Stuki z przodu, luzy na sworzniu/tulejach, ściąganie, nierówne zużycie opon po stronie.", "Стуки спереди, люфты, увод, износ шины с одной стороны.", "Before, , , tyres days", "Стуки спереди, люфты, увод, износ шины с одной стороны."),
      },
      {
        title: L("Objawy", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Pukanie na nierównościach, niepewna kierownica, gumy silentbloków popękane lub wyrobione.", "Стуки на кочках, неточный руль, износ сайлентблоков.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Стуки на кочках, неточный руль, износ сайлентблоков."),
      },
      {
        title: L("Naprawa w BESS MOTORS", "Ремонт в BESS MOTORS", "BESS MOTORS", "Ремонт в BESS MOTORS"),
        body: L("Sprawdzamy zawieszenie na podnośniku, wskazujemy zużyte elementy i wymieniamy po akceptacji. Części OEM/OES lub jakości premium.", "Проверка на подъёмнике, смета, замена после согласия.", "Quote, replacement after", "Проверка на подъёмнике, кошторис, заміна після согласия."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Kilka godzin typowo. Robocizna od pozycji wahacza w cenniku + część. Geometria — osobno gdy potrzebna.", "Обычно несколько часов. Работа по прайсу + деталь.", "Usually several hours. labour price list + parts", "Зазвичай кілька годин. Робота по прайсу + деталь."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy zawsze cała oś?", "Всегда вся ось?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Всегда вся ось?"),
        a: L("Nie zawsze. Czasem wystarczy jeden wahacz — decyzja po diagnostyce.", "Не всегда — решаем после диагностики.", "— after diagnostics", "Не всегда — решаем після діагностики."),
      },
      {
        q: L("Czy geometria jest w cenie?", "Геометрия в цене?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Геометрия в цене?"),
        a: L("Nie — geometria to osobna usługa. Zalecamy ją po wymianie elementów wpływających na kąty.", "Нет — отдельная услуга, рекомендуем после рычагов.", "No — , after", "Ні — отдельная услуга, рекомендуємо після рычагов."),
      },
      {
        q: L("Lewy czy prawy?", "Левый или правый?", "Or ?", "Левый або правый?"),
        a: L("Ustalamy stronę na diagnostyce — nie zgadujemy „na zapas”.", "Сторону определяем на диагностике.", "Diagnostics", "Сторону определяем на диагностике."),
      },
    ],
  },

  "naprawa-ukladu-kierowniczego-warszawa": {
    bookServiceId: "suspension",
    contentServiceId: "suspension",
    faqDuration: L("Diagnostyka układu kierowniczego zwykle 30–60 min. Naprawa — zależnie od zakresu.", "Диагностика обычно 30–60 мин.", "Diagnostics usually 30–60 min", "Діагностика зазвичай 30–60 мин."),
    price: {
          fromZl: getPriceItem("tie_rod")?.basePrice ?? 200,
          priceFrom: true,
          materialsExtra: true,
          note: L("Orientacyjnie od wymiany końcówki drążka w cenniku. Maglownica i szerszy zakres — wycena indywidualna.", "Ориентировочно от замены наконечника в прайсе. Рейка — индивидуальная смета.", "Replacement price list. — quote", "Ориентировочно от заміни наконечника в прайсе. Рейка — индивидуальная кошторис."),
          includes: [
            L("Diagnostyka luzów kierownicy", "Диагностика люфтов руля", "Diagnostics", "Діагностика люфтов руля"),
            L("Ocena maglownicy i drążków", "Оценка рейки и тяг", "And", "Оценка рейки і тяг"),
            L("Wycena przed naprawą", "Смета до ремонта", "Quote", "Кошторис до ремонта"),
          ],
        },
    education: [
      {
        title: L("Co obejmuje układ kierowniczy?", "Что входит", "What", "Що входит"),
        body: L("Maglownica (przekładnia), drążki, końcówki, czasem pompa wspomagania. Zaczynamy od diagnostyki luzów i wycieków.", "Рейка, тяги, наконечники, иногда ГУР — с диагностики.", "— diagnostics", "Рейка, тяги, наконечники, иногда ГУР — с діагностики."),
      },
      {
        title: L("Kiedy jechać?", "Когда ехать", "When to come", "Коли ехать"),
        body: L("Luźna kierownica, stuki przy skręcie, ściąganie, wyciek płynu wspomagania, nierówne zużycie opon.", "Люфт руля, стуки при повороте, увод, течь ГУР.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Люфт руля, стуки при повороте, увод, теча ГУР."),
      },
      {
        title: L("Jak naprawiamy", "Как ремонтируем", "How", "Как ремонтируем"),
        body: L("Diagnozujemy, wskazujemy zużyty element, wyceniamy i wymieniamy po akceptacji. Po drążkach/końcówkach zalecamy geometrię.", "Диагностика, смета, замена; после тяг — геометрия.", "Diagnostics, quote, replacement; after —", "Діагностика, кошторис, заміна; після тяг — геометрия."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Drobne elementy — często tego samego dnia. Maglownica dłużej. Ceny od pozycji w cenniku lub wycena indywidualna.", "Мелкое — часто в тот же день. Рейка дольше.", "— hours", "Мелкое — часто в тот же день. Рейка дольше."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy to zawsze maglownica?", "Всегда рейка?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Всегда рейка?"),
        a: L("Nie. Często winne są końcówki lub drążki — tańsza naprawa. Maglownicę proponujemy dopiero po potwierdzeniu.", "Нет — часто наконечники/тяги; рейку предлагаем после подтверждения.", "No — hours /; after", "Ні — часто наконечники/тяги; рейку пропонуємо після подтверждения."),
      },
      {
        q: L("Czy macie geometrię?", "Есть геометрия?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Есть геометрия?"),
        a: L("Tak — możesz umówić geometrię po naprawie kierownicy lub zawieszenia.", "Да — можно записать на геометрию после ремонта.", "Yes — you can booking after", "Так — можна записать на геометрию після ремонта."),
      },
      {
        q: L("Jak umówić diagnostykę?", "Как записаться?", "How booking?", "Как записаться?"),
        a: L("Telefon +48 791 257 229 lub zapis online.", "Телефон +48 791 257 229 или онлайн.", "+48 791 257 229 or", "Телефон +48 791 257 229 або онлайн."),
      },
    ],
  },

  "wymiana-przekladni-kierowniczej-warszawa": {
    bookServiceId: "suspension",
    contentServiceId: "suspension",
    faqDuration: L("Wymiana maglownicy zwykle 1–2 dni — zależnie od modelu i dostępności części.", "Замена рейки обычно 1–2 дня.", "Replacement usually 1–2 days", "Заміна рейки зазвичай 1–2 дня."),
    price: {
          fromZl: getPriceItem("steering_rack")?.basePrice ?? 800,
          priceFrom: true,
          materialsExtra: true,
          note: L("Naprawa/wymiana maglownicy — cena „od” według cennika. Dokładna wycena po diagnostyce i doborze części.", "Ремонт/замена рейки — цена «от» по прайсу. Точная смета после диагностики.", "/replacement — «» price list. quote after diagnostics", "Ремонт/заміна рейки — ціна «от» по прайсу. Точная кошторис після діагностики."),
          includes: [
            L("Diagnostyka przekładni kierowniczej", "Диагностика рулевой рейки", "Diagnostics", "Діагностика рулевой рейки"),
            L("Wymiana / naprawa według wyceny", "Замена / ремонт по смете", "Replacement / quote", "Заміна / ремонт по смете"),
            L("Kontrola po montażu", "Проверка после монтажа", "After", "Проверка після монтажа"),
          ],
        },
    education: [
      {
        title: L("Kiedy wymieniać maglownicę?", "Когда менять рейку", "When", "Коли менять рейку"),
        body: L("Duży luz, stuki przy skręcie, wyciek z przekładni, „pływanie” auta mimo sprawnych końcówek.", "Большой люфт, стуки, течь, плавание при исправных наконечниках.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Большой люфт, стуки, теча, плавание при исправных наконечниках."),
      },
      {
        title: L("Objawy", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Kierownica pracuje nierówno, hałas przy manewrach, ślady płynu pod autem z przodu, opór wspomagania.", "Неровный руль, шум, следы жидкости, тугой ГУР.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Неровный руль, шум, следы жидкости, тугой ГУР."),
      },
      {
        title: L("Zakres usługi", "Объём", "Scope", "Объём"),
        body: L("Potwierdzamy usterkę, wyceniamy regenerację lub wymianę, montujemy i zalecamy geometrię po pracach.", "Подтверждение, смета, монтаж, геометрия после работ.", "Quote, , after labour", "Подтверждение, кошторис, монтаж, геометрия після работ."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Często 1–2 dni. Koszt: robocizna od pozycji maglownicy w cenniku + część. Potwierdzamy przed demontażem.", "Часто 1–2 дня. Работа по прайсу + деталь.", "Hours 1–2 days. labour price list + parts", "Часто 1–2 дня. Робота по прайсу + деталь."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Regeneracja czy nowa?", "Восстановление или новая?", "Or ?", "Восстановление або новая?"),
        a: L("Zależy od stanu i dostępności. Przedstawiamy opcje w wycenie — decyzja należy do Ciebie.", "Зависит от состояния — варианты в смете.", "— quote", "Зависит от состояния — варианты в смете."),
      },
      {
        q: L("Czy geometria jest konieczna?", "Геометрия обязательна?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Геометрия обязательна?"),
        a: L("Po maglownicy prawie zawsze tak — kąty trzeba ustawić od nowa.", "После рейки почти всегда нужна.", "After", "Після рейки почти всегда нужна."),
      },
      {
        q: L("Czy auto zostaje na noc?", "Авто остаётся на ночь?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Авто остаётся на ночь?"),
        a: L("Przy większym zakresie często tak. Informujemy przy przyjęciu.", "При большом объёме часто да — скажем при приёмке.", "Hours —", "При большом объёме часто да — скажем при приёмке."),
      },
    ],
  },

  "wymiana-drazkow-kierowniczych-warszawa": {
    bookServiceId: "suspension",
    contentServiceId: "suspension",
    faqDuration: L("Wymiana końcówek/drążków zwykle 1–3 godziny + geometria osobno.", "Замена наконечников/тяг обычно 1–3 часа.", "Replacement / usually 1–3 hours", "Заміна наконечников/тяг зазвичай 1–3 год."),
    price: {
          fromZl: getPriceItem("tie_rod")?.basePrice ?? 200,
          priceFrom: true,
          materialsExtra: true,
          note: L("Wymiana końcówki drążka kierowniczego według cennika. Po wymianie zalecamy geometrię.", "Замена наконечника по прайсу. После рекомендуем геометрию.", "Replacement price list. after", "Заміна наконечника по прайсу. Після рекомендуємо геометрию."),
          includes: [
            L("Diagnostyka luzów na końcówkach", "Диагностика люфтов наконечников", "Diagnostics", "Діагностика люфтов наконечников"),
            L("Wymiana według wyceny", "Замена по смете", "Replacement quote", "Заміна по смете"),
            L("Zalecenie geometrii po montażu", "Рекомендация геометрии", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Рекомендация геометрии"),
          ],
        },
    education: [
      {
        title: L("Końcówka czy drążek?", "Наконечник или тяга", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Наконечник або тяга"),
        body: L("Końcówka łączy się z zwrotnicą; drążek idzie do maglownicy. Diagnozujemy, który element ma luz — nie wymieniamy „na ślepo”.", "Диагностируем, где люфт — не меняем вслепую.", "Diagnostics, —", "Диагностируем, где люфт — не міняємо вслепую."),
      },
      {
        title: L("Kiedy wymieniać?", "Когда менять", "When", "Коли менять"),
        body: L("Stuki przy skręcie na miejscu, luźna kierownica, nierówne zużycie barku opony, ściąganie.", "Стуки при повороте, люфт, износ плеча шины, увод.", "Tyres", "Стуки при повороте, люфт, износ плеча шины, увод."),
      },
      {
        title: L("Jak wygląda wizyta", "Как проходит визит", "How the visit works", "Как проходит визит"),
        body: L("Kontrola na podnośniku, wycena, wymiana, jazda próbna. Geometrię umawiamy osobno lub od razu po montażu.", "Проверка, смета, замена, тест. Геометрия отдельно или сразу.", "Quote, replacement, . or", "Проверка, кошторис, заміна, тест. Геометрия отдельно або сразу."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Często 1–3 h. Robocizna od pozycji w cenniku + części. Geometria — osobna usługa.", "Часто 1–3 ч. Работа по прайсу + детали.", "Hours 1–3 . labour price list + parts", "Часто 1–3 ч. Робота по прайсу + детали."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy obie strony naraz?", "Обе стороны сразу?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Обе стороны сразу?"),
        a: L("Jeśli zużycie jest obustronne — tak. Decydujemy po diagnostyce.", "Если износ с двух сторон — да, после диагностики.", "If — , after diagnostics", "Якщо износ с двух сторон — да, після діагностики."),
      },
      {
        q: L("Czy mogę odłożyć geometrię?", "Можно отложить геометрию?", "You can ?", "Можна отложить геометрию?"),
        a: L("Lepiej nie — bez geometrii opony i kierunek jazdy mogą ucierpieć.", "Лучше не откладывать — страдают шины и курс.", "— tyres and", "Лучше не откладывать — страдают шины і курс."),
      },
      {
        q: L("Czy to wpływa na przegląd?", "Влияет на техосмотр?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Влияет на техосмотр?"),
        a: L("Duże luzy w układzie kierowniczym mogą skutkować negatywnym wynikiem — warto naprawić wcześniej.", "Большие люфты могут дать отказ на осмотре.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Большие люфты могут дать отказ на осмотре."),
      },
    ],
  },

  "wymiana-filtrow-warszawa": {
    bookServiceId: "filters",
    contentServiceId: "filters",
    faqDuration: L("Wymiana filtrów zwykle 30–60 minut — zależnie od liczby filtrów.", "Замена фильтров обычно 30–60 минут.", "Replacement filter usually 30–60 min", "Заміна фільтров зазвичай 30–60 минут."),
    price: {
          fromZl: getPriceItem("air_filter")?.basePrice ?? 30,
          priceFrom: true,
          materialsExtra: true,
          note: L("Orientacyjnie od wymiany filtra powietrza w cenniku. Kabinowy, paliwa i olejowy — według osobnych pozycji. Filtry jako części osobno.", "Ориентировочно от воздушного фильтра в прайсе. Остальные — отдельные позиции.", "Filter price list. —", "Ориентировочно от воздушного фільтра в прайсе. Остальные — отдельные позиции."),
          includes: [
            L("Dobór filtrów po VIN", "Подбор фильтров по VIN", "Filter by VIN", "Подбор фільтров по VIN"),
            L("Wymiana uzgodnionych filtrów", "Замена согласованных фильтров", "Replacement filter", "Заміна согласованных фільтров"),
            L("Kontrola stanu po montażu", "Проверка после монтажа", "After", "Проверка після монтажа"),
          ],
        },
    education: [
      {
        title: L("Jakie filtry wymieniamy?", "Какие фильтры", "Filter", "Какие фільтры"),
        body: L("Powietrza, kabinowy (pyłkowy), paliwa i filtr oleju (często z wymianą oleju). Zakres wybierasz przy zapisie.", "Воздушный, салонный, топливный, масляный.", "Oil", "Воздушный, салонный, топливный, масляный."),
      },
      {
        title: L("Kiedy wymieniać?", "Когда менять", "When", "Коли менять"),
        body: L("Według interwału, przy spadku dynamiki, zapachu w kabinie, ostrzeżeniach serwisowych albo po zakupie auta.", "По регламенту, запах в салоне, потеря динамики, после покупки.", "After", "По регламенту, запах в салоне, потеря динамики, після покупки."),
      },
      {
        title: L("Objawy brudnych filtrów", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Słabsze przyspieszenie, wyższe spalanie, parujące szyby, nieprzyjemny zapach z nawiewu.", "Слабый разгон, расход, запотевание, запах из климатa.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Слабый разгон, расход, запотевание, запах из климатa."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Często do godziny. Robocizna od najniższej pozycji filtrów w cenniku; dokładna suma zależy od wybranych filtrów.", "Часто до часа. Итог зависит от выбранных фильтров.", "Hours hours. filter", "Часто до год. Итог зависит от выбранных фільтров."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy filtr oleju z olejem?", "Масляный с маслом?", "Oil oil?", "Масляный с оливам?"),
        a: L("Tak — filtr oleju wymieniamy przy wymianie oleju (osobna usługa / pakiet).", "Да — масляный фильтр при замене масла.", "Yes — oil filter replacement oil", "Так — масляный фільтр при замене оливи."),
      },
      {
        q: L("Czy dobieracie po VIN?", "Подбор по VIN?", "By VIN?", "Подбор по VIN?"),
        a: L("Tak — żeby uniknąć „uniwersalnych” zamienników niepasujących do auta.", "Да — без универсальных неподходящих аналогов.", "Yes —", "Так — без универсальных неподходящих аналогов."),
      },
      {
        q: L("Czy filtr kabinowy z węglem?", "Салонный угольный?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Салонный угольный?"),
        a: L("Jeśli tak przewiduje auto lub chcesz lepszą filtrację zapachów — dobierzemy. Potwierdzimy w wycenie.", "Если нужно — подберём, подтвердим в смете.", "If you need — , quote", "Якщо потрібно — подберём, подтвердим в смете."),
      },
    ],
  },

  "wymiana-plynu-chlodniczego-warszawa": {
    bookServiceId: "otherReason",
    contentServiceId: "otherReason",
    faqDuration: L("Wymiana płynu chłodniczego zwykle ok. 1–2 godzin.", "Замена ОЖ обычно 1–2 часа.", "Replacement usually 1–2 hours", "Заміна ОЖ зазвичай 1–2 год."),
    price: {
          fromZl: getPriceItem("coolant")?.basePrice ?? 150,
          priceFrom: true,
          materialsExtra: true,
          note: L("Wymiana płynu chłodzącego według cennika. Specyfikacja płynu (G12/G13 itd.) dobierana do modelu.", "Замена ОЖ по прайсу. Спецификация жидкости — по модели.", "Replacement price list. —", "Заміна ОЖ по прайсу. Спецификация жидкости — по модели."),
          includes: [
            L("Spust starego płynu", "Слив старой жидкости", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Слив старой жидкости"),
            L("Napełnienie właściwym płynem", "Заливка нужной ОЖ", "You need", "Заливка потрібной ОЖ"),
            L("Kontrola szczelności i odpowietrzenie", "Герметичность и развоздушивание", "And", "Герметичность і развоздушивание"),
          ],
        },
    education: [
      {
        title: L("Po co wymieniać płyn chłodniczy?", "Зачем менять ОЖ", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Зачем менять ОЖ"),
        body: L("Stary płyn traci właściwości antykorozyjne i może zapchać układ. Świeży płyn chroni pompę, chłodnicę i głowicę.", "Старая ОЖ теряет свойства и может забить систему.", "And", "Старая ОЖ теряет свойства і может забить систему."),
      },
      {
        title: L("Kiedy wymieniać?", "Когда менять", "When", "Коли менять"),
        body: L("Według interwału producenta, przy zmianie koloru/mętności, po naprawie układu albo przegrzaniu.", "По регламенту, при мутной жидкости или после ремонта.", "Or after", "По регламенту, при мутной жидкости або після ремонта."),
      },
      {
        title: L("Objawy problemów z chłodzeniem", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Wskazówka temperatury rośnie, niedogrzewanie, wycieki, zapach płynu, kontrolka temperatury.", "Рост температуры, утечки, запах ОЖ, лампа.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Рост температуры, утечки, запах ОЖ, лампа."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Ok. 1–2 h. Cena według cennika + płyn. Przy wycieku najpierw diagnostyka.", "1–2 ч. Цена по прайсу + жидкость.", "1–2 . price list +", "1–2 ч. Цена по прайсу + жидкость."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Jaki płyn wlewacie?", "Какую ОЖ?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Какую ОЖ?"),
        a: L("Zgodny ze specyfikacją producenta — nie mieszamy „byle czerwonego z zielonym”.", "По спецификации производителя, без смешивания наугад.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "По спецификации производителя, без смешивания наугад."),
      },
      {
        q: L("Czy płuczecie układ?", "Промываете систему?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Промываете систему?"),
        a: L("Gdy jest zabrudzenie lub po mieszaniu płynów — proponujemy płukanie w wycenie.", "При загрязнении предложим промывку в смете.", "Quote", "При загрязнении предложим промывку в смете."),
      },
      {
        q: L("Czy to pomoże na przegrzewanie?", "Поможет от перегрева?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Поможет от перегрева?"),
        a: L("Jeśli przyczyną był stary płyn lub powietrze w układzie — tak. Przy uszkodzonej pompie/termostacie potrzebna dalsza naprawa.", "Если дело в ОЖ/воздухе — да; иначе нужна дальнейшая диагностика.", "If / — ; diagnostics", "Якщо дело в ОЖ/воздухе — да; иначе нужна дальнейшая діагностика."),
      },
    ],
  },

  "wymiana-swiec-zaplonowych-warszawa": {
    bookServiceId: "engine",
    contentServiceId: "engine",
    faqDuration: L("Wymiana świec zwykle 1–2 godziny — zależnie od dostępu do silnika.", "Замена свечей обычно 1–2 часа.", "Replacement usually 1–2 hours", "Заміна свечей зазвичай 1–2 год."),
    price: {
          fromZl: getPriceItem("spark_plugs")?.basePrice ?? 50,
          priceFrom: true,
          materialsExtra: true,
          note: L("Robocizna za cylinder według cennika. Liczba cylindrów × stawka + świece. Silniki z trudnym dostępem mogą być droższe — wycena po modelu.", "Работа за цилиндр по прайсу × число цилиндров + свечи.", "Labour price list × +", "Робота за цилиндр по прайсу × число цилиндров + свечи."),
          includes: [
            L("Dobór świec pod silnik", "Подбор свечей под мотор", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Подбор свечей под мотор"),
            L("Wymiana według momentu dokręcenia", "Замена с моментом затяжки", "Replacement", "Заміна с моментом затяжки"),
            L("Kontrola cewek / przewodów gdy dostępne", "Проверка катушек при доступе", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Проверка катушек при доступе"),
          ],
        },
    education: [
      {
        title: L("Kiedy wymieniać świece?", "Когда менять свечи", "When", "Коли менять свечи"),
        body: L("Według interwału, przy trudnym rozruchu, nierównej pracy, spadku mocy albo błędach zapłonu.", "По регламенту, трудный пуск, троение, потеря мощности.", "Days", "По регламенту, трудный пуск, троение, потеря мощности."),
      },
      {
        title: L("Objawy zużytych świec", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Szarpania, wyższe spalanie, Check Engine (misfire), słabsze przyspieszenie.", "Рывки, расход, Check Engine, слабый разгон.", "Check Engine", "Рывки, расход, Check Engine, слабый разгон."),
      },
      {
        title: L("Jak pracujemy", "Как работаем", "How we work", "Как роботаем"),
        body: L("Dobieramy świece (nikiel/iryd/platyna wg zaleceń), wymieniamy z właściwym momentem, kasujemy błędy jeśli były związane z zapłonem.", "Подбор, замена с моментом, сброс ошибок зажигания при необходимости.", "Replacement", "Подбор, заміна с моментом, сброс ошибок зажигания при необходимости."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Często 1–2 h. Cena = robocizna za cylinder × liczba + świece. Potwierdzamy przed startem.", "Часто 1–2 ч. Работа за цилиндр × число + свечи.", "Hours 1–2 . labour × +", "Часто 1–2 ч. Робота за цилиндр × число + свечи."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Benzyna czy diesel?", "Бензин или дизель?", "Or ?", "Бензин або дизель?"),
        a: L("Świece zapłonowe dotyczą silników benzynowych. Diesel ma świece żarowe — inna usługa.", "Свечи зажигания — бензин; у дизеля свечи накала.", "— ;", "Свечи зажигания — бензин; у дизеля свечи накала."),
      },
      {
        q: L("Czy wymieniacie cewki?", "Меняете катушки?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Меняете катушки?"),
        a: L("Jeśli diagnostyka wskaże cewkę — wyceniamy osobno. Nie wymieniamy „na wszelki wypadek” bez potrzeby.", "При необходимости — отдельная смета.", "— quote", "При необходимости — отдельная кошторис."),
      },
      {
        q: L("Iryd czy zwykłe?", "Иридий или обычные?", "Or ?", "Иридий або обычные?"),
        a: L("Według zaleceń producenta silnika — dobór po VIN/modelu.", "По рекомендации производителя / VIN.", "/ VIN", "По рекомендации производителя / VIN."),
      },
    ],
  },

  "wymiana-alternatora-warszawa": {
    bookServiceId: "starterGen",
    contentServiceId: "starterGen",
    faqDuration: L("Wymiana alternatora zwykle kilka godzin — zależnie od zabudowy.", "Замена генератора обычно несколько часов.", "Replacement usually several hours", "Заміна генератора зазвичай кілька годин."),
    price: {
          fromZl: getPriceItem("alternator_repair")?.basePrice ?? 450,
          priceFrom: true,
          materialsExtra: true,
          note: L("Naprawa/serwis alternatora — cena „od” w cenniku. Wymiana na nowy/regenerowany: wycena indywidualna po diagnostyce ładowania.", "Ремонт генератора — цена «от» в прайсе. Замена — смета после диагностики.", "— «» price list. replacement — quote after diagnostics", "Ремонт генератора — ціна «от» в прайсе. Заміна — кошторис після діагностики."),
          includes: [
            L("Pomiar ładowania i diagnostyka", "Замер зарядки и диагностика", "And diagnostics", "Замер зарядки і діагностика"),
            L("Naprawa lub wymiana według wyceny", "Ремонт или замена по смете", "Or replacement quote", "Ремонт або заміна по смете"),
            L("Kontrola paska i akumulatora", "Проверка ремня и АКБ", "And", "Проверка ремня і АКБ"),
          ],
        },
    education: [
      {
        title: L("Objawy słabego alternatora", "Симптомы генератора", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Симптомы генератора"),
        body: L("Lampka akumulatora, słabe światła, rozładowany akumulator, piszczenie paska, spadek napięcia na wolnych obrotach.", "Лампа АКБ, тусклый свет, разряд, свист ремня.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Лампа АКБ, тусклый свет, разряд, свист ремня."),
      },
      {
        title: L("Kiedy wymieniać, a kiedy naprawiać?", "Когда менять, когда ремонтировать", "When , when", "Коли менять, коли ремонтировать"),
        body: L("Po pomiarze decydujemy: szczotki/regulator, regeneracja albo wymiana. Nie zgadujemy bez diagnostyki.", "Решение после замера — щётки, восстановление или замена.", "After — , or replacement", "Решение після замера — щётки, восстановление або заміна."),
      },
      {
        title: L("Jak wygląda usługa", "Как проходит", "How it works", "Как проходит"),
        body: L("Sprawdzamy akumulator i ładowanie, demontujemy alternator, realizujemy uzgodniony zakres, kontrolujemy napięcie po montażu.", "Диагностика, демонтаж, согласованный объём, контроль напряжения.", "Diagnostics", "Діагностика, демонтаж, согласованный объём, контроль напряжения."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Kilka godzin typowo. Orientacja: pozycja naprawy alternatora w cenniku lub wycena wymiany. Części osobno.", "Обычно несколько часов. Прайс или индивидуальная смета.", "Usually several hours. price list or quote", "Зазвичай кілька годин. Прайс або индивидуальная кошторис."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy to nie akumulator?", "Может аккумулятор?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Может аккумулятор?"),
        a: L("Często mylone. Mierzymy oba — czasem wystarczy akumulator, czasem alternator.", "Измеряем оба — иногда достаточно АКБ.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Измеряем оба — иногда достаточно АКБ."),
      },
      {
        q: L("Regenerowany czy nowy?", "Восстановленный или новый?", "Or ?", "Восстановленный або новый?"),
        a: L("Podajemy opcje w wycenie z plusami i minusami.", "Варианты в смете.", "Quote", "Варианты в смете."),
      },
      {
        q: L("Czy auto odpali od razu?", "Авто сразу заведётся?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Авто сразу заведётся?"),
        a: L("Po sprawnym ładowaniu i akumulatorze — tak. Przy głęboko rozładowanym AKB może być potrzebne doładowanie.", "После исправной зарядки — да; глубоко разряженный АКБ может нужно зарядить.", "After — ; you need", "Після исправной зарядки — да; глубоко разряженный АКБ может потрібно зарядить."),
      },
    ],
  },

  "wymiana-rozrusznika-warszawa": {
    bookServiceId: "starterGen",
    contentServiceId: "starterGen",
    faqDuration: L("Wymiana rozrusznika zwykle kilka godzin — zależnie od modelu.", "Замена стартера обычно несколько часов.", "Replacement usually several hours", "Заміна стартера зазвичай кілька годин."),
    price: {
          fromZl: getPriceItem("starter_repair")?.basePrice ?? 350,
          priceFrom: true,
          materialsExtra: true,
          note: L("Naprawa rozrusznika — cena „od” w cenniku. Wymiana: wycena po diagnostyce rozruchu (akumulator, masa, sam rozrusznik).", "Ремонт стартера — цена «от». Замена — смета после диагностики.", "— «». replacement — quote after diagnostics", "Ремонт стартера — ціна «от». Заміна — кошторис після діагностики."),
          includes: [
            L("Diagnostyka rozruchu", "Диагностика пуска", "Diagnostics", "Діагностика пуска"),
            L("Naprawa lub wymiana według wyceny", "Ремонт или замена по смете", "Or replacement quote", "Ремонт або заміна по смете"),
            L("Kontrola instalacji i akumulatora", "Проверка проводки и АКБ", "And", "Проверка проводки і АКБ"),
          ],
        },
    education: [
      {
        title: L("Objawy uszkodzonego rozrusznika", "Симптомы стартера", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Симптомы стартера"),
        body: L("Kliknięcie bez obrotów, wolne kręcenie, zgrzyt, brak reakcji mimo sprawnego akumulatora.", "Щелчок без оборотов, медленное кручение, скрежет.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Щелчок без оборотов, медленное кручение, скрежет."),
      },
      {
        title: L("Kiedy jechać do warsztatu?", "Когда ехать", "When to come", "Коли ехать"),
        body: L("Gdy rozruch jest niepewny — nie czekaj na całkowitą awarię na parkingu pod blokiem czy na Okęciu.", "При неуверенном пуске — не ждите полного отказа.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "При неуверенном пуске — не ждите полного отказа."),
      },
      {
        title: L("Diagnostyka najpierw", "Сначала диагностика", "Diagnostics", "Сначала діагностика"),
        body: L("Sprawdzamy akumulator, kable masy i sterowanie. Dopiero potem rozrusznik — żeby nie wymieniać części niepotrzebnie.", "АКБ, масса, управление — потом стартер.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "АКБ, масса, управление — потом стартер."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Często kilka godzin. Orientacja: naprawa rozrusznika w cenniku lub wycena wymiany + część.", "Часто несколько часов. Прайс или смета замены.", "Hours several hours. price list or quote replacement", "Часто кілька годин. Прайс або кошторис заміни."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Auto kręci wolno — to rozrusznik?", "Медленно крутит — стартер?", "— ?", "Медленно крутит — стартер?"),
        a: L("Nie zawsze — najpierw akumulator i styki. Diagnoza rozstrzyga.", "Не всегда — сначала АКБ и контакты.", "— and", "Не всегда — сначала АКБ і контакты."),
      },
      {
        q: L("Benzyna i diesel?", "Бензин и дизель?", "And ?", "Бензин і дизель?"),
        a: L("Tak — obsługujemy oba, dostęp bywa trudniejszy w dieslach z obudową.", "Да — доступ у дизелей иногда сложнее.", "Yes —", "Так — доступ у дизелей иногда сложнее."),
      },
      {
        q: L("Czy regenerujecie?", "Восстанавливаете?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Восстанавливаете?"),
        a: L("Gdy to ma sens ekonomiczny — tak. Inaczej proponujemy wymianę.", "Если экономично — да, иначе замена.", "If — , replacement", "Якщо экономично — да, иначе заміна."),
      },
    ],
  },

  "naprawa-wydechu-warszawa": {
    bookServiceId: "exhaust",
    contentServiceId: "exhaust",
    faqDuration: L("Drobne spawanie często tego samego dnia. Większa wymiana — zależnie od części.", "Мелкая сварка часто в тот же день.", "Hours", "Мелкая сварка часто в тот же день."),
    price: {
          fromZl: getPriceItem("exhaust_weld")?.basePrice ?? 150,
          priceFrom: true,
          materialsExtra: true,
          note: L("Spawanie układu wydechowego — cena „od” w cenniku. Tłumik/katalizator: wycena po oględzinach.", "Сварка выхлопа — цена «от». Глушитель/катализатор — смета после осмотра.", "— «». / — quote after", "Сварка выхлопа — ціна «от». Глушитель/катализатор — кошторис після осмотра."),
          includes: [
            L("Oględziny układu wydechowego", "Осмотр выхлопа", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Осмотр выхлопа"),
            L("Spawanie lub wymiana według wyceny", "Сварка или замена по смете", "Or replacement quote", "Сварка або заміна по смете"),
            L("Kontrola szczelności po naprawie", "Проверка герметичности", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Проверка герметичности"),
          ],
        },
    education: [
      {
        title: L("Objawy uszkodzonego wydechu", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Głośniejsza praca, metaliczny stuk, zapach spalin w kabinie, spadek mocy, Check Engine (sonda/katalizator).", "Громче выхлоп, стук, запах в салоне, потеря мощности.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Громче выхлоп, стук, запах в салоне, потеря мощности."),
      },
      {
        title: L("Kiedy naprawiać?", "Когда ремонтировать", "When", "Коли ремонтировать"),
        body: L("Przy korozji, pęknięciu rury, obitym tłumiku albo nieszczelności przed sondą — nie odkładaj, spada komfort i emisja.", "Коррозия, трещина, пробой — не откладывать.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Коррозия, трещина, пробой — не откладывать."),
      },
      {
        title: L("Spawanie czy wymiana?", "Сварка или замена", "Or replacement", "Сварка або заміна"),
        body: L("Drobne pęknięcia spawamy. Przy korozji na dużym odcinku uczciwie proponujemy wymianę elementu.", "Мелкое — сварка; при сильной коррозии — замена.", "— ; — replacement", "Мелкое — сварка; при сильной коррозии — заміна."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Drobne naprawy często 1–2 h. Cena od spawania w cenniku; większy zakres — wycena.", "Мелкое часто 1–2 ч. Цена от сварки в прайсе.", "Hours 1–2 . price list", "Мелкое часто 1–2 ч. Цена от сварки в прайсе."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy robicie katalizatory?", "Делаете катализаторы?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Делаете катализаторы?"),
        a: L("Wymiana katalizatora jest w zakresie — wycena po modelu. Nie oferujemy nielegalnego usuwania.", "Замена катализатора — по смете. Незаконное удаление не делаем.", "Replacement — quote", "Заміна катализатора — по смете. Незаконное удаление не делаем."),
      },
      {
        q: L("Czy to przejdzie przegląd?", "Пройдёт техосмотр?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Пройдёт техосмотр?"),
        a: L("Po szczelnej naprawie i sprawnej emisji — szansa rośnie. Diagnozujemy sonda/katalizator gdy trzeba.", "После герметичного ремонта шансы выше.", "After", "Після герметичного ремонта шансы выше."),
      },
      {
        q: L("Hałas tylko przy zimnym?", "Шум только на холодную?", "Days?", "Шум только на холодную?"),
        a: L("Może to nieszczelność lub poduszka wydechu — sprawdzimy na podnośniku.", "Проверим на подъёмнике.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Проверим на подъёмнике."),
      },
    ],
  },

  "diagnostyka-silnika-warszawa": {
    bookServiceId: "engine",
    contentServiceId: "engine",
    faqDuration: L("Diagnostyka silnika zwykle 45–90 minut — zależnie od objawów.", "Диагностика двигателя обычно 45–90 минут.", "Diagnostics engine usually 45–90 min", "Діагностика двигуня зазвичай 45–90 минут."),
    price: {
          fromZl: getPriceItem("engine_diag")?.basePrice ?? 200,
          priceFrom: true,
          materialsExtra: false,
          note: L("Diagnostyka silnika według cennika. Dalsze naprawy wyceniamy osobno po ustaleniu przyczyny.", "Диагностика двигателя по прайсу. Ремонт — отдельная смета.", "Diagnostics engine price list. — quote", "Діагностика двигуня по прайсу. Ремонт — отдельная кошторис."),
          includes: [
            L("Odczyt błędów i parametry live", "Коды и live-параметры", "And live", "Коды і live-параметры"),
            L("Ocena objawów mechanicznych", "Оценка механических симптомов", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Оценка механических симптомов"),
            L("Rekomendacja naprawy z wyceną", "Рекомендации и смета", "And quote", "Рекомендации і кошторис"),
          ],
        },
    education: [
      {
        title: L("Kiedy robić diagnostykę silnika?", "Когда делать", "When", "Коли делать"),
        body: L("Check Engine, spadek mocy, nierówna praca, dym, stukanie, wysokie spalanie — zanim wymienisz czujniki „na ślepo”.", "Check Engine, потеря мощности, троение, дым — до замены датчиков вслепую.", "Check Engine, , , — replacement", "Check Engine, потеря мощности, троение, дым — до заміни датчиков вслепую."),
      },
      {
        title: L("Objawy", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Szarpania, trudny rozruch, metaliczne stuki, biały/niebieski/czarny dym, tryb awaryjny.", "Рывки, трудный пуск, стуки, дым, аварийный режим.", "Days", "Рывки, трудный пуск, стуки, дым, аварийный режим."),
      },
      {
        title: L("Co dostajesz", "Что получаете", "What", "Що получаете"),
        body: L("Listę ustaleń, priorytety (pilne vs może poczekać) i orientacyjny koszt naprawy. Bez kasowania błędów zamiast naprawy.", "Выводы, приоритеты и ориентировочная смета.", "And quote", "Выводы, приоритеты і ориентировочная кошторис."),
      },
      {
        title: L("Czas i cena", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Zwykle 45–90 min. Cena według cennika diagnostyki silnika.", "Обычно 45–90 мин. Цена по прайсу.", "Usually 45–90 min. price list", "Зазвичай 45–90 мин. Цена по прайсу."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy to to samo co diagnostyka komputerowa?", "Это то же что компьютерная?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Це то же что компьютерная?"),
        a: L("Komputer jest bazą; diagnostyka silnika idzie głębiej w objawy mechaniczne i parametry.", "Компьютер — база; диагностика двигателя глубже по механике.", "— ; diagnostics engine", "Компьютер — база; діагностика двигуня глубже по механике."),
      },
      {
        q: L("Czy robicie pomiar kompresji?", "Делаете компрессию?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Делаете компрессию?"),
        a: L("Tak — gdy objawy na to wskazują. Osobna usługa / zakres w wycenie.", "Да — при показаниях, отдельный объём в смете.", "Yes — , quote", "Так — при показаниях, отдельный объём в смете."),
      },
      {
        q: L("Czy naprawiacie od razu?", "Сразу ремонтируете?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Сразу ремонтируете?"),
        a: L("Po akceptacji wyceny — tak. Najpierw diagnoza i zgoda na zakres.", "После согласия на смету — да.", "After quote —", "Після согласия на кошторис — да."),
      },
    ],
  },

  "test-kompresji-warszawa": {
    bookServiceId: "engine",
    contentServiceId: "engine",
    faqDuration: L("Pomiar kompresji zwykle ok. 1–2 godzin — zależnie od silnika.", "Замер компрессии обычно 1–2 часа.", "Usually 1–2 hours", "Замер компрессии зазвичай 1–2 год."),
    price: null,
    education: [
      {
        title: L("Po co pomiar kompresji?", "Зачем замер компрессии", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Зачем замер компрессии"),
        body: L("Pokazuje, czy cylindry trzymają ciśnienie — ważny test przy braku mocy, wysokim zużyciu oleju lub nierównej pracy.", "Показывает состояние цилиндров при потере мощности или расходе масла.", "Or oil", "Показывает состояние цилиндров при потере мощности або расходе оливи."),
      },
      {
        title: L("Kiedy warto?", "Когда стоит", "When", "Коли стоит"),
        body: L("Po diagnostyce komputerowej bez jednoznacznej przyczyny, przy podejrzeniu zużycia pierścieni/zaworów, przed kupnem auta.", "Когда компьютер не дал ответа, подозрение на кольца/клапаны, перед покупкой.", "When , /, before", "Коли компьютер не дал ответа, подозрение на кольца/клапаны, перед покупкой."),
      },
      {
        title: L("Jak wygląda test", "Как проходит", "How it works", "Как проходит"),
        body: L("Przygotowujemy silnik, mierzymy ciśnienie w cylindrach, porównujemy wyniki i omawiamy wnioski — bez straszenia „wyrokiem”.", "Замер по цилиндрам, сравнение, понятные выводы.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Замер по цилиндрам, сравнение, понятные выводы."),
      },
      {
        title: L("Cena", "Цена", "Price", "Цена"),
        body: L("Zapytaj o wycenę — koszt zależy od dostępu do świec/wtryskiwaczy i typu silnika. Umów wizytę lub zadzwoń +48 791 257 229.", "Запросите смету — зависит от доступа и типа мотора.", "Quote — and", "Запросите кошторис — зависит от доступа і типа мотора."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy kompresja boli silnik?", "Вреден ли замер?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Вреден ли замер?"),
        a: L("To standardowa diagnostyka przy prawidłowej procedurze — nie „psujemy” silnika pomiarem.", "При правильной процедуре это стандартная диагностика.", "Diagnostics", "При правильной процедуре это стандартная діагностика."),
      },
      {
        q: L("Benzyna i diesel?", "Бензин и дизель?", "And ?", "Бензин і дизель?"),
        a: L("Tak — procedura różni się; wyceniamy po modelu.", "Да — процедура отличается, смета по модели.", "Yes — , quote", "Так — процедура отличается, кошторис по модели."),
      },
      {
        q: L("Co jeśli wynik jest słaby?", "Если результат слабый?", "If ?", "Якщо результат слабый?"),
        a: L("Omawiamy możliwe przyczyny i kolejne kroki (np. test szczelności) zanim zaproponujemy kosztowną naprawę.", "Обсудим причины и следующие шаги до дорогого ремонта.", "And", "Обсудим причины і следующие шаги до дорогого ремонта."),
      },
    ],
  },

  "diagnostyka-dymem-warszawa": {
    bookServiceId: "diagnostic",
    contentServiceId: "diagnostic",
    faqDuration: L("Diagnostyka dymem zwykle ok. 1 godziny — zależnie od dostępu.", "Диагностика дымом обычно около 1 часа.", "Diagnostics usually 1 hours", "Діагностика дымом зазвичай около 1 год."),
    price: null,
    education: [
      {
        title: L("Na czym polega diagnostyka dymem?", "Что это", "What", "Що это"),
        body: L("Wprowadzamy dym do układu dolotowego / podciśnienia, żeby zobaczyć nieszczelności — pęknięte przewody, nieszczelne kolektory, uszczelki.", "Дым впуск/вакуум показывает трещины патрубков и негерметичности.", "/ and", "Дым впуск/вакуум показывает трещины патрубков і негерметичности."),
      },
      {
        title: L("Kiedy pomaga?", "Когда помогает", "When", "Коли помогает"),
        body: L("Błędy mieszanki (lean/rich), nierówna praca, gwizdy, problemy po naprawach dolotu, podejrzenie nieszczelności.", "Ошибки смеси, троение, свист, подозрение на подсос воздуха.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Ошибки смеси, троение, свист, подозрение на подсос воздуха."),
      },
      {
        title: L("Jak wygląda wizyta", "Как проходит", "How it works", "Как проходит"),
        body: L("Podłączamy generator dymu, lokalizujemy miejsce ucieczki, fotografujemy/pokazujemy i wyceniamy naprawę.", "Подключаем дым, находим утечку, показываем и даём смету ремонта.", "And quote", "Подключаем дым, находим утечку, показываем і даём кошторис ремонта."),
      },
      {
        title: L("Cena", "Цена", "Price", "Цена"),
        body: L("Zapytaj o wycenę — zakres zależy od układu. Zadzwoń +48 791 257 229 lub umów wizytę.", "Запросите смету по телефону +48 791 257 229.", "Quote +48 791 257 229", "Запросите кошторис по телефону +48 791 257 229."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy dym jest bezpieczny?", "Дым безопасен?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Дым безопасен?"),
        a: L("Używamy diagnostycznego dymu do układu — to standardowa metoda lokalizacji nieszczelności.", "Это стандартный диагностический метод.", "Diagnostics", "Це стандартный диагностический метод."),
      },
      {
        q: L("Czy zawsze znajdziecie nieszczelność?", "Всегда найдёте?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Всегда найдёте?"),
        a: L("W większości przypadków tak. Jeśli ucieczka jest okresowa — omawiamy kolejne kroki.", "В большинстве да; при периодической утечке — следующие шаги.", "Tyres ; —", "В большинстве да; при периодической утечке — следующие шаги."),
      },
      {
        q: L("Czy naprawiacie od razu?", "Сразу чините?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Сразу чините?"),
        a: L("Po akceptacji wyceny możemy przejść do naprawy w tym samym terminie, jeśli pozwala czas i części.", "После согласия — если позволяют время и запчасти.", "After — if and hours", "Після согласия — якщо позволяют время і запчасти."),
      },
    ],
  },

  "diagnostyka-przed-zakupem-warszawa": {
    bookServiceId: "diagnostic",
    contentServiceId: "diagnostic",
    faqDuration: L("Sprawdzenie przed zakupem zwykle 1–2 godziny — zależnie od pakietu.", "Проверка перед покупкой обычно 1–2 часа.", "Before usually 1–2 hours", "Проверка перед покупкой зазвичай 1–2 год."),
    price: {
          fromZl: getPriceItem("pre_buy")?.basePrice ?? 400,
          priceFrom: true,
          materialsExtra: false,
          note: L("Kontrola przed zakupem według cennika. Zakres omawiamy przed wizytą — diagnostyka + oględziny.", "Проверка перед покупкой по прайсу. Объём согласуем до визита.", "Before price list", "Проверка перед покупкой по прайсу. Объём согласуем до визита."),
          includes: [
            L("Diagnostyka komputerowa", "Компьютерная диагностика", "Diagnostics", "Компьютерная діагностика"),
            L("Oględziny zawieszenia / wycieków", "Осмотр подвески / утечек", "Suspension /", "Осмотр підвіски / утечек"),
            L("Raport z rekomendacją kupna / ryzyka", "Отчёт с рисками покупки", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Отчёт с рисками покупки"),
          ],
        },
    education: [
      {
        title: L("Po co sprawdzać auto przed zakupem?", "Зачем проверять", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Зачем проверять"),
        body: L("Taniej wykryć ukryte koszty (DPF, skrzynia, wycieki) przed przelewem niż po fakcie. Dajemy konkretny raport, nie „opinie na oko”.", "Дешевле найти риски до оплаты, чем после.", "After", "Дешевле найти риски до оплаты, чем після."),
      },
      {
        title: L("Co sprawdzamy", "Что проверяем", "What", "Що перевіряємо"),
        body: L("Komputer, wycieki, zawieszenie, hamulce, stan ogólnomechaniczny. Szerszy zakres (np. kompresja) — po uzgodnieniu.", "Компьютер, утечки, подвеска, тормоза; шире — по договорённости.", "Suspension, brake; —", "Компьютер, утечки, підвіска, гальма; шире — по договорённости."),
      },
      {
        title: L("Jak umówić", "Как записаться", "How to book", "Как записаться"),
        body: L("Umów termin z sprzedającym: Aleja Krakowska 48/52, Włochy. Auto musi dojechać na warsztat.", "Запись с продавцом: Aleja Krakowska 48/52. Авто должно приехать.", "Booking : Aleja Krakowska 48/52", "Запис с продавцом: Aleja Krakowska 48/52. Авто должно приехать."),
      },
      {
        title: L("Czas i cena", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Zwykle 1–2 h. Cena według pozycji „kontrola przed zakupem” w cenniku.", "Обычно 1–2 ч. Цена по прайсу.", "Usually 1–2 . price list", "Зазвичай 1–2 ч. Цена по прайсу."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy jedziecie na miejsce sprzedawcy?", "Выезжаете к продавцу?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Выезжаете к продавцу?"),
        a: L("Badanie robimy w warsztacie — potrzebny podnośnik i diagnostyka. Przyjedź z autem do nas.", "Проверка в сервисе — нужен подъёмник. Приезжайте к нам.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Проверка в сервисе — нужен подъёмник. Приезжайте к нам."),
      },
      {
        q: L("Czy mówicie „kupuj / nie kupuj”?", "Говорите покупать или нет?", "Or ?", "Говорите покупать або нет?"),
        a: L("Wskazujemy ryzyka i koszty. Decyzja zakupu należy do Ciebie — dostajesz fakty.", "Показываем риски и бюджет; решение за вами.", "And ;", "Показываем риски і бюджет; решение за вами."),
      },
      {
        q: L("Ile wcześniej umawiać?", "Насколько заранее?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Насколько заранее?"),
        a: L("Najlepiej dzień–dwa wcześniej, zwłaszcza w sezonie. Telefon +48 791 257 229.", "Лучше за 1–2 дня. Телефон +48 791 257 229.", "1–2 days. +48 791 257 229", "Лучше за 1–2 дня. Телефон +48 791 257 229."),
      },
    ],
  },

  "wymiana-pompy-wody-warszawa": {
    bookServiceId: "timingBelt",
    contentServiceId: "timingBelt",
    faqDuration: L("Wymiana pompy wody zwykle kilka godzin; z rozrządem dłużej.", "Замена помпы обычно несколько часов; с ГРМ дольше.", "Replacement usually several hours;", "Заміна помпы зазвичай кілька годин; с ГРМ дольше."),
    price: {
          fromZl: getPriceItem("water_pump")?.basePrice ?? 350,
          priceFrom: true,
          materialsExtra: true,
          note: L("Wymiana pompy wody według cennika. Przy wspólnym napędzie z rozrządem wyceniamy komplet — często opłaca się zrobić razem.", "Замена помпы по прайсу. С ремнём ГРМ часто выгоднее комплект.", "Replacement price list. hours days", "Заміна помпы по прайсу. С ремнём ГРМ часто выгоднее комплект."),
          includes: [
            L("Ocena wycieku / hałasu pompy", "Оценка течи / шума помпы", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Оценка течи / шума помпы"),
            L("Wymiana pompy według wyceny", "Замена помпы по смете", "Replacement quote", "Заміна помпы по смете"),
            L("Kontrola poziomu płynu i szczelności", "Уровень ОЖ и герметичность", "And", "Уровень ОЖ і герметичность"),
          ],
        },
    education: [
      {
        title: L("Objawy pompy wody", "Симптомы помпы", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Симптомы помпы"),
        body: L("Wyciek z okolic pompy, przegrzewanie, hałas łożyska, spadek poziomu płynu chłodniczego.", "Течь, перегрев, шум подшипника, падение уровня ОЖ.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Течь, перегрев, шум подшипника, падение уровня ОЖ."),
      },
      {
        title: L("Kiedy wymieniać z rozrządem?", "Когда вместе с ГРМ", "When", "Коли вместе с ГРМ"),
        body: L("Gdy pompa jest napędzana rozrządem — przy wymianie paska/łańcucha często wymieniamy pompę od razu, żeby nie otwierać silnika dwa razy.", "Если помпа в приводе ГРМ — часто меняют вместе с ремнём.", "If — hours", "Якщо помпа в приводе ГРМ — часто меняют вместе с ремнём."),
      },
      {
        title: L("Jak wygląda usługa", "Как проходит", "How it works", "Как проходит"),
        body: L("Diagnozujemy, wyceniamy (sama pompa lub z rozrządem), wymieniamy, odpowietrzamy układ chłodzenia.", "Диагностика, смета, замена, развоздушивание.", "Diagnostics, quote, replacement", "Діагностика, кошторис, заміна, развоздушивание."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Kilka godzin do 1–2 dni z rozrządem. Robocizna od pozycji pompy w cenniku + części.", "От нескольких часов до 1–2 дней с ГРМ.", "Several hours 1–2 days", "От нескольких годин до 1–2 дней с ГРМ."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy płyn też wymieniacie?", "Меняете ОЖ?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Меняете ОЖ?"),
        a: L("Przy otwarciu układu napełniamy właściwym płynem — rozliczenie w wycenie.", "При вскрытии системы заливаем нужную ОЖ — в смете.", "— quote", "При вскрытии системы заливаем нужную ОЖ — в смете."),
      },
      {
        q: L("Czy mogę jeździć z małym wyciekiem?", "Можно с небольшой течью?", "You can ?", "Можна с небольшой течаю?"),
        a: L("Ryzyko przegrzania rośnie — lepiej nie odkładać.", "Риск перегрева растёт — лучше не откладывать.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Риск перегрева растёт — лучше не откладывать."),
      },
      {
        q: L("Łańcuch czy pasek?", "Цепь или ремень?", "Or ?", "Цепь або ремень?"),
        a: L("Zależy od silnika — sprawdzimy po VIN i powiemy, czy pompa jest w napędzie rozrządu.", "Зависит от мотора — проверим по VIN.", "— by VIN", "Зависит от мотора — проверим по VIN."),
      },
    ],
  },

  "wymiana-uszczelki-pokrywy-zaworow-warszawa": {
    bookServiceId: "engine",
    contentServiceId: "engine",
    faqDuration: L("Wymiana uszczelki zwykle 2–4 godziny — zależnie od silnika.", "Замена прокладки обычно 2–4 часа.", "Replacement usually 2–4 hours", "Заміна прокладки зазвичай 2–4 год."),
    price: {
          fromZl: getPriceItem("valve_cover_gasket")?.basePrice ?? 250,
          priceFrom: true,
          materialsExtra: true,
          note: L("Wymiana uszczelki pokrywy zaworów według cennika. Części osobno. Przy spieczonych śrubach czas może wzrosnąć — informujemy na bieżąco.", "Замена прокладки клапанной крышки по прайсу. Детали отдельно.", "Replacement price list. parts", "Заміна прокладки клапанной крышки по прайсу. Детали отдельно."),
          includes: [
            L("Lokalizacja wycieku oleju", "Поиск течи масла", "Oil", "Поиск течи оливи"),
            L("Wymiana uszczelki / pokrywy wg wyceny", "Замена прокладки по смете", "Replacement quote", "Заміна прокладки по смете"),
            L("Kontrola poziomu oleju po montażu", "Проверка уровня масла", "Oil", "Проверка уровня оливи"),
          ],
        },
    education: [
      {
        title: L("Objawy nieszczelnej pokrywy", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Olej na pokrywie zaworów, zapach spalenizny, zabrudzone osłony paska, spadek poziomu oleju.", "Масло на крышке, запах гари, падение уровня масла.", "Oil , , oil", "Олива на крышке, запах гари, падение уровня оливи."),
      },
      {
        title: L("Kiedy wymieniać?", "Когда менять", "When", "Коли менять"),
        body: L("Gdy wyciek jest potwierdzony — nie „na wszelki wypadek”. Czasem wystarczy dokręcenie / nowa uszczelka, nie cała pokrywa.", "При подтверждённой течи; иногда только прокладка.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "При подтверждённой течи; иногда только прокладка."),
      },
      {
        title: L("Jak pracujemy", "Как работаем", "How we work", "Как роботаем"),
        body: L("Czyścimy powierzchnie, wymieniamy uszczelkę (i uszczelniacze świec gdy potrzeba), kontrolujemy momenty dokręcenia.", "Чистка, замена прокладки, контроль моментов.", "Replacement", "Чистка, заміна прокладки, контроль моментов."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Często 2–4 h. Robocizna według cennika + uszczelka.", "Часто 2–4 ч. Работа по прайсу + прокладка.", "Hours 2–4 . labour price list +", "Часто 2–4 ч. Робота по прайсу + прокладка."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy to groźne?", "Это опасно?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Це опасно?"),
        a: L("Mały wyciek brudzi silnik; większy może uszkodzić pasek lub powodować pożar na rozgrzanym kolektorze — warto naprawić.", "Большая течь опасна для ремня и из-за запаха/огня — лучше устранить.", "And - / —", "Большая теча опасна для ремня і из-за запаха/огня — лучше устранить."),
      },
      {
        q: L("Czy wymieniacie olej przy okazji?", "Меняете масло?", "Oil?", "Меняете олива?"),
        a: L("Możemy — osobna usługa. Przy mocnym zabrudzeniu warto rozważyć.", "Можно отдельно; при сильном загрязнении стоит.", "You can ;", "Можна отдельно; при сильном загрязнении стоит."),
      },
      {
        q: L("VAG / BMW trudniejsze?", "VAG/BMW сложнее?", "VAG/BMW ?", "VAG/BMW сложнее?"),
        a: L("Dostęp bywa gorszy — wycena uwzględnia model po VIN.", "Доступ бывает сложнее — учтём в смете.", "— quote", "Доступ бывает сложнее — учтём в смете."),
      },
    ],
  },

  "wymiana-poduszki-silnika-warszawa": {
    bookServiceId: "engine",
    contentServiceId: "engine",
    faqDuration: L("Wymiana poduszki zwykle 1–3 godziny — zależnie od strony i napędu.", "Замена подушки обычно 1–3 часа.", "Replacement usually 1–3 hours", "Заміна подушки зазвичай 1–3 год."),
    price: {
          fromZl: getPriceItem("engine_mount")?.basePrice ?? 250,
          priceFrom: true,
          materialsExtra: true,
          note: L("Wymiana poduszki silnika według cennika (cena „od”). Strona i typ poduszki — po diagnostyce.", "Замена подушки двигателя по прайсу. Сторона и тип — после диагностики.", "Replacement engine price list. and — after diagnostics", "Заміна подушки двигуня по прайсу. Сторона і тип — після діагностики."),
          includes: [
            L("Diagnostyka mocowań silnika", "Диагностика опор двигателя", "Diagnostics engine", "Діагностика опор двигуня"),
            L("Wymiana poduszki według wyceny", "Замена подушки по смете", "Replacement quote", "Заміна подушки по смете"),
            L("Kontrola wibracji po montażu", "Проверка вибраций", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Проверка вибраций"),
          ],
        },
    education: [
      {
        title: L("Objawy zużytej poduszki", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Wibracje na jałowym, stuk przy ruszaniu/gaszeniu, „uderzenie” przy zmianie biegów, widoczne pęknięcie gumy.", "Вибрации на холостых, удар при старте/глушении, трещина резины.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Вибрации на холостых, удар при старте/глушении, трещина резины."),
      },
      {
        title: L("Kiedy wymieniać?", "Когда менять", "When", "Коли менять"),
        body: L("Gdy diagnostyka potwierdzi luz lub rozwarstwienie poduszki — nie mylić z problemami skrzyni bez sprawdzenia.", "После подтверждения люфта — не путать с КПП без проверки.", "After —", "Після подтверждения люфта — не путать с КПП без проверки."),
      },
      {
        title: L("Jak wygląda wymiana", "Как проходит", "How it works", "Как проходит"),
        body: L("Podpieramy silnik, wymieniamy zużytą poduszkę, kontrolujemy pozostałe mocowania i wibracje na biegu jałowym.", "Подпор двигателя, замена, проверка остальных опор.", "Engine, replacement", "Подпор двигуня, заміна, проверка остальных опор."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Zwykle 1–3 h. Robocizna od pozycji w cenniku + poduszka.", "Обычно 1–3 ч. Работа по прайсу + подушка.", "Usually 1–3 . labour price list +", "Зазвичай 1–3 ч. Робота по прайсу + подушка."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Ile poduszek ma auto?", "Сколько подушек?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Сколько подушек?"),
        a: L("Zależnie od modelu — kilka. Wymieniamy te zużyte, nie cały komplet na siłę.", "Зависит от модели — меняем изношенные.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Зависит от модели — міняємо изношенные."),
      },
      {
        q: L("Czy to poprawi wibracje DSG?", "Уберёт вибрации DSG?", "DSG?", "Уберёт вибрации DSG?"),
        a: L("Jeśli winna jest poduszka — tak. Jeśli skrzynia — potrzebna osobna diagnostyka.", "Если виновата подушка — да; иначе диагностика КПП.", "If — ; diagnostics", "Якщо виновата подушка — да; иначе діагностика КПП."),
      },
      {
        q: L("Lewa czy prawa?", "Левая или правая?", "Or ?", "Левая або правая?"),
        a: L("Ustalamy na podnośniku / podczas próby — wycena wskazuje stronę.", "Определяем на диагностике — сторона в смете.", "Diagnostics — quote", "Определяем на диагностике — сторона в смете."),
      },
    ],
  },

  "wymiana-lozyska-kola-warszawa": {
    bookServiceId: "suspension",
    contentServiceId: "suspension",
    faqDuration: L("Wymiana łożyska/piasty zwykle 2–4 godziny na koło.", "Замена подшипника обычно 2–4 часа на колесо.", "Replacement usually 2–4 hours wheels", "Заміна подшипника зазвичай 2–4 год на колісо."),
    price: {
          fromZl: getPriceItem("wheel_bearing")?.basePrice ?? 300,
          priceFrom: true,
          materialsExtra: true,
          note: L("Wymiana łożyska piasty według cennika. Część (piasta/łożysko) osobno po doborze VIN.", "Замена ступичного подшипника по прайсу. Деталь отдельно по VIN.", "Replacement price list. parts by VIN", "Заміна ступичного подшипника по прайсу. Деталь отдельно по VIN."),
          includes: [
            L("Diagnostyka hałasu / luzu na kole", "Диагностика шума / люфта", "Diagnostics /", "Діагностика шума / люфта"),
            L("Wymiana łożyska lub piasty", "Замена подшипника или ступицы", "Replacement or", "Заміна подшипника або ступицы"),
            L("Kontrola po montażu", "Проверка после монтажа", "After", "Проверка після монтажа"),
          ],
        },
    education: [
      {
        title: L("Objawy łożyska koła", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Hużenie narastające z prędkością, zmiana tonu przy skręcie, luz na kole, czasem kontrolka ABS (jeśli czujnik w piaście).", "Гул с скоростью, смена тона в повороте, люфт, иногда ABS.", "ABS", "Гул с скоростью, смена тона в повороте, люфт, иногда ABS."),
      },
      {
        title: L("Kiedy nie czekać?", "Когда не ждать", "When", "Коли не ждать"),
        body: L("Głośne hużenie i luz — ryzyko uszkodzenia piasty/zawieszenia. Lepiej wymienić wcześniej.", "Громкий гул и люфт — риск повреждения ступицы.", "And —", "Громкий гул і люфт — риск повреждения ступицы."),
      },
      {
        title: L("Jak diagnozujemy", "Как диагностируем", "How diagnostics", "Как диагностируем"),
        body: L("Jazda próbna + kontrola na podnośniku. Odróżniamy łożysko od opony i dyferencjału.", "Тест + подъёмник. Отличаем от шины и дифференциала.", "+ . tyres and", "Тест + подъёмник. Отличаем от шины і дифференциала."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Często 2–4 h na stronę. Robocizna według cennika + piasta/łożysko.", "Часто 2–4 ч на сторону. Работа по прайсу + деталь.", "Hours 2–4 . labour price list + parts", "Часто 2–4 ч на сторону. Робота по прайсу + деталь."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Przód czy tył?", "Перед или зад?", "Before or ?", "Перед або зад?"),
        a: L("Ustalamy stronę diagnostyką — nie wymieniamy „na zapas” wszystkich kół.", "Сторону определяем диагностикой.", "Diagnostics", "Сторону определяем диагностикой."),
      },
      {
        q: L("Czy z czujnikiem ABS?", "С датчиком ABS?", "ABS?", "С датчиком ABS?"),
        a: L("Wiele piast ma zintegrowany pierścień/czujnik — dobieramy właściwą część.", "Многие ступицы с ABS — подбираем правильную деталь.", "ABS — parts", "Многие ступицы с ABS — подбираем правильную деталь."),
      },
      {
        q: L("Czy geometria potrzebna?", "Нужна геометрия?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Нужна геометрия?"),
        a: L("Nie zawsze. Przy korozji i trudnym demontażu ocenimy po montażu.", "Не всегда — оценим после монтажа.", "— after", "Не всегда — оценим після монтажа."),
      },
    ],
  },

  "serwis-skrzyni-automatycznej-warszawa": {
    bookServiceId: "transmission",
    contentServiceId: "transmission",
    faqDuration: L("Serwis ATF zwykle kilka godzin — zależnie od procedury skrzyni.", "Сервис ATF обычно несколько часов.", "ATF usually several hours", "Сервис ATF зазвичай кілька годин."),
    price: {
          fromZl: getPriceItem("gearbox_oil_auto")?.basePrice ?? 500,
          priceFrom: true,
          materialsExtra: true,
          note: L("Wymiana oleju skrzyni automatycznej — cena „od” w cenniku. Filtr i ilość ATF zależą od typu skrzyni (VIN).", "Замена масла АКПП — цена «от». Фильтр и объём ATF — по типу КПП.", "Replacement oil — «». filter and ATF —", "Заміна оливи АКПП — ціна «от». Фільтр і объём ATF — по типу КПП."),
          includes: [
            L("Identyfikacja skrzyni i procedury", "Идентификация КПП", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Идентификация КПП"),
            L("Wymiana ATF według zaleceń", "Замена ATF по регламенту", "Replacement ATF", "Заміна ATF по регламенту"),
            L("Filtr gdy przewidziany", "Фильтр при необходимости", "Filter", "Фільтр при необходимости"),
          ],
        },
    education: [
      {
        title: L("Co obejmuje serwis automatu?", "Что входит", "What", "Що входит"),
        body: L("Dobór ATF, wymiana oleju (i filtra gdy trzeba), kontrola poziomu i jazda próbna. Nie każdy automat „płucze się” dynamicznie.", "Подбор ATF, замена, фильтр при необходимости, тест.", "ATF, replacement, filter", "Подбор ATF, заміна, фільтр при необходимости, тест."),
      },
      {
        title: L("Kiedy serwisować?", "Когда обслуживать", "When", "Коли обслуживать"),
        body: L("Według interwału, przy szarpaniu, opóźnionej zmianie biegów, przegrzewaniu lub po zakupie bez historii.", "По регламенту, при рывках, перегреве, без истории.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "По регламенту, при рывках, перегреве, без истории."),
      },
      {
        title: L("Objawy", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Szarpanie, poślizg, hałas, tryb awaryjny, ciemny olej o spaleniu.", "Рывки, пробуксовка, аварийный режим, горелый запах.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Рывки, пробуксовка, аварийный режим, горелый запах."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Kilka godzin. Robocizna od pozycji ATF w cenniku + olej/filtr. DSG ma osobną stronę i pozycję.", "Несколько часов. Прайс ATF + масло/фильтр.", "Several hours. price list ATF + oil/filter", "Несколько годин. Прайс ATF + олива/фільтр."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy to DSG?", "Это DSG?", "DSG?", "Це DSG?"),
        a: L("DSG to osobna procedura — zobacz /wymiana-oleju-dsg-warszawa. Przy zapisie podaj model.", "DSG отдельно — страница /wymiana-oleju-dsg-warszawa.", "DSG — /wymiana-oleju-dsg-warszawa", "DSG отдельно — страница /wymiana-oleju-dsg-warszawa."),
      },
      {
        q: L("Częściowa czy pełna wymiana?", "Частичная или полная?", "Hours or ?", "Частичная або полная?"),
        a: L("Dobieramy do typu skrzyni i zaleceń — nie każda wymaga płukania dynamicznego.", "По типу КПП — не каждой нужна динамическая промывка.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "По типу КПП — не каждой нужна динамическая промывка."),
      },
      {
        q: L("Jak umówić?", "Как записаться?", "How booking?", "Как записаться?"),
        a: L("Online lub +48 791 257 229. Przyda się VIN.", "Онлайн или +48 791 257 229. Лучше VIN.", "Or +48 791 257 229. VIN", "Онлайн або +48 791 257 229. Лучше VIN."),
      },
    ],
  },

  "wymiana-oleju-dsg-warszawa": {
    bookServiceId: "transmission",
    contentServiceId: "transmission",
    faqDuration: L("Wymiana oleju DSG zwykle kilka godzin.", "Замена масла DSG обычно несколько часов.", "Replacement oil DSG usually several hours", "Заміна оливи DSG зазвичай кілька годин."),
    price: {
          fromZl: getPriceItem("gearbox_oil_dsg")?.basePrice ?? 700,
          priceFrom: true,
          materialsExtra: true,
          note: L("Wymiana oleju DSG według cennika. Filtr i ilość oleju zależą od generacji skrzyni — dobór po VIN.", "Замена масла DSG по прайсу. Фильтр и объём — по поколению КПП / VIN.", "Replacement oil DSG price list. filter and — / VIN", "Заміна оливи DSG по прайсу. Фільтр і объём — по поколению КПП / VIN."),
          includes: [
            L("Identyfikacja skrzyni DSG", "Идентификация DSG", "DSG", "Идентификация DSG"),
            L("Wymiana oleju według procedury", "Замена масла по процедуре", "Replacement oil", "Заміна оливи по процедуре"),
            L("Filtr gdy wymagany", "Фильтр при необходимости", "Filter", "Фільтр при необходимости"),
          ],
        },
    education: [
      {
        title: L("Dlaczego DSG osobno?", "Почему DSG отдельно", "DSG", "Почему DSG отдельно"),
        body: L("Skrzynie DSG mają własną procedurę, filtr i olej — to nie to samo co klasyczny ATF w automacie hydraulicznym.", "У DSG своя процедура, фильтр и масло — не классический ATF.", "DSG , filter and oil — ATF", "У DSG своя процедура, фільтр і олива — не классический ATF."),
      },
      {
        title: L("Kiedy wymieniać olej DSG?", "Когда менять", "When", "Коли менять"),
        body: L("Według interwału grupy VAG / zaleceń, przy szarpaniu w korkach, przegrzewaniu lub po zakupie auta.", "По регламенту VAG, при рывках в пробках или после покупки.", "VAG, or after", "По регламенту VAG, при рывках в пробках або після покупки."),
      },
      {
        title: L("Objawy", "Симптомы", "Symptoms", "Симптомы"),
        body: L("Szarpanie przy ruszaniu, wibracje, opóźniona zmiana, komunikaty skrzyni.", "Рывки, вибрации, задержка переключения, ошибки КПП.", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Рывки, вибрации, задержка переключения, ошибки КПП."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Kilka godzin. Cena robocizny od pozycji DSG w cenniku + olej i filtr.", "Несколько часов. Прайс DSG + масло и фильтр.", "Several hours. price list DSG + oil and filter", "Несколько годин. Прайс DSG + олива і фільтр."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy adaptacje robiicie?", "Делаете адаптации?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Делаете адаптации?"),
        a: L("Gdy procedura tego wymaga — tak, w zakresie serwisu. Potwierdzimy przy przyjęciu.", "Если нужно по процедуре — да.", "If you need —", "Якщо потрібно по процедуре — да."),
      },
      {
        q: L("Dry vs wet clutch?", "Сухое или мокрое?", "Or ?", "Сухое або мокрое?"),
        a: L("Zależy od kodu skrzyni — identyfikujemy przed doborem oleju.", "Зависит от кода КПП — определим до подбора масла.", "— oil", "Зависит от кода КПП — определим до подбора оливи."),
      },
      {
        q: L("Haldex to to samo?", "Haldex это то же?", "Haldex ?", "Haldex это то же?"),
        a: L("Nie — Haldex to sprzęgło napędu 4×4. Osobna usługa: /serwis-haldex-warszawa.", "Нет — Haldex отдельно: /serwis-haldex-warszawa.", "No — Haldex : /serwis-haldex-warszawa", "Ні — Haldex отдельно: /serwis-haldex-warszawa."),
      },
    ],
  },

  "serwis-haldex-warszawa": {
    bookServiceId: "transmission",
    contentServiceId: "transmission",
    faqDuration: L("Serwis Haldex zwykle kilka godzin — zależnie od generacji.", "Сервис Haldex обычно несколько часов.", "Haldex usually several hours", "Сервис Haldex зазвичай кілька годин."),
    price: null,
    education: [
      {
        title: L("Co to Haldex?", "Что такое Haldex", "What Haldex", "Що такое Haldex"),
        body: L("Układ sprzęgła napędu 4×4 w wielu autach VAG i innych. Wymaga okresowej wymiany oleju i często filtra — zaniedbanie kończy się awarią pompy.", "Муфта 4×4; нужно масло и часто фильтр, иначе риск поломки насоса.", "4×4; you need oil and hours filter", "Муфта 4×4; потрібно олива і часто фільтр, иначе риск поломки насоса."),
      },
      {
        title: L("Kiedy serwisować?", "Когда обслуживать", "When", "Коли обслуживать"),
        body: L("Według interwału, przy błędach napędu, hałasie z tyłu, braku dołączania 4×4 albo po zakupie bez historii.", "По регламенту, ошибки привода, нет подключения 4×4.", "4×4", "По регламенту, ошибки привода, нет подключения 4×4."),
      },
      {
        title: L("Jak wygląda usługa", "Как проходит", "How it works", "Как проходит"),
        body: L("Identyfikujemy generację Haldex, dobieramy olej/filtr, wymieniamy według procedury i sprawdzamy błędy.", "Определяем поколение, масло/фильтр, процедура, проверка ошибок.", "Oil/filter", "Определяем поколение, олива/фільтр, процедура, проверка ошибок."),
      },
      {
        title: L("Cena", "Цена", "Price", "Цена"),
        body: L("Zapytaj o wycenę po modelu / VIN — generacje Haldex różnią się zakresem. Telefon +48 791 257 229.", "Смета по модели/VIN — поколения отличаются. +48 791 257 229.", "Quote /VIN — . +48 791 257 229", "Кошторис по модели/VIN — поколения отличаются. +48 791 257 229."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy to to samo co olej DSG?", "Это масло DSG?", "Oil DSG?", "Це олива DSG?"),
        a: L("Nie. DSG i Haldex to osobne układy i oleje.", "Нет — разные системы и масла.", "No — and oil", "Ні — разные системы і оливи."),
      },
      {
        q: L("Które auta?", "Какие авто?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Какие авто?"),
        a: L("M.in. wiele Audi/VW/Skoda/Seat z napędem 4×4 — potwierdzimy po VIN.", "Многие VAG 4×4 — подтвердим по VIN.", "VAG 4×4 — by VIN", "Многие VAG 4×4 — подтвердим по VIN."),
      },
      {
        q: L("Czy mogę przyjechać z Ocęcia?", "Можно с Okęcie?", "You can Okęcie?", "Можна с Okęcie?"),
        a: L("Tak — jesteśmy przy Alei Krakowskiej 48/52, ok. 5 min od Okęcia.", "Да — Aleja Krakowska 48/52, ~5 мин от Okęcie.", "Yes — Aleja Krakowska 48/52, ~5 min Okęcie", "Так — Aleja Krakowska 48/52, ~5 мин от Okęcie."),
      },
    ],
  },

  "mechanik-warszawa-okecie": {
    bookServiceId: "diagnostic",
    contentServiceId: "diagnostic",
    faqDuration: L("Krótkie usługi (olej, diagnostyka) często tego samego dnia — gdy jest wolne stanowisko.", "Короткие услуги часто в тот же день.", "Hours", "Короткие услуги часто в тот же день."),
    price: {
          fromZl: getPriceItem("computer_diag")?.basePrice ?? 150,
          priceFrom: true,
          materialsExtra: false,
          note: L("Orientacyjnie od diagnostyki komputerowej. Zakres napraw — wycena indywidualna. Dojazd z Okęcia: Aleja Krakowska 48/52.", "Ориентировочно от компьютерной диагностики. С Okęcie: Aleja Krakowska 48/52.", "Diagnostics. Okęcie: Aleja Krakowska 48/52", "Ориентировочно от компьютерной діагностики. С Okęcie: Aleja Krakowska 48/52."),
          includes: [
            L("Przyjęcie i wstępna ocena", "Приём и первичная оценка", "And", "Приём і первичная оценка"),
            L("Diagnostyka według potrzeby", "Диагностика по необходимости", "Diagnostics", "Діагностика по необходимости"),
            L("Wycena przed naprawą", "Смета до ремонта", "Quote", "Кошторис до ремонта"),
          ],
        },
    education: [
      {
        title: L("Mechanik blisko Okęcia", "Механик рядом с Okęcie", "Okęcie", "Механик рядом с Okęcie"),
        body: L("BESS MOTORS stoi przy Alei Krakowskiej 48/52 w dzielnicy Włochy — zwykle ok. 5 minut autem od Okęcia i lotniska Chopina. Parking przy serwisie.", "Aleja Krakowska 48/52, Włochy — около 5 минут от Okęcie и аэропорта.", "Aleja Krakowska 48/52, Włochy — 5 min Okęcie and", "Aleja Krakowska 48/52, Włochy — около 5 минут от Okęcie і аэропорта."),
      },
      {
        title: L("Jakie naprawy robimy", "Какие работы", "Labour", "Какие роботи"),
        body: L("Diagnostyka, olej i filtry, hamulce, opony, klima, zawieszenie, rozrząd, elektryka i naprawy bieżące. Nie jesteśmy dealerem marki — niezależny warsztat.", "Диагностика, масло, тормоза, шины, кондиционер, подвеска, ГРМ, электрика.", "Diagnostics, oil, brake, tyres, , suspension", "Діагностика, олива, гальма, шины, кондиционер, підвіска, ГРМ, электрика."),
      },
      {
        title: L("Dojazd z Okęcia / lotniska", "Доезд с Okęcie", "Okęcie", "Доезд с Okęcie"),
        body: L("Aleja Krakowska to główna oś — wygodnie z terminali, hoteli przy lotnisku i osiedli na Okęciu. Pn–Sb 8:00–18:00.", "Удобно с терминалов и районов Okęcie. Пн–Сб 8:00–18:00.", "Min and Okęcie. – 8:00–18:00", "Удобно с терминалов і районов Okęcie. Пн–Сб 8:00–18:00."),
      },
      {
        title: L("Jak umówić", "Как записаться", "How to book", "Как записаться"),
        body: L("Zadzwoń +48 791 257 229, umów online albo wyślij VIN z opisem. Potwierdzimy termin SMS/Telegram.", "Телефон +48 791 257 229, онлайн или VIN с описанием.", "+48 791 257 229, or VIN", "Телефон +48 791 257 229, онлайн або VIN с описанием."),
      },
      {
        title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
        body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
      },
    ],
    faqExtra: [
      {
        q: L("Czy to to samo co mechanik Włochy?", "Это тот же сервис что Włochy?", "Włochy?", "Це тот же сервис что Włochy?"),
        a: L("Tak — jeden warsztat we Włochach, wygodny też z Okęcia. Lokalnie celujemy w szybki dojazd z okolicy lotniska.", "Да — один сервис во Włochy, удобный и с Okęcie.", "Yes — Włochy, and Okęcie", "Так — один сервис во Włochy, удобный і с Okęcie."),
      },
      {
        q: L("Czy jest parking?", "Есть парковка?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Есть парковка?"),
        a: L("Tak — parking przy warsztacie na czas wizyty.", "Да — парковка при сервисе.", "Yes —", "Так — парковка при сервисе."),
      },
      {
        q: L("Czy przyjmujecie auta flotowe?", "Принимаете корпоративные?", "Details and quote at BESS MOTORS — Aleja Krakowska 48/52. Call +48 791 257 229.", "Принимаете корпоративные?"),
        a: L("Tak — faktura i ustalenia dla firm po kontakcie.", "Да — счёт и условия для компаний.", "Yes — and", "Так — счёт і условия для компаний."),
      },
    ],
  },

};

export const EXTRA_SEO_RELATED_BATCH2: Record<string, string[]> = {
  "wulkanizacja-warszawa": ["wymiana-opon-warszawa", "wywazanie-kol-warszawa", "naprawa-opon-warszawa", "opony", "geometria"],
  "wymiana-opon-warszawa": ["wulkanizacja-warszawa", "wywazanie-kol-warszawa", "naprawa-opon-warszawa", "opony"],
  "wywazanie-kol-warszawa": ["wulkanizacja-warszawa", "wymiana-opon-warszawa", "geometria", "naprawa-opon-warszawa"],
  "naprawa-opon-warszawa": ["wulkanizacja-warszawa", "wymiana-opon-warszawa", "wywazanie-kol-warszawa", "opony"],
  "wymiana-klockow-hamulcowych-warszawa": ["hamulce-warszawa", "wymiana-tarcz-hamulcowych-warszawa", "wymiana-plynu-hamulcowego-warszawa", "hamulce"],
  "wymiana-tarcz-hamulcowych-warszawa": ["hamulce-warszawa", "wymiana-klockow-hamulcowych-warszawa", "wymiana-plynu-hamulcowego-warszawa", "hamulce"],
  "wymiana-plynu-hamulcowego-warszawa": ["hamulce-warszawa", "wymiana-klockow-hamulcowych-warszawa", "wymiana-tarcz-hamulcowych-warszawa", "hamulce"],
  "wymiana-amortyzatorow-warszawa": ["naprawa-zawieszenia-warszawa", "wymiana-wahaczy-warszawa", "wymiana-lozyska-kola-warszawa", "geometria"],
  "wymiana-wahaczy-warszawa": ["naprawa-zawieszenia-warszawa", "wymiana-amortyzatorow-warszawa", "wymiana-lozyska-kola-warszawa", "geometria"],
  "naprawa-ukladu-kierowniczego-warszawa": ["wymiana-przekladni-kierowniczej-warszawa", "wymiana-drazkow-kierowniczych-warszawa", "naprawa-zawieszenia-warszawa", "geometria"],
  "wymiana-przekladni-kierowniczej-warszawa": ["naprawa-ukladu-kierowniczego-warszawa", "wymiana-drazkow-kierowniczych-warszawa", "geometria", "naprawa-zawieszenia-warszawa"],
  "wymiana-drazkow-kierowniczych-warszawa": ["naprawa-ukladu-kierowniczego-warszawa", "wymiana-przekladni-kierowniczej-warszawa", "geometria", "naprawa-zawieszenia-warszawa"],
  "wymiana-filtrow-warszawa": ["wymiana-oleju-warszawa", "wymiana-oleju", "przeglad", "diagnostyka-komputerowa-warszawa"],
  "wymiana-plynu-chlodniczego-warszawa": ["wymiana-pompy-wody-warszawa", "wymiana-rozrzadu-warszawa", "silnik", "diagnostyka-silnika-warszawa"],
  "wymiana-swiec-zaplonowych-warszawa": ["diagnostyka-silnika-warszawa", "diagnostyka-komputerowa-warszawa", "wymiana-oleju-warszawa", "silnik"],
  "wymiana-alternatora-warszawa": ["wymiana-rozrusznika-warszawa", "elektryka", "diagnostyka-komputerowa-warszawa", "mechanik-warszawa-wlochy"],
  "wymiana-rozrusznika-warszawa": ["wymiana-alternatora-warszawa", "elektryka", "diagnostyka-komputerowa-warszawa", "mechanik-warszawa-wlochy"],
  "naprawa-wydechu-warszawa": ["diagnostyka-silnika-warszawa", "diagnostyka-komputerowa-warszawa", "przeglad", "silnik"],
  "diagnostyka-silnika-warszawa": ["diagnostyka-komputerowa-warszawa", "test-kompresji-warszawa", "diagnostyka-dymem-warszawa", "silnik"],
  "test-kompresji-warszawa": ["diagnostyka-silnika-warszawa", "diagnostyka-komputerowa-warszawa", "diagnostyka-dymem-warszawa", "diagnostyka-przed-zakupem-warszawa"],
  "diagnostyka-dymem-warszawa": ["diagnostyka-silnika-warszawa", "diagnostyka-komputerowa-warszawa", "test-kompresji-warszawa", "silnik"],
  "diagnostyka-przed-zakupem-warszawa": ["diagnostyka-komputerowa-warszawa", "diagnostyka-silnika-warszawa", "test-kompresji-warszawa", "mechanik-warszawa-wlochy"],
  "wymiana-pompy-wody-warszawa": ["wymiana-rozrzadu-warszawa", "wymiana-plynu-chlodniczego-warszawa", "silnik", "diagnostyka-silnika-warszawa"],
  "wymiana-uszczelki-pokrywy-zaworow-warszawa": ["diagnostyka-silnika-warszawa", "wymiana-oleju-warszawa", "silnik", "wymiana-poduszki-silnika-warszawa"],
  "wymiana-poduszki-silnika-warszawa": ["diagnostyka-silnika-warszawa", "wymiana-uszczelki-pokrywy-zaworow-warszawa", "silnik", "wymiana-sprzegla-warszawa"],
  "wymiana-lozyska-kola-warszawa": ["naprawa-zawieszenia-warszawa", "wymiana-amortyzatorow-warszawa", "wymiana-wahaczy-warszawa", "geometria"],
  "serwis-skrzyni-automatycznej-warszawa": ["wymiana-oleju-skrzynia-automatyczna-warszawa", "wymiana-oleju-dsg-warszawa", "serwis-haldex-warszawa", "diagnostyka-komputerowa-warszawa"],
  "wymiana-oleju-dsg-warszawa": ["wymiana-oleju-skrzynia-automatyczna-warszawa", "serwis-skrzyni-automatycznej-warszawa", "serwis-haldex-warszawa", "vag"],
  "serwis-haldex-warszawa": ["wymiana-oleju-dsg-warszawa", "serwis-skrzyni-automatycznej-warszawa", "wymiana-oleju-skrzynia-automatyczna-warszawa", "vag"],
  "mechanik-warszawa-okecie": ["mechanik-warszawa-wlochy", "warszawa-wlochy", "wymiana-oleju-warszawa", "diagnostyka-komputerowa-warszawa", "wulkanizacja-warszawa"],
};

export const EXTRA_SEO_RELATED_PARENT_UPDATES: Record<string, string[]> = {
  "hamulce-warszawa": ["wymiana-klockow-hamulcowych-warszawa", "wymiana-tarcz-hamulcowych-warszawa", "wymiana-plynu-hamulcowego-warszawa", "naprawa-zawieszenia-warszawa"],
  "naprawa-zawieszenia-warszawa": ["wymiana-amortyzatorow-warszawa", "wymiana-wahaczy-warszawa", "wymiana-lozyska-kola-warszawa", "geometria"],
  "diagnostyka-komputerowa-warszawa": ["diagnostyka-silnika-warszawa", "diagnostyka-dymem-warszawa", "test-kompresji-warszawa", "diagnostyka-przed-zakupem-warszawa"],
  "wymiana-oleju-skrzynia-automatyczna-warszawa": ["serwis-skrzyni-automatycznej-warszawa", "wymiana-oleju-dsg-warszawa", "serwis-haldex-warszawa", "diagnostyka-komputerowa-warszawa"],
  "mechanik-warszawa-wlochy": ["mechanik-warszawa-okecie", "wymiana-oleju-warszawa", "diagnostyka-komputerowa-warszawa", "wulkanizacja-warszawa"],
};
