/**
 * Extra SEO service landings (Warszawa-focused URLs).
 * Merged into seoLandingPages + SEO_LANDING_SLUG_PROFILES.
 */
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import type { SlugLandingProfile } from "@/lib/seo-landing-slug-profiles";
import type { LocalizedText } from "@/lib/service-landing-content";
import { getPriceItem } from "@/lib/price-list";
import { oilLabourPromoZl, oilLabourWasZl } from "@/lib/service-prices";
import { acRechargeFromPln } from "@/lib/ac-recharge-prices";
import {
  EXTRA_SEO_SERVICE_PAGES_BATCH2,
  EXTRA_SEO_SERVICE_PROFILES_BATCH2,
  EXTRA_SEO_RELATED_BATCH2,
  EXTRA_SEO_RELATED_PARENT_UPDATES,
} from "@/lib/seo-extra-service-pages-batch2";

const L = (pl: string, ru: string): LocalizedText => ({ pl, ru });

const WHY_BESS_EDU = {
  title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS"),
  body: L(
    "Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.",
    "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy)."
  ),
};

const EXTRA_SEO_SERVICE_PAGES_BATCH1: SeoLandingPage[] = [
  {
    slug: "wymiana-rozrzadu-warszawa",
    title: "Wymiana rozrządu Warszawa – BESS MOTORS",
    line1: "Pasek lub łańcuch rozrządu",
    line2: "Diagnostyka, wycena i wymiana w Włochach",
    metaTitle: "Wymiana rozrządu Warszawa",
    metaDescription:
      "Wymiana rozrządu w Warszawie Włochy — pasek, łańcuch, pompa wody. Diagnostyka, wycena przed pracą. BESS MOTORS, Aleja Krakowska 48/52. Umów wizytę.",
    serviceId: "timingBelt",
    icon: "Clock",
  },
  {
    slug: "wymiana-sprzegla-warszawa",
    title: "Wymiana sprzęgła Warszawa – BESS MOTORS",
    line1: "Komplet sprzęgła i diagnostyka",
    line2: "Ślizganie, szarpanie, trudna zmiana biegów",
    metaTitle: "Wymiana sprzęgła Warszawa",
    metaDescription:
      "Wymiana sprzęgła w Warszawie — diagnostyka, komplet sprzęgła, dwumasa gdy potrzeba. BESS MOTORS Włochy, Aleja Krakowska 48/52. Wycena przed naprawą.",
    serviceId: "clutch",
    icon: "Cog",
  },
  {
    slug: "mechanik-warszawa-wlochy",
    title: "Mechanik samochodowy Warszawa Włochy",
    line1: "Serwis przy Alei Krakowskiej 48/52",
    line2: "Olej, hamulce, diagnostyka, klima, zawieszenie",
    metaTitle: "Mechanik Warszawa Włochy",
    metaDescription:
      "Mechanik samochodowy Warszawa Włochy — BESS MOTORS przy Alei Krakowskiej 48/52. Diagnostyka, olej, hamulce, klimatyzacja, zawieszenie. Zadzwoń lub umów wizytę.",
    serviceId: "diagnostic",
    icon: "Gauge",
  },
  {
    slug: "diagnostyka-komputerowa-warszawa",
    title: "Diagnostyka komputerowa samochodu Warszawa",
    line1: "Check Engine i błędy OBD",
    line2: "Raport z kodami i wyceną napraw",
    metaTitle: "Diagnostyka komputerowa Warszawa",
    metaDescription:
      "Diagnostyka komputerowa samochodu w Warszawie — Check Engine, OBD, parametry live. BESS MOTORS Włochy. Umów wizytę lub wyceń naprawę po VIN.",
    serviceId: "diagnostic",
    icon: "ScanLine",
  },
  {
    slug: "wymiana-oleju-warszawa",
    title: "Wymiana oleju Warszawa",
    line1: `Robocizna ${oilLabourPromoZl()} zł — kod BessMotors`,
    line2: "Zawieszenie gratis przy wymianie oleju · olej i filtr osobno",
    metaTitle: "Wymiana oleju Warszawa | 80 zł robocizna",
    metaDescription:
      "Wymiana oleju Warszawa Włochy — robocizna 80 zł, zawieszenie gratis przy oleju. Olej i filtr pod VIN. BESS MOTORS, Aleja Krakowska 48/52.",
    serviceId: "oil",
    icon: "Droplets",
  },
  {
    slug: "serwis-klimatyzacji-warszawa",
    title: "Serwis klimatyzacji samochodowej Warszawa",
    line1: `Nabijanie od ${acRechargeFromPln()} zł`,
    line2: "R134a i R1234yf · próżnia i kontrola szczelności",
    metaTitle: "Serwis klimatyzacji Warszawa",
    metaDescription:
      "Serwis klimatyzacji samochodowej Warszawa — nabijanie R134a/R1234yf, diagnostyka, odgrzybianie. BESS MOTORS Włochy, Aleja Krakowska 48/52.",
    serviceId: "acRefill",
    icon: "Wind",
  },
  {
    slug: "hamulce-warszawa",
    title: "Wymiana klocków i tarcz hamulcowych Warszawa",
    line1: "Klocki od 100 zł robocizna — kod BessMotors",
    line2: "Przód i tył · tarcze + klocki",
    metaTitle: "Hamulce Warszawa — klocki i tarcze",
    metaDescription:
      "Wymiana klocków i tarcz hamulcowych Warszawa — robocizna od 100 zł (kod BessMotors). BESS MOTORS Włochy. Umów wizytę lub zadzwoń +48 791 257 229.",
    serviceId: "brakePads",
    icon: "Disc",
  },
  {
    slug: "naprawa-zawieszenia-warszawa",
    title: "Naprawa zawieszenia Warszawa",
    line1: "Amortyzatory, wahacze, sworznie",
    line2: "Stuki, luz, nierówne zużycie opon",
    metaTitle: "Naprawa zawieszenia Warszawa",
    metaDescription:
      "Naprawa zawieszenia Warszawa — diagnostyka, amortyzatory, wahacze, łączniki. BESS MOTORS Włochy. Wycena przed naprawą, zapis online.",
    serviceId: "suspension",
    icon: "Settings",
  },
  {
    slug: "wymiana-oleju-skrzynia-automatyczna-warszawa",
    title: "Wymiana oleju w automatycznej skrzyni biegów Warszawa",
    line1: "ATF / DSG — dobór oleju po VIN",
    line2: "Diagnostyka skrzyni i wymiana według procedury",
    metaTitle: "Wymiana oleju skrzyni automatycznej Warszawa",
    metaDescription:
      "Wymiana oleju w automatycznej skrzyni biegów Warszawa — ATF, DSG, filtr gdy wymagany. BESS MOTORS Włochy. Wycena indywidualna po diagnostyce.",
    serviceId: "transmission",
    icon: "Settings2",
  },
];

export const EXTRA_SEO_SERVICE_PAGES: SeoLandingPage[] = [
  ...EXTRA_SEO_SERVICE_PAGES_BATCH1,
  ...EXTRA_SEO_SERVICE_PAGES_BATCH2,
];

const EXTRA_SEO_SERVICE_PROFILES_BATCH1: Record<string, SlugLandingProfile> = {
  "wymiana-rozrzadu-warszawa": {
    bookServiceId: "timingBelt",
    contentServiceId: "timingBelt",
    faqDuration: L(
      "Wymiana rozrządu zwykle 1–2 dni robocze — zależnie od modelu i dostępności części.",
      "Замена ГРМ обычно 1–2 рабочих дня — зависит от модели и запчастей."
    ),
    price: {
      fromZl: getPriceItem("timing_belt")?.basePrice ?? 800,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Orientacyjna robocizna — dokładna wycena po modelu i zakresie (pasek/łańcuch, pompa wody, rolki). Części osobno.",
        "Ориентировочная работа — точная смета по модели. Запчасти отдельно."
      ),
      includes: [
        L("Diagnostyka stanu rozrządu", "Диагностика ГРМ"),
        L("Wymiana paska lub łańcucha według zaleceń", "Замена ремня/цепи по регламенту"),
        L("Kontrola pomp i napinaczy", "Проверка помпы и натяжителей"),
        L("Wycena przed rozpoczęciem prac", "Смета до начала работ"),
      ],
    },
    education: [
      {
        title: L("Kiedy wymieniać rozrząd?", "Когда менять ГРМ?"),
        body: L(
          "Według przebiegu lub wieku z instrukcji, przy hałasie łańcucha, wycieku z okładzin albo po zakupie używanego auta bez historii serwisowej. Nie czekaj na zerwanie — skutki bywają kosztowne.",
          "По регламенту пробега/срока, при шуме цепи или без истории обслуживания."
        ),
      },
      {
        title: L("Objawy problemów z rozrządem", "Симптомы проблем с ГРМ"),
        body: L(
          "Metaliczny hałas z przodu silnika, nierówna praca, Check Engine związany z pozycją wałków, wyciek oleju w okolicy pokrywy rozrządu.",
          "Металлический шум спереди двигателя, нестабильная работа, Check Engine."
        ),
      },
      {
        title: L("Co wchodzi w usługę", "Что входит"),
        body: L(
          "Ocena stanu, dobór kompletu (pasek/łańcuch, rolki, napinacz, często pompa wody), wymiana według procedury producenta i kontrola po montażu.",
          "Оценка, подбор комплекта, замена по процедуре и контроль."
        ),
      },
      {
        title: L("Czas i koszt", "Срок и стоимость"),
        body: L(
          "Czas: zwykle 1–2 dni. Koszt: wycena indywidualna — robocizna od ok. 800 zł + części. Potwierdzamy zakres przed startem.",
          "Срок 1–2 дня. Стоимость — индивидуальная смета."
        ),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy wymieniacie też pompę wody przy rozrządzie?", "Меняете ли помпу вместе с ГРМ?"),
        a: L(
          "Często tak — gdy jest w napędzie rozrządu lub blisko końca resursu. Proponujemy to w wycenie, decyzja należy do Ciebie.",
          "Часто да — предлагаем в смете, решение за вами."
        ),
      },
      {
        q: L("Pasek czy łańcuch — jak sprawdzić u mnie?", "Ремень или цепь?"),
        a: L(
          "Zależy od silnika. Po VIN lub modelu sprawdzamy konstrukcję i zalecany interwał. Zadzwoń lub wyślij VIN do wyceny.",
          "Зависит от двигателя — проверим по VIN."
        ),
      },
    ],
  },

  "wymiana-sprzegla-warszawa": {
    bookServiceId: "clutch",
    contentServiceId: "clutch",
    faqDuration: L(
      "Wymiana sprzęgła zwykle 1–2 dni — zależnie od napędu i dostępności kompletu.",
      "Замена сцепления обычно 1–2 дня."
    ),
    price: {
      fromZl: getPriceItem("clutch")?.basePrice ?? 1200,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Wycena indywidualna: robocizna + komplet sprzęgła (i dwumasa, jeśli wymagana). Potwierdzamy przed demontażem.",
        "Индивидуальная смета: работа + комплект."
      ),
      includes: [
        L("Diagnostyka objawów sprzęgła", "Диагностика сцепления"),
        L("Wymiana kompletu według wyceny", "Замена комплекта по смете"),
        L("Kontrola łożyska i dwumasy gdy potrzeba", "Проверка подшипника и маховика"),
        L("Jazda próbna po montażu", "Тест после сборки"),
      ],
    },
    education: [
      {
        title: L("Kiedy potrzebna wymiana sprzęgła?", "Когда менять сцепление?"),
        body: L(
          "Gdy pedał pracuje nietypowo, biegi wchodzą ciężko, auto szarpie przy ruszaniu albo obroty rosną bez przyspieszenia (ślizganie).",
          "Тяжёлое включение передач, рывки, пробуксовка."
        ),
      },
      {
        title: L("Typowe objawy", "Типичные симптомы"),
        body: L(
          "Ślizganie pod obciążeniem, wibracje przy ruszaniu, hałas łożyska wyciskowego, zapach spalenizny po jeździe miejskiej.",
          "Пробуксовка, вибрации, запах гари."
        ),
      },
      {
        title: L("Zakres usługi", "Объём услуги"),
        body: L(
          "Diagnostyka, demontaż skrzyni, wymiana tarczy/docisku/łożyska (komplet), ocena koła zamachowego, montaż i regulacja.",
          "Диагностика, снятие КПП, замена комплекта, сборка."
        ),
      },
      {
        title: L("Czas i cena", "Срок и цена"),
        body: L(
          "Orientacyjnie 1–2 dni. Cena: wycena indywidualna (robocizna + części). Dwumasa wyceniamy osobno, jeśli jest uszkodzona.",
          "1–2 дня. Индивидуальная смета."
        ),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy zawsze trzeba wymieniać dwumasę?", "Всегда ли менять двухмассовый маховик?"),
        a: L(
          "Nie. Oceniamy stan przy demontażu i proponujemy wymianę tylko gdy jest luz, hałas lub zużycie poza normą.",
          "Нет — только при износе или люфте."
        ),
      },
    ],
  },

  "mechanik-warszawa-wlochy": {
    bookServiceId: "diagnostic",
    contentServiceId: "diagnostic",
    faqDuration: L(
      "Krótkie usługi (olej, diagnostyka) często tego samego dnia — gdy jest wolne stanowisko.",
      "Короткие услуги часто в тот же день."
    ),
    education: [
      {
        title: L("Mechanik przy Alei Krakowskiej", "Механик на Aleja Krakowska"),
        body: L(
          "BESS MOTORS to warsztat na Alei Krakowskiej 48/52 w dzielnicy Włochy — dogodnie z Okęcia, Ochoty i południowej Warszawy. Parking przy serwisie.",
          "Сервис на Aleja Krakowska 48/52, Włochy — удобно от Okęcie и юга Варшавы."
        ),
      },
      {
        title: L("Jakie naprawy wykonujemy", "Какие работы делаем"),
        body: L(
          "Diagnostyka komputerowa, wymiana oleju i filtrów, hamulce, klimatyzacja, zawieszenie, rozrząd, sprzęgło, opony i naprawy bieżące. Zakres ustalamy po oględzinach.",
          "Диагностика, масло, тормоза, кондиционер, подвеска, ГРМ, сцепление, шины."
        ),
      },
      {
        title: L("Kiedy warto przyjechać", "Когда стоит приехать"),
        body: L(
          "Check Engine, stuki, słabe hamowanie, wycieki, problemy z klimą albo zbliżający się przegląd — lepiej sprawdzić wcześniej niż ryzykować awarię w trasie.",
          "Check Engine, стуки, слабые тормоза, утечки, проблемы с кондиционером."
        ),
      },
      {
        title: L("Jak umówić wizytę", "Как записаться"),
        body: L(
          "Zadzwoń +48 791 257 229, umów online albo wyślij VIN z opisem usterki. Godziny: Pn–Sb 8:00–18:00.",
          "Телефон +48 791 257 229, онлайн-запись или VIN с описанием."
        ),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy przyjmujecie auta z innych dzielnic?", "Принимаете авто из других районов?"),
        a: L(
          "Tak — lokalizacja we Włochach jest wygodna także z Ursynowa, Mokotowa, Ochoty i z kierunku lotniska.",
          "Да — удобно с юга Варшавы и от аэропорта."
        ),
      },
    ],
  },

  "diagnostyka-komputerowa-warszawa": {
    bookServiceId: "diagnostic",
    contentServiceId: "diagnostic",
    faqDuration: L(
      "Pełna diagnostyka komputerowa zwykle 30–60 minut.",
      "Полная диагностика обычно 30–60 минут."
    ),
    price: {
      fromZl: getPriceItem("computer_diag")?.basePrice ?? 150,
      priceFrom: true,
      materialsExtra: false,
      note: L(
        "Orientacyjnie od 150 zł — zakres zależy od objawów i systemów do sprawdzenia.",
        "Ориентировочно от 150 zł."
      ),
      includes: [
        L("Odczyt kodów OBD / producenta", "Считывание кодов OBD"),
        L("Analiza parametrów live", "Анализ live-параметров"),
        L("Wskazanie przyczyn i priorytetów", "Причины и приоритеты"),
        L("Orientacyjna wycena napraw", "Ориентировочная смета"),
      ],
    },
    education: [
      {
        title: L("Kiedy robić diagnostykę?", "Когда делать диагностику?"),
        body: L(
          "Po zaświeceniu Check Engine, przy spadku mocy, nierównej pracy, problemach z DPF/AdBlue, klimą lub elektroniką — zanim wymienisz części „na ślepo”.",
          "Check Engine, потеря мощности, электроника — до замены деталей вслепую."
        ),
      },
      {
        title: L("Objawy, które warto zbadać", "Симптомы"),
        body: L(
          "Lampka silnika, szarpanie, trudny rozruch, błędy ABS/ESP, niespodziewane przejście w tryb awaryjny.",
          "Лампа двигателя, рывки, ABS/ESP, аварийный режим."
        ),
      },
      {
        title: L("Co dostajesz po diagnostyce", "Что получаете"),
        body: L(
          "Listę kodów z wyjaśnieniem, rekomendowany zakres naprawy i orientacyjny koszt. Bez kasowania błędów „żeby znikła lampka” bez naprawy przyczyny.",
          "Список кодов с объяснением и ориентировочной сметой."
        ),
      },
      {
        title: L("Czas i cena", "Срок и цена"),
        body: L(
          "Zwykle 30–60 min. Cena od ok. 150 zł — potwierdzamy przy przyjęciu.",
          "30–60 мин, от ~150 zł."
        ),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy kasujecie błędy bez naprawy?", "Сбрасываете ошибки без ремонта?"),
        a: L(
          "Kasowanie bez usunięcia przyczyny nic nie daje — lampka wraca. Najpierw diagnoza i wycena, potem naprawa.",
          "Сброс без устранения причины бесполезен."
        ),
      },
    ],
  },

  "wymiana-oleju-warszawa": {
    bookServiceId: "oil",
    contentServiceId: "oil",
    faqDuration: L("Wymiana oleju + filtr zwykle ok. 45–60 minut.", "Замена масла ~45–60 минут."),
    price: {
      fromZl: oilLabourPromoZl(),
      compareAtZl: oilLabourWasZl(),
      priceFrom: false,
      materialsExtra: true,
      note: L(
        `${oilLabourPromoZl()} zł robocizna (było ${oilLabourWasZl()} zł). Olej i filtr płatne osobno — dobór pod VIN. Przy wymianie oleju kontrola zawieszenia gratis.`,
        `${oilLabourPromoZl()} zł работа. Масло и фильтр отдельно. Подвеска бесплатно при замене масла.`
      ),
      includes: [
        L("Wymiana oleju silnikowego", "Замена моторного масла"),
        L("Wymiana filtra oleju", "Замена масляного фильтра"),
        L("Kontrola zawieszenia gratis przy oleju", "Проверка подвески бесплатно"),
        L("Dobór oleju i filtra po VIN", "Подбор масла и фильтра по VIN"),
      ],
    },
    education: [
      {
        title: L("Wymiana oleju w Warszawie Włochy", "Замена масла в Włochy"),
        body: L(
          "W BESS MOTORS robocizna wymiany oleju i filtra to 80 zł z kodem BessMotors. Materiały (olej, filtr) dobieramy pod VIN i rozliczamy osobno — bez zgadywania „uniwersalnego” oleju.",
          "Работа 80 zł по коду BessMotors. Масло и фильтр по VIN отдельно."
        ),
      },
      {
        title: L("Kiedy wymieniać olej?", "Когда менять масло?"),
        body: L(
          "Według interwału producenta lub wcześniej przy krótkich trasach miejskich, turbodieslach i autach z DPF. Po zakupie używanego auta warto zrobić wymianę od razu.",
          "По регламенту или раньше при городской езде."
        ),
      },
      {
        title: L("Objawy zużytego oleju", "Признаки старого масла"),
        body: L(
          "Głośniejsza praca silnika na zimno, ciemny olej na bagnecie, zapach spalenizny, lampka ciśnienia oleju.",
          "Шум на холодную, тёмное масло, лампа давления."
        ),
      },
      {
        title: L("Czas i koszt", "Срок и цена"),
        body: L(
          "Ok. 45–60 min. Robocizna 80 zł + olej i filtr. Kontrola zawieszenia gratis wyłącznie przy pakiecie z wymianą oleju.",
          "~1 час. Работа 80 zł + материалы."
        ),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy 80 zł obejmuje olej?", "80 zł включает масло?"),
        a: L(
          "Nie — 80 zł to robocizna. Olej i filtr płatne osobno po doborze VIN.",
          "Нет — 80 zł только работа."
        ),
      },
      {
        q: L("Czy zawieszenie jest zawsze gratis?", "Подвеска всегда бесплатно?"),
        a: L(
          "Kontrola zawieszenia jest gratis tylko razem z wymianą oleju w promocji — nie jako osobna usługa.",
          "Бесплатно только вместе с заменой масла."
        ),
      },
    ],
  },

  "serwis-klimatyzacji-warszawa": {
    bookServiceId: "acRefill",
    contentServiceId: "acRefill",
    faqDuration: L(
      "Nabijanie i podstawowy serwis klimy zwykle ok. 1 godziny.",
      "Заправка обычно около 1 часа."
    ),
    price: {
      fromZl: acRechargeFromPln(),
      priceFrom: true,
      materialsExtra: true,
      note: L(
        `Od ${acRechargeFromPln()} zł (podłączenie + 100 g R134a). Ilość czynnika zależy od modelu. R1234yf według cennika.`,
        `От ${acRechargeFromPln()} zł.`
      ),
      includes: [
        L("Podłączenie stacji i próżnia", "Подключение и вакуум"),
        L("Napełnianie R134a lub R1234yf", "Заправка R134a / R1234yf"),
        L("Kontrola szczelności i ciśnienia", "Проверка герметичности"),
        L("Odgrzybianie opcjonalnie", "Антигрибок опционально"),
      ],
    },
    education: [
      {
        title: L("Serwis klimatyzacji w Warszawie", "Сервис кондиционера в Варшаве"),
        body: L(
          "Nabijamy układy R134a i R1234yf, robimy próżnię i ocenę szczelności. Warsztat we Włochach — Aleja Krakowska 48/52.",
          "Заправка R134a/R1234yf, вакуум, герметичность. Włochy."
        ),
      },
      {
        title: L("Kiedy serwisować klimę?", "Когда обслуживать?"),
        body: L(
          "Słabe chłodzenie, nieprzyjemny zapach, hałas sprężarki albo przed sezonem letnim — lepiej sprawdzić czynnik i szczelność wcześniej.",
          "Слабый холод, запах, шум компрессора."
        ),
      },
      {
        title: L("Objawy usterek", "Симптомы"),
        body: L(
          "Ciepłe powietrze mimo włączonej A/C, tłusty film na szybach, wycieki, błąd czujnika ciśnienia, zabrudzony parownik (zapach).",
          "Тёплый воздух, запах, утечки."
        ),
      },
      {
        title: L("Czas i cena", "Срок и цена"),
        body: L(
          `Zwykle ok. 1 h. Orientacyjnie od ${acRechargeFromPln()} zł. Przy nieszczelności najpierw diagnostyka i wycena naprawy.`,
          `Около 1 ч, от ${acRechargeFromPln()} zł.`
        ),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy nabijacie R1234yf?", "Заправляете R1234yf?"),
        a: L(
          "Tak — R134a i R1234yf. Typ czynnika sprawdzamy po modelu / naklejce pod maską.",
          "Да — оба типа фреона."
        ),
      },
    ],
  },

  "hamulce-warszawa": {
    bookServiceId: "brakePads",
    contentServiceId: "brakePads",
    faqDuration: L(
      "Wymiana klocków zwykle 1–2 godziny na oś.",
      "Замена колодок обычно 1–2 часа на ось."
    ),
    price: {
      fromZl: 100,
      compareAtZl: 120,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Robocizna klocków przód od 100 zł (kod BessMotors). Tarcze + klocki według cennika. Części osobno po akceptacji.",
        "Работа передних колодок от 100 zł. Детали отдельно."
      ),
      includes: [
        L("Ocena grubości klocków i tarcz", "Оценка колодок и дисков"),
        L("Wymiana według wyceny", "Замена по смете"),
        L("Kontrola przewodów i płynu", "Проверка трубок и жидкости"),
        L("Jazda próbna", "Тест-драйв"),
      ],
    },
    education: [
      {
        title: L("Hamulce w BESS MOTORS Warszawa", "Тормоза в BESS MOTORS"),
        body: L(
          "Wymieniamy klocki i tarcze przód/tył. Robocizna klocków przód od 100 zł z kodem BessMotors — części dobieramy po VIN.",
          "Колодки и диски. Работа от 100 zł по коду BessMotors."
        ),
      },
      {
        title: L("Kiedy wymieniać?", "Когда менять?"),
        body: L(
          "Pisk, metaliczny dźwięk, dłuższa droga hamowania, wibracje na pedale, kontrolka zużycia klocków.",
          "Скрип, металлический звук, вибрации, увеличенный путь торможения."
        ),
      },
      {
        title: L("Objawy zużycia", "Симптомы износа"),
        body: L(
          "Piszczenie przy hamowaniu, auto ściąga w bok, pulsowanie kierownicy przy mocnym hamowaniu (tarcze).",
          "Скрип, увод в сторону, биение руля."
        ),
      },
      {
        title: L("Czas i koszt", "Срок и цена"),
        body: L(
          "1–2 h na oś. Robocizna od 100 zł + części. Przed startem pokazujemy stan tarcz i proponujemy zakres.",
          "1–2 ч на ось. Работа от 100 zł + детали."
        ),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy zawsze trzeba wymieniać tarcze z klockami?", "Всегда менять диски с колодками?"),
        a: L(
          "Nie zawsze. Mierzymy grubość i bicie. Jeśli tarcze są w normie — wymieniamy same klocki.",
          "Не всегда — меряем толщину и биение."
        ),
      },
    ],
  },

  "naprawa-zawieszenia-warszawa": {
    bookServiceId: "suspension",
    contentServiceId: "suspension",
    faqDuration: L(
      "Diagnostyka zawieszenia ok. 30–40 min. Naprawa — zależnie od zakresu.",
      "Диагностика ~30–40 мин."
    ),
    price: {
      fromZl: 150,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Diagnostyka zawieszenia według cennika. Naprawa: wycena indywidualna po oględzinach. Gratis kontrola tylko przy pakiecie wymiany oleju.",
        "Диагностика по прайсу. Ремонт — индивидуальная смета."
      ),
      includes: [
        L("Kontrola luzów i amortyzatorów", "Проверка люфтов и амортизаторов"),
        L("Ocena wahaczy i łączników", "Оценка рычагов и стоек"),
        L("Wycena przed naprawą", "Смета до ремонта"),
        L("Montaż części po akceptacji", "Монтаж после согласования"),
      ],
    },
    education: [
      {
        title: L("Naprawa zawieszenia Warszawa", "Ремонт подвески"),
        body: L(
          "Diagnozujemy stuki, luzy i nierówne zużycie opon. Po kontroli dostajesz listę elementów do wymiany z wyceną — bez niespodzianek przy kasie.",
          "Диагностика стуков и люфтов со сметой до ремонта."
        ),
      },
      {
        title: L("Kiedy jechać na zawieszenie?", "Когда ехать"),
        body: L(
          "Stuki na nierównościach, „pływanie” auta, ściąganie, szybkie zużycie opon, luźna kierownica.",
          "Стуки, увод, износ шин."
        ),
      },
      {
        title: L("Objawy", "Симптомы"),
        body: L(
          "Kłapanie z przodu/tyłu, pukanie przy skręcie, wyciek z amortyzatora, nierówny bieżnik.",
          "Стуки при повороте, течь амортизатора."
        ),
      },
      {
        title: L("Czas i koszt", "Срок и цена"),
        body: L(
          "Diagnostyka 30–40 min. Naprawa: wycena indywidualna. Przy wymianie oleju kontrola zawieszenia jest gratis w pakiecie promocji.",
          "Диагностика 30–40 мин. Ремонт — смета."
        ),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy robicie geometrię po zawieszeniu?", "Делаете геометрию после подвески?"),
        a: L(
          "Po wymianie wahaczy lub elementów wpływających na kąty — zalecamy geometrię. Możesz umówić ją u nas osobno.",
          "После рычагов рекомендуем геометрию."
        ),
      },
    ],
  },

  "wymiana-oleju-skrzynia-automatyczna-warszawa": {
    bookServiceId: "transmission",
    contentServiceId: "transmission",
    faqDuration: L(
      "Wymiana ATF / oleju skrzyni zwykle kilka godzin — zależnie od procedury producenta.",
      "Замена ATF обычно несколько часов."
    ),
    price: {
      fromZl: getPriceItem("gearbox_oil_auto")?.basePrice ?? 500,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Wycena indywidualna: robocizna + olej ATF/DSG + filtr gdy wymagany. Dobór po VIN / kodzie skrzyni.",
        "Индивидуальная смета: работа + ATF + фильтр."
      ),
      includes: [
        L("Identyfikacja skrzyni i procedury", "Идентификация КПП и процедуры"),
        L("Wymiana oleju według zaleceń", "Замена масла по регламенту"),
        L("Wymiana filtra gdy przewidziana", "Фильтр при необходимости"),
        L("Kontrola poziomu i jazda próbna", "Уровень и тест"),
      ],
    },
    education: [
      {
        title: L("Olej w automacie — Warszawa", "Масло АКПП — Варшава"),
        body: L(
          "Wymieniamy olej w skrzyniach automatycznych i robotyzowanych (w tym DSG) według procedury. Zły olej lub „dolewka na ślepo” szkodzi — dobieramy ATF po VIN.",
          "Замена ATF/DSG по процедуре и VIN."
        ),
      },
      {
        title: L("Kiedy wymieniać?", "Когда менять?"),
        body: L(
          "Według interwału producenta, przy szarpaniu, opóźnionej zmianie biegów, przegrzewaniu lub po zakupie auta bez historii serwisowej skrzyni.",
          "По регламенту, при рывках или перегреве."
        ),
      },
      {
        title: L("Objawy", "Симптомы"),
        body: L(
          "Szarpanie przy ruszaniu, poślizg, hałas, tryb awaryjny skrzyni, ciemny/spalony zapach oleju.",
          "Рывки, пробуксовка, аварийный режим, запах гари."
        ),
      },
      {
        title: L("Czas i koszt", "Срок и цена"),
        body: L(
          "Zwykle kilka godzin. Koszt: wycena indywidualna (robocizna od ok. 500 zł + olej i filtr). Potwierdzamy przed startem.",
          "Несколько часов. Индивидуальная смета."
        ),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy to pełna wymiana dynamiczna?", "Это полная динамическая замена?"),
        a: L(
          "Zakres (częściowa / pełna / z filtrem) ustalamy po typie skrzyni i zaleceniach. Nie każda skrzynia wymaga płukania dynamicznego.",
          "Объём зависит от типа КПП."
        ),
      },
    ],
  },
};

export const EXTRA_SEO_SERVICE_PROFILES: Record<string, SlugLandingProfile> = {
  ...EXTRA_SEO_SERVICE_PROFILES_BATCH1,
  ...EXTRA_SEO_SERVICE_PROFILES_BATCH2,
};

const EXTRA_SEO_RELATED_BATCH1: Record<string, string[]> = {
  "wymiana-rozrzadu-warszawa": [
    "silnik",
    "wymiana-oleju-warszawa",
    "diagnostyka-komputerowa-warszawa",
    "mechanik-warszawa-wlochy",
  ],
  "wymiana-sprzegla-warszawa": [
    "wymiana-oleju-skrzynia-automatyczna-warszawa",
    "diagnostyka-komputerowa-warszawa",
    "silnik",
    "mechanik-warszawa-wlochy",
  ],
  "mechanik-warszawa-wlochy": [
    "wymiana-oleju-warszawa",
    "diagnostyka-komputerowa-warszawa",
    "hamulce-warszawa",
    "serwis-klimatyzacji-warszawa",
  ],
  "diagnostyka-komputerowa-warszawa": [
    "mechanik-warszawa-wlochy",
    "silnik",
    "elektryka",
    "wymiana-oleju-warszawa",
  ],
  "wymiana-oleju-warszawa": [
    "naprawa-zawieszenia-warszawa",
    "diagnostyka-komputerowa-warszawa",
    "hamulce-warszawa",
    "mechanik-warszawa-wlochy",
  ],
  "serwis-klimatyzacji-warszawa": [
    "naprawa-klimatyzacji",
    "diagnostyka-komputerowa-warszawa",
    "wymiana-oleju-warszawa",
    "mechanik-warszawa-wlochy",
  ],
  "hamulce-warszawa": [
    "naprawa-zawieszenia-warszawa",
    "diagnostyka-komputerowa-warszawa",
    "geometria",
    "mechanik-warszawa-wlochy",
  ],
  "naprawa-zawieszenia-warszawa": [
    "hamulce-warszawa",
    "geometria",
    "wymiana-oleju-warszawa",
    "mechanik-warszawa-wlochy",
  ],
  "wymiana-oleju-skrzynia-automatyczna-warszawa": [
    "wymiana-sprzegla-warszawa",
    "diagnostyka-komputerowa-warszawa",
    "wymiana-oleju-warszawa",
    "mechanik-warszawa-wlochy",
  ],
};

export const EXTRA_SEO_RELATED: Record<string, string[]> = {
  ...EXTRA_SEO_RELATED_BATCH1,
  ...EXTRA_SEO_RELATED_PARENT_UPDATES,
  ...EXTRA_SEO_RELATED_BATCH2,
};
