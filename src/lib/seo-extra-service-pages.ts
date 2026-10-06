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

const L = (pl: string, ru: string, en?: string, uk?: string): LocalizedText => ({
  pl,
  ru,
  en,
  uk,
});

const WHY_BESS_EDU = {
  title: L("Dlaczego BESS MOTORS", "Почему BESS MOTORS", "Why BESS MOTORS", "Чому BESS MOTORS"),
  body: L("Wycena przed naprawą, części dobierane po VIN, kontakt podczas prac i przejrzyste rozliczenie. Warsztat przy Alei Krakowskiej 48/52 (Warszawa Włochy) — blisko Okęcia.", "Смета до ремонта, детали по VIN, связь во время работ и прозрачный расчёт. Сервис на Aleja Krakowska 48/52 (Warszawa Włochy).", "Quote before repair, parts matched by VIN, updates during the job and clear billing. Workshop at Aleja Krakowska 48/52 (Warsaw Włochy) — near Okęcie.", "Кошторис до ремонту, деталі за VIN, зв’язок під час робіт і прозорий розрахунок. Сервіс на Aleja Krakowska 48/52 (Warszawa Włochy) — поруч з Okęcie."),
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
    faqDuration: L("Wymiana rozrządu zwykle 1–2 dni robocze — zależnie od modelu i dostępności części.", "Замена ГРМ обычно 1–2 рабочих дня — зависит от модели и запчастей.", "Replacement of the timing usually 1–2 working days — depending on the model and the availability of parts.", "Заміна ГРМ зазвичай 1–2 рабочих дня — зависит от модели і запчастей."),
    price: {
      fromZl: getPriceItem("timing_belt")?.basePrice ?? 800,
      priceFrom: true,
      materialsExtra: true,
      note: L("Orientacyjna robocizna — dokładna wycena po modelu i zakresie (pasek/łańcuch, pompa wody, rolki). Części osobno.", "Ориентировочная работа — точная смета по модели. Запчасти отдельно.", "Indicative work — accurate valuation by model and range (belt/chain, water pump, rollers). Parts separately.", "Ориентировочная робота — точная кошторис по модели. Запчасти отдельно."),
      includes: [
        L("Diagnostyka stanu rozrządu", "Диагностика ГРМ", "Diagnosis of timing condition", "Діагностика ГРМ"),
        L("Wymiana paska lub łańcucha według zaleceń", "Замена ремня/цепи по регламенту", "Replacing the belt or chain as recommended", "Заміна ремня/цепи по регламенту"),
        L("Kontrola pomp i napinaczy", "Проверка помпы и натяжителей", "Inspection of pumps and tensioners", "Перевірка насоса та натягувачів"),
        L("Wycena przed rozpoczęciem prac", "Смета до начала работ", "Pricing before the start of work", "Кошторис до начала работ"),
      ],
    },
    education: [
      {
        title: L("Kiedy wymieniać rozrząd?", "Когда міняти ГРМ?", "When to change the timing?", "Коли міняти ГРМ?"),
        body: L("Według przebiegu lub wieku z instrukcji, przy hałasie łańcucha, wycieku z okładzin albo po zakupie używanego auta bez historii serwisowej. Nie czekaj na zerwanie — skutki bywają kosztowne.", "По регламенту пробега/срока, при шуме цепи или без истории обслуживания.", "According to the mileage or age from the manual, with the noise of the chain, leakage from the cladding or after the purchase of a used car without a service history. Don't wait to break up — the consequences can be costly.", "По регламенту пробега/срока, при шуме цепи або без истории обслуживания."),
      },
      {
        title: L("Objawy problemów z rozrządem", "Симптомы проблем с ГРМ", "Symptoms of timing problems", "Симптоми проблем з ГРМ"),
        body: L("Metaliczny hałas z przodu silnika, nierówna praca, Check Engine związany z pozycją wałków, wyciek oleju w okolicy pokrywy rozrządu.", "Металлический шум спереди двигателя, нестабильная работа, Check Engine.", "Metallic noise at the front of the engine, uneven operation, Check Engine related to the position of the rollers, oil leakage in the vicinity of the camshaft cover.", "Металлический шум спереди двигуня, нестабильная робота, Check Engine."),
      },
      {
        title: L("Co wchodzi w usługę", "Что входит", "What's included in the service", "Що входит"),
        body: L("Ocena stanu, dobór kompletu (pasek/łańcuch, rolki, napinacz, często pompa wody), wymiana według procedury producenta i kontrola po montażu.", "Оценка, подбор комплекта, замена по процедуре и контроль.", "Condition assessment, selection of the set (belt/chain, rollers, tensioner, often water pump), replacement according to the manufacturer's procedure and inspection after assembly.", "Оценка, подбор комплекта, заміна по процедуре і контроль."),
      },
      {
        title: L("Czas i koszt", "Срок и стоимость", "Time and cost", "Срок і вартість"),
        body: L("Czas: zwykle 1–2 dni. Koszt: wycena indywidualna — robocizna od ok. 800 zł + części. Potwierdzamy zakres przed startem.", "Срок 1–2 дня. Стоимость — индивидуальная смета.", "Time: usually 1–2 days. Cost: individual valuation — labor from approx. PLN 800 + parts. We confirm the range before the start.", "Срок 1–2 дня. Стоимость — индивидуальная кошторис."),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy wymieniacie też pompę wody przy rozrządzie?", "Меняете ли помпу вместе с ГРМ?", "Do you also replace the timing water pump?", "Меняете ли помпу вместе с ГРМ?"),
        a: L("Często tak — gdy jest w napędzie rozrządu lub blisko końca resursu. Proponujemy to w wycenie, decyzja należy do Ciebie.", "Часто да — предлагаем в смете, решение за вами.", "Often yes — when it is in the timing drive or near the end of the service life. We offer it in the valuation, the decision is yours.", "Часто да — пропонуємо в смете, решение за вами."),
      },
      {
        q: L("Pasek czy łańcuch — jak sprawdzić u mnie?", "Ремень или цепь?", "Belt or chain — how to check with me?", "Ремень або цепь?"),
        a: L("Zależy od silnika. Po VIN lub modelu sprawdzamy konstrukcję i zalecany interwał. Zadzwoń lub wyślij VIN do wyceny.", "Зависит от двигателя — проверим по VIN.", "It depends on the engine. After the Vin or model, we check the design and the recommended interval. Call or send a Vin for a quote.", "Зависит от двигуня — проверим по VIN."),
      },
    ],
  },

  "wymiana-sprzegla-warszawa": {
    bookServiceId: "clutch",
    contentServiceId: "clutch",
    faqDuration: L("Wymiana sprzęgła zwykle 1–2 dni — zależnie od napędu i dostępności kompletu.", "Замена сцепления обычно 1–2 дня.", "Replacement of the clutch usually 1–2 days — depending on the drive and the availability of the set.", "Заміна сцепления зазвичай 1–2 дня."),
    price: {
      fromZl: getPriceItem("clutch")?.basePrice ?? 1200,
      priceFrom: true,
      materialsExtra: true,
      note: L("Wycena indywidualna: robocizna + komplet sprzęgła (i dwumasa, jeśli wymagana). Potwierdzamy przed demontażem.", "Индивидуальная смета: работа + комплект.", "Individual quote: labor + clutch set (and dual mass if required). Confirm before disassembly.", "Индивидуальная кошторис: робота + комплект."),
      includes: [
        L("Diagnostyka objawów sprzęgła", "Диагностика сцепления", "Diagnosis of clutch symptoms", "Діагностика сцепления"),
        L("Wymiana kompletu według wyceny", "Замена комплекта по смете", "Replacement of the set according to the valuation", "Заміна комплекта по смете"),
        L("Kontrola łożyska i dwumasy gdy potrzeba", "Проверка подшипника и маховика", "Bearing and bimetallic inspection when needed", "Проверка подшипника і маховика"),
        L("Jazda próbna po montażu", "Тест после сборки", "Test drive after assembly", "Тест після сборки"),
      ],
    },
    education: [
      {
        title: L("Kiedy potrzebna wymiana sprzęgła?", "Когда міняти зчеплення?", "When do I need to change the clutch?", "Коли міняти зчеплення?"),
        body: L("Gdy pedał pracuje nietypowo, biegi wchodzą ciężko, auto szarpie przy ruszaniu albo obroty rosną bez przyspieszenia (ślizganie).", "Тяжёлое включение передач, рывки, пробуксовка.", "When the pedal works atypically, the gears enter heavily, the car jerks when starting or the rpm increases without acceleration (sliding).", "Зачеплення важкої передачі, ривки, прослизання."),
      },
      {
        title: L("Typowe objawy", "Типичные симптомы", "Typical Symptoms", "Типові симптоми"),
        body: L("Ślizganie pod obciążeniem, wibracje przy ruszaniu, hałas łożyska wyciskowego, zapach spalenizny po jeździe miejskiej.", "Пробуксовка, вибрации, запах гари.", "Sliding under load, vibration when starting off, noise of the release bearing, smell of burning after urban driving.", "Пробуксовка, вибрации, запах гари."),
      },
      {
        title: L("Zakres usługi", "Объём услуги", "Scope of services  ", "Обсяг послуг"),
        body: L("Diagnostyka, demontaż skrzyni, wymiana tarczy/docisku/łożyska (komplet), ocena koła zamachowego, montaż i regulacja.", "Диагностика, снятие КПП, замена комплекта, сборка.", "Diagnostics, box disassembly, disc/clamp/bearing replacement (set), flywheel evaluation, assembly and adjustment.", "Діагностика, снятие КПП, заміна комплекта, сборка."),
      },
      {
        title: L("Czas i cena", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Orientacyjnie 1–2 dni. Cena: wycena indywidualna (robocizna + części). Dwumasa wyceniamy osobno, jeśli jest uszkodzona.", "1–2 дня. Индивидуальная смета.", "Approximately 1–2 days. Price: individual valuation (labor + parts). Dumas are valued separately if damaged.", "1–2 дня. Индивидуальная кошторис."),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy zawsze trzeba wymieniać dwumasę?", "Всегда ли менять двухмассовый маховик?", "Is it always necessary to replace the double mass?", "Ви завжди міняєте двомасний маховик?"),
        a: L("Nie. Oceniamy stan przy demontażu i proponujemy wymianę tylko gdy jest luz, hałas lub zużycie poza normą.", "Нет — только при износе или люфте.", "No. We assess the condition during disassembly and propose replacement only when there is play, noise or wear outside the norm.", "Ні — только при износе або люфте."),
      },
    ],
  },

  "mechanik-warszawa-wlochy": {
    bookServiceId: "diagnostic",
    contentServiceId: "diagnostic",
    faqDuration: L("Krótkie usługi (olej, diagnostyka) często tego samego dnia — gdy jest wolne stanowisko.", "Короткие услуги часто в тот же день.", "Short services (oil, diagnostics) often on the same day — when there is a vacancy.", "Короткие услуги часто в тот же день."),
    education: [
      {
        title: L("Mechanik przy Alei Krakowskiej", "Механик на Aleja Krakowska", "Mechanic at Aleja Krakowska", "Механик на Aleja Krakowska"),
        body: L("BESS MOTORS to warsztat na Alei Krakowskiej 48/52 w dzielnicy Włochy — dogodnie z Okęcia, Ochoty i południowej Warszawy. Parking przy serwisie.", "Сервис на Aleja Krakowska 48/52, Włochy — удобно от Okęcie и юга Варшавы.", "BESS MOTORS is a workshop on Aleja Krakowska 48/52 in the Włochy district — conveniently from Okęcie, Ochota and southern Warsaw. Service car park.", "Сервіс на Aleja Krakowska 48/52, Włochy — зручний з Окенце та півдня Варшави."),
      },
      {
        title: L("Jakie naprawy wykonujemy", "Какие работы делаем", "What repairs we do", "Яку роботу ми виконуємо"),
        body: L("Diagnostyka komputerowa, wymiana oleju i filtrów, hamulce, klimatyzacja, zawieszenie, rozrząd, sprzęgło, opony i naprawy bieżące. Zakres ustalamy po oględzinach.", "Диагностика, масло, тормоза, кондиционер, подвеска, ГРМ, сцепление, шины.", "Computer diagnostics, oil and filter replacement, brakes, air conditioning, suspension, timing, clutch, tires and ongoing repairs. The scope is determined after visual inspection.", "Діагностика, масло, гальма, кондиціонер, підвіска, ГРМ, зчеплення, шини."),
      },
      {
        title: L("Kiedy warto przyjechać", "Когда стоит приехать", "When to arrive", "Коли стоит приехать"),
        body: L("Check Engine, stuki, słabe hamowanie, wycieki, problemy z klimą albo zbliżający się przegląd — lepiej sprawdzić wcześniej niż ryzykować awarię w trasie.", "Check Engine, стуки, слабые тормоза, утечки, проблемы с кондиционером.", "Check Engine, knocks, poor braking, leaks, climate problems or an upcoming overhaul — it's better to check sooner than risk a breakdown on the road.", "Перевірте двигун, стуки, слабкі гальма, витоки, проблеми з кондиціонером."),
      },
      {
        title: L("Jak umówić wizytę", "Как записаться", "How to make an appointment", "Как записаться"),
        body: L("Zadzwoń +48 791 257 229, umów online albo wyślij VIN z opisem usterki. Godziny: Pn–Sb 8:00–18:00.", "Телефон +48 791 257 229, онлайн-запись или VIN с описанием.", "Call +48 791 257 229, make online agreements or send the VIN with a description of the defect. Hours: Mon-Sat 8:00–18:00.", "Телефон +48 791 257 229, онлайн-запис або VIN с описанием."),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy przyjmujecie auta z innych dzielnic?", "Принимаете авто из других районов?", "Do you accept cars from other neighborhoods?", "Принимаете авто из других районов?"),
        a: L("Tak — lokalizacja we Włochach jest wygodna także z Ursynowa, Mokotowa, Ochoty i z kierunku lotniska.", "Да — удобно с юга Варшавы и от аэропорта.", "Yes — the location in Italy is also convenient from Ursynów, Mokotów, Ochota and from the direction of the airport.", "Так — зручно з півдня Варшави та від аеропорту."),
      },
    ],
  },

  "diagnostyka-komputerowa-warszawa": {
    bookServiceId: "diagnostic",
    contentServiceId: "diagnostic",
    faqDuration: L("Pełna diagnostyka komputerowa zwykle 30–60 minut.", "Полная диагностика обычно 30–60 минут.", "Full computer diagnostics usually 30–60 minutes.", "Полная діагностика зазвичай 30–60 минут."),
    price: {
      fromZl: getPriceItem("computer_diag")?.basePrice ?? 150,
      priceFrom: true,
      materialsExtra: false,
      note: L("Orientacyjnie od 150 zł — zakres zależy od objawów i systemów do sprawdzenia.", "Ориентировочно от 150 zł.", "Approximately from PLN 150 — the range depends on the symptoms and systems to be checked.", "Ориентировочно от 150 zł."),
      includes: [
        L("Odczyt kodów OBD / producenta", "Считывание кодов OBD", "Reading OBD / Manufacturer Codes", "Зчитування кодів OBD"),
        L("Analiza parametrów live", "Анализ live-параметров", "Analysis of live parameters", "Анализ live-параметров"),
        L("Wskazanie przyczyn i priorytetów", "Причины и приоритеты", "Indication of causes and priorities", "Причини та пріоритети"),
        L("Orientacyjna wycena napraw", "Ориентировочная смета", "Indicative valuation of repairs", "Ориентировочная кошторис"),
      ],
    },
    education: [
      {
        title: L("Kiedy robić diagnostykę?", "Когда делать диагностику?", "When to do diagnostics?", "Коли делать диагностику?"),
        body: L("Po zaświeceniu Check Engine, przy spadku mocy, nierównej pracy, problemach z DPF/AdBlue, klimą lub elektroniką — zanim wymienisz części „na ślepo”.", "Check Engine, потеря мощности, электроника — до замены деталей вслепую.", "When the Check Engine is lit, power drops, uneven operation, problems with DPF/AdBlue, climate or electronics — before you replace the parts \"blindly\".", "Перевірте двигун, втрату потужності, електроніку — до тих пір, поки деталі не будуть замінені наосліп."),
      },
      {
        title: L("Objawy, które warto zbadać", "Симптомы", "Symptoms worth investigating", "Симптоми"),
        body: L("Lampka silnika, szarpanie, trudny rozruch, błędy ABS/ESP, niespodziewane przejście w tryb awaryjny.", "Лампа двигателя, рывки, ABS/ESP, аварийный режим.", "Engine light, jerking, hard start, ABS/ESP faults, unexpected failover.", "Лампа двигуна, ривки, ABS/ESP, аварійний режим."),
      },
      {
        title: L("Co dostajesz po diagnostyce", "Что получаете", "What you get after the diagnosis", "Що получаете"),
        body: L("Listę kodów z wyjaśnieniem, rekomendowany zakres naprawy i orientacyjny koszt. Bez kasowania błędów „żeby znikła lampka” bez naprawy przyczyny.", "Список кодов с объяснением и ориентировочной сметой.", "List of codes with explanation, recommended scope of repair and approximate cost. Without deleting the errors \"so that the lamp disappears\" without repairing the cause.", "Перелік кодів з поясненням та орієнтовною оцінкою."),
      },
      {
        title: L("Czas i cena", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L("Zwykle 30–60 min. Cena od ok. 150 zł — potwierdzamy przy przyjęciu.", "30–60 мин, от ~150 zł.", "Usually 30–60 min. Price from approx. PLN 150 — confirmed at the reception.", "30–60 мин, от ~150 zł."),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy kasujecie błędy bez naprawy?", "Сбрасываете ошибки без ремонта?", "Do you delete errors without repair?", "Скидання помилок без виправлення?"),
        a: L("Kasowanie bez usunięcia przyczyny nic nie daje — lampka wraca. Najpierw diagnoza i wycena, potem naprawa.", "Сброс без устранения причины бесполезен.", "Deleting without removing the cause does not result in anything — the lamp returns. First diagnosis and valuation, then repair.", "Скидання без усунення причини марно."),
      },
    ],
  },

  "wymiana-oleju-warszawa": {
    bookServiceId: "oil",
    contentServiceId: "oil",
    faqDuration: L("Wymiana oleju + filtr zwykle ok. 45–60 minut.", "Замена масла ~45–60 минут.", "Oil change + filter usually approx. 45–60 minutes.", "Заміна оливи ~45–60 минут."),
    price: {
      fromZl: oilLabourPromoZl(),
      compareAtZl: oilLabourWasZl(),
      priceFrom: false,
      materialsExtra: true,
      note: L(
        `${oilLabourPromoZl()} zł robocizna (było ${oilLabourWasZl()} zł). Olej i filtr płatne osobno — dobór pod VIN. Przy wymianie oleju kontrola zawieszenia gratis.`,
        `${oilLabourPromoZl()} zł работа. Масло и фильтр отдельно. Подвеска бесплатно при замене масла.`,
        `${oilLabourPromoZl()} zł labour (was ${oilLabourWasZl()} zł). Oil and filter charged separately — matched by VIN. Free suspension check with oil change.`,
        `${oilLabourPromoZl()} zł робота (було ${oilLabourWasZl()} zł). Олива та фільтр окремо — підбір за VIN. Перевірка підвіски безкоштовно при заміні оливи.`
      ),
      includes: [
        L("Wymiana oleju silnikowego", "Замена моторного масла", "Replacement of engine oil", "Заміна моторного оливи"),
        L("Wymiana filtra oleju", "Замена масляного фильтра", "Oil filter replacement", "Заміна масляного фільтра"),
        L("Kontrola zawieszenia gratis przy oleju", "Проверка подвески бесплатно", "Free suspension control with oil", "Проверка підвіски бесплатно"),
        L("Dobór oleju i filtra po VIN", "Подбор масла и фильтра по VIN", "Selection of oil and filter after Vin", "Подбор оливи і фільтра по VIN"),
      ],
    },
    education: [
      {
        title: L("Wymiana oleju w Warszawie Włochy", "Замена масла в Włochy", "Oil change in Warsaw Italy", "Заміна оливи в Włochy"),
        body: L("W BESS MOTORS robocizna wymiany oleju i filtra to 80 zł z kodem BessMotors. Materiały (olej, filtr) dobieramy pod VIN i rozliczamy osobno — bez zgadywania „uniwersalnego” oleju.", "Работа 80 zł по коду BessMotors. Масло и фильтр по VIN отдельно.", "At BESS MOTORS, the labor of changing the oil and filter is PLN 80 with the BessMotors code. Materials (oil, filter) are selected under the Vin and settled separately — without guessing the \"universal\" oil.", "Робота 80 zł по коду BessMotors. Олива і фільтр по VIN отдельно."),
      },
      {
        title: L("Kiedy wymieniać olej?", "Когда міняти оливу?", "When to change the oil?", "Коли менять олива?"),
        body: L("Według interwału producenta lub wcześniej przy krótkich trasach miejskich, turbodieslach i autach z DPF. Po zakupie używanego auta warto zrobić wymianę od razu.", "По регламенту или раньше при городской езде.", "According to the manufacturer's interval or earlier for short urban routes, turbodiesels and cars with DPF. After buying a used car, it is worth replacing it right away.", "По регламенту або раньше при городской езде."),
      },
      {
        title: L("Objawy zużytego oleju", "Признаки старого масла", "Waste oil symptoms", "Признаки старого оливи"),
        body: L("Głośniejsza praca silnika na zimno, ciemny olej na bagnecie, zapach spalenizny, lampka ciśnienia oleju.", "Шум на холодную, тёмное масло, лампа давления.", "Louder cold engine operation, dark oil on the bayonet, burning smell, oil pressure lamp.", "Шум на холодній, темній олії, лампі тиску."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and cost", "Срок і ціна"),
        body: L("Ok. 45–60 min. Robocizna 80 zł + olej i filtr. Kontrola zawieszenia gratis wyłącznie przy pakiecie z wymianą oleju.", "~1 час. Работа 80 zł + материалы.", "Approx. 45–60 min. Labour PLN 80 + oil and filter. Suspension control free of charge only with the oil change package.", "~1 година. Робота 80 злотих + матеріали."),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy 80 zł obejmuje olej?", "80 zł включает масло?", "Does PLN 80 include oil?", "80 zł включает олива?"),
        a: L("Nie — 80 zł to robocizna. Olej i filtr płatne osobno po doborze VIN.", "Нет — 80 zł только работа.", "No — PLN 80 is labor. Oil and filter payable separately after Vin selection.", "Ні — 80 zł только робота."),
      },
      {
        q: L("Czy zawieszenie jest zawsze gratis?", "Подвеска всегда бесплатно?", "Is the suspension always free?", "Подвеска всегда бесплатно?"),
        a: L("Kontrola zawieszenia jest gratis tylko razem z wymianą oleju w promocji — nie jako osobna usługa.", "Бесплатно только вместе с заменой масла.", "Suspension control is free only with the oil change in the promotion — not as a separate service.", "Бесплатно только вместе с заменой оливи."),
      },
    ],
  },

  "serwis-klimatyzacji-warszawa": {
    bookServiceId: "acRefill",
    contentServiceId: "acRefill",
    faqDuration: L("Nabijanie i podstawowy serwis klimy zwykle ok. 1 godziny.", "Заправка обычно около 1 часа.", "Charging and basic climate service usually approx. 1 hour.", "Заправка зазвичай около 1 год."),
    price: {
      fromZl: acRechargeFromPln(),
      priceFrom: true,
      materialsExtra: true,
      note: L(
        `Od ${acRechargeFromPln()} zł (podłączenie + 100 g R134a). Ilość czynnika zależy od modelu. R1234yf według cennika.`,
        `От ${acRechargeFromPln()} zł.`,
        `From ${acRechargeFromPln()} zł (hook-up + 100 g R134a). Refrigerant amount depends on the model. R1234yf per price list.`,
        `Від ${acRechargeFromPln()} zł (підключення + 100 г R134a). Кількість фреону залежить від моделі. R1234yf за прайсом.`
      ),
      includes: [
        L("Podłączenie stacji i próżnia", "Подключение и вакуум", "Station connection and vacuum", "Подключение і вакуум"),
        L("Napełnianie R134a lub R1234yf", "Заправка R134a / R1234yf", "Filling R134a or R1234yf", "Заправка R134a / R1234yf"),
        L("Kontrola szczelności i ciśnienia", "Проверка герметичности", "Leak and pressure check", "Проверка герметичности"),
        L("Odgrzybianie opcjonalnie", "Антигрибок опционально", "Dehumidification optional", "Антигрибок опционально"),
      ],
    },
    education: [
      {
        title: L("Serwis klimatyzacji w Warszawie", "Сервис кондиционера в Варшаве", "Air conditioning service in Warsaw", "Сервис кондиционера у Варшаві"),
        body: L("Nabijamy układy R134a i R1234yf, robimy próżnię i ocenę szczelności. Warsztat we Włochach — Aleja Krakowska 48/52.", "Заправка R134a/R1234yf, вакуум, герметичность. Włochy.", "We charge the R134a and R1234yf systems, make a vacuum and assess the tightness. Workshop in Italy — Aleja Krakowska 48/52.", "Заправка R134a/R1234yf, вакуум, герметичность. Włochy."),
      },
      {
        title: L("Kiedy serwisować klimę?", "Когда обслуживать?", "When to service the air conditioner?", "Коли обслуживать?"),
        body: L("Słabe chłodzenie, nieprzyjemny zapach, hałas sprężarki albo przed sezonem letnim — lepiej sprawdzić czynnik i szczelność wcześniej.", "Слабый холод, запах, шум компрессора.", "Poor cooling, unpleasant smell, compressor noise or before the summer season — it is better to check the factor and tightness beforehand.", "Легкий холод, запах, шум компресора."),
      },
      {
        title: L("Objawy usterek", "Симптомы", "Symptoms of malfunctions", "Симптоми"),
        body: L("Ciepłe powietrze mimo włączonej A/C, tłusty film na szybach, wycieki, błąd czujnika ciśnienia, zabrudzony parownik (zapach).", "Тёплый воздух, запах, утечки.", "Warm air despite A/C on, greasy film on windows, leaks, pressure sensor fault, dirty evaporator (smell).", "Тепле повітря, запах, протікання."),
      },
      {
        title: L("Czas i cena", "Срок и цена", "Time and price", "Срок і ціна"),
        body: L(
          `Zwykle ok. 1 h. Orientacyjnie od ${acRechargeFromPln()} zł. Przy nieszczelności najpierw diagnostyka i wycena naprawy.`,
          `Около 1 ч, от ${acRechargeFromPln()} zł.`,
          `Usually about 1 hour. From about ${acRechargeFromPln()} zł. If there is a leak, we diagnose and quote repair first.`,
          `Зазвичай близько 1 год. Орієнтовно від ${acRechargeFromPln()} zł. При витоку спочатку діагностика та кошторис ремонту.`
        ),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy nabijacie R1234yf?", "Заправляете R1234yf?", "Do you charge R1234yf?", "Заправляете R1234yf?"),
        a: L("Tak — R134a i R1234yf. Typ czynnika sprawdzamy po modelu / naklejce pod maską.", "Да — оба типа фреона.", "Yes — R134a and R1234yf. The type of medium is checked by the model / sticker under the hood.", "Так — оба типа фреона."),
      },
    ],
  },

  "hamulce-warszawa": {
    bookServiceId: "brakePads",
    contentServiceId: "brakePads",
    faqDuration: L("Wymiana klocków zwykle 1–2 godziny na oś.", "Замена колодок обычно 1–2 часа на ось.", "Replacing the pads usually 1–2 hours per axle.", "Заміна колодок зазвичай 1–2 год на ось."),
    price: {
      fromZl: 100,
      compareAtZl: 120,
      priceFrom: true,
      materialsExtra: true,
      note: L("Robocizna klocków przód od 100 zł (kod BessMotors). Tarcze + klocki według cennika. Części osobno po akceptacji.", "Работа передних колодок от 100 zł. Детали отдельно.", "Work of pads front from PLN 100 (BessMotors code). Discs + blocks according to the price list. Parts separately after acceptance.", "Робота передних колодок от 100 zł. Детали отдельно."),
      includes: [
        L("Ocena grubości klocków i tarcz", "Оценка колодок и дисков", "Thickness assessment of pads and discs", "Оценка колодок і дисков"),
        L("Wymiana według wyceny", "Замена по смете", "Valuation Replacement", "Заміна по смете"),
        L("Kontrola przewodów i płynu", "Проверка трубок и жидкости", "Hose and Fluid Inspection", "Проверка трубок і жидкости"),
        L("Jazda próbna", "Тест-драйв", "Test Drive", "Тест-драйв"),
      ],
    },
    education: [
      {
        title: L("Hamulce w BESS MOTORS Warszawa", "Тормоза в BESS MOTORS", "Brakes at BESS MOTORS WARSAW", "Тормоза в BESS MOTORS"),
        body: L("Wymieniamy klocki i tarcze przód/tył. Robocizna klocków przód od 100 zł z kodem BessMotors — części dobieramy po VIN.", "Колодки и диски. Работа от 100 zł по коду BessMotors.", "Replace the pads and discs front/rear. The work of the front blocks from PLN 100 with the BessMotors code — parts are selected by Vin.", "Колодки і диски. Робота от 100 zł по коду BessMotors."),
      },
      {
        title: L("Kiedy wymieniać?", "Когда менять?", "When to replace?", "Коли менять?"),
        body: L("Pisk, metaliczny dźwięk, dłuższa droga hamowania, wibracje na pedale, kontrolka zużycia klocków.", "Скрип, металлический звук, вибрации, увеличенный путь торможения.", "Squeak, metallic sound, longer braking distance, pedal vibration, pad wear indicator light.", "Скрип, металевий звук, вібрації, збільшений шлях гальмування."),
      },
      {
        title: L("Objawy zużycia", "Симптомы износа", "Symptoms of wear", "Симптоми носіння"),
        body: L("Piszczenie przy hamowaniu, auto ściąga w bok, pulsowanie kierownicy przy mocnym hamowaniu (tarcze).", "Скрип, увод в сторону, биение руля.", "Squeaking when braking, the car pulls to the side, the steering wheel pulsates when braking hard (discs).", "Скрип, увод в сторону, биение руля."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and cost", "Срок і ціна"),
        body: L("1–2 h na oś. Robocizna od 100 zł + części. Przed startem pokazujemy stan tarcz i proponujemy zakres.", "1–2 ч на ось. Работа от 100 zł + детали.", "1–2 h per axle. Labour from PLN 100 + parts. Before the start, we show the condition of the discs and propose the range.", "1–2 ч на ось. Робота от 100 zł + детали."),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy zawsze trzeba wymieniać tarcze z klockami?", "Всегда менять диски с колодками?", "Do you always need to replace discs with blocks?", "Всегда менять диски с колодками?"),
        a: L("Nie zawsze. Mierzymy grubość i bicie. Jeśli tarcze są w normie — wymieniamy same klocki.", "Не всегда — меряем толщину и биение.", "Not always. We measure thickness and run-out. If the discs are normal — replace the blocks only.", "Не всегда — меряем толщину і биение."),
      },
    ],
  },

  "naprawa-zawieszenia-warszawa": {
    bookServiceId: "suspension",
    contentServiceId: "suspension",
    faqDuration: L("Diagnostyka zawieszenia ok. 30–40 min. Naprawa — zależnie od zakresu.", "Диагностика ~30–40 мин.", "Suspension diagnostics approx. 30–40 min. Repair — depending on the scope.", "Діагностика ~30–40 мин."),
    price: {
      fromZl: 150,
      priceFrom: true,
      materialsExtra: true,
      note: L("Diagnostyka zawieszenia według cennika. Naprawa: wycena indywidualna po oględzinach. Gratis kontrola tylko przy pakiecie wymiany oleju.", "Диагностика по прайсу. Ремонт — индивидуальная смета.", "Suspension diagnostics according to the price list. Repair: individual valuation after inspection. Free inspection only with the oil change package.", "Діагностика по прайсу. Ремонт — индивидуальная кошторис."),
      includes: [
        L("Kontrola luzów i amortyzatorów", "Проверка люфтов и амортизаторов", "Clearance and Shock Absorber Inspection", "Проверка люфтов і амортизаторов"),
        L("Ocena wahaczy i łączników", "Оценка рычагов и стоек", "Evaluation of rocker arms and connectors", "Оцінка важелів та стійок"),
        L("Wycena przed naprawą", "Смета до ремонта", "Pricing before repair", "Кошторис до ремонта"),
        L("Montaż części po akceptacji", "Монтаж после согласования", "Assembly of parts after approval", "Монтаж після согласования"),
      ],
    },
    education: [
      {
        title: L("Naprawa zawieszenia Warszawa", "Ремонт подвески", "Suspension repair Warsaw", "Ремонт підвіски"),
        body: L("Diagnozujemy stuki, luzy i nierówne zużycie opon. Po kontroli dostajesz listę elementów do wymiany z wyceną — bez niespodzianek przy kasie.", "Диагностика стуков и люфтов со сметой до ремонта.", "We diagnose knocks, clearances and uneven tyre wear. After the inspection, you get a list of items to be exchanged with a quote — no surprises at the checkout.", "Діагностика стуков і люфтов со сметой до ремонта."),
      },
      {
        title: L("Kiedy jechać na zawieszenie?", "Когда ехать", "When to go on suspension?", "Коли ехать"),
        body: L("Stuki na nierównościach, „pływanie” auta, ściąganie, szybkie zużycie opon, luźna kierownica.", "Стуки, увод, износ шин.", "Tapping on uneven surfaces, \"swimming\" of the car, pulling, fast tyre wear, loose steering wheel.", "Стуки, увод, износ шин."),
      },
      {
        title: L("Objawy", "Симптомы", "Indication", "Симптоми"),
        body: L("Kłapanie z przodu/tyłu, pukanie przy skręcie, wyciek z amortyzatora, nierówny bieżnik.", "Стуки при повороте, течь амортизатора.", "Flapping at the front/rear, knocking when turning, shock absorber leakage, uneven tread.", "Стуки при повороте, течь амортизатора."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and cost", "Срок і ціна"),
        body: L("Diagnostyka 30–40 min. Naprawa: wycena indywidualna. Przy wymianie oleju kontrola zawieszenia jest gratis w pakiecie promocji.", "Диагностика 30–40 мин. Ремонт — смета.", "Diagnostics 30–40 min. Repair: individual valuation. When changing the oil, the suspension check is free of charge in the promotional package.", "Діагностика 30–40 мин. Ремонт — кошторис."),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy robicie geometrię po zawieszeniu?", "Делаете геометрию после подвески?", "Do you do geometry after suspension?", "Делаете геометрию після підвіски?"),
        a: L("Po wymianie wahaczy lub elementów wpływających na kąty — zalecamy geometrię. Możesz umówić ją u nas osobno.", "После рычагов рекомендуем геометрию.", "After replacing the rockers or elements affecting the angles — we recommend geometry. You can book it with us separately.", "Після важелів ми рекомендуємо геометрію."),
      },
    ],
  },

  "wymiana-oleju-skrzynia-automatyczna-warszawa": {
    bookServiceId: "transmission",
    contentServiceId: "transmission",
    faqDuration: L("Wymiana ATF / oleju skrzyni zwykle kilka godzin — zależnie od procedury producenta.", "Замена ATF обычно несколько часов.", "Changing the ATF / oil of the crate usually takes a few hours — depending on the manufacturer's procedure.", "Заміна ATF зазвичай кілька годин."),
    price: {
      fromZl: getPriceItem("gearbox_oil_auto")?.basePrice ?? 500,
      priceFrom: true,
      materialsExtra: true,
      note: L("Wycena indywidualna: robocizna + olej ATF/DSG + filtr gdy wymagany. Dobór po VIN / kodzie skrzyni.", "Индивидуальная смета: работа + ATF + фильтр.", "Individual pricing: Labour + ATF/DSG oil + filter when required. Selection by Vin /box code.", "Индивидуальная кошторис: робота + ATF + фільтр."),
      includes: [
        L("Identyfikacja skrzyni i procedury", "Идентификация КПП и процедуры", "Chest identification and procedures", "Ідентифікація та процедури СЛР"),
        L("Wymiana oleju według zaleceń", "Замена масла по регламенту", "Changing the oil as recommended", "Заміна оливи по регламенту"),
        L("Wymiana filtra gdy przewidziana", "Фильтр при необходимости", "Replacing the filter when foreseen", "Фільтр при необходимости"),
        L("Kontrola poziomu i jazda próbna", "Уровень и тест", "Level control and test drive", "Уровень і тест"),
      ],
    },
    education: [
      {
        title: L("Olej w automacie — Warszawa", "Масло АКПП — Варшава", "Oil in a vending machine — Warsaw", "Олива АКПП — Варшава"),
        body: L("Wymieniamy olej w skrzyniach automatycznych i robotyzowanych (w tym DSG) według procedury. Zły olej lub „dolewka na ślepo” szkodzi — dobieramy ATF po VIN.", "Замена ATF/DSG по процедуре и VIN.", "We change the oil in automatic and robotized boxes (including DSG) according to the procedure. Bad oil or \"blind refill\" is harmful — we select ATF after Vin.", "Заміна ATF/DSG по процедуре і VIN."),
      },
      {
        title: L("Kiedy wymieniać?", "Когда менять?", "When to replace?", "Коли менять?"),
        body: L("Według interwału producenta, przy szarpaniu, opóźnionej zmianie biegów, przegrzewaniu lub po zakupie auta bez historii serwisowej skrzyni.", "По регламенту, при рывках или перегреве.", "According to the manufacturer's interval, when jerking, delayed shifting, overheating or after buying a car without a service history of the transmission.", "Згідно з правилами, у разі ривків або перегріву."),
      },
      {
        title: L("Objawy", "Симптомы", "Indication", "Симптоми"),
        body: L("Szarpanie przy ruszaniu, poślizg, hałas, tryb awaryjny skrzyni, ciemny/spalony zapach oleju.", "Рывки, пробуксовка, аварийный режим, запах гари.", "Starting jerking, slipping, noise, crate emergency mode, dark/burnt oil smell.", "Ривки, пробуксування, аварійний режим, запах гару."),
      },
      {
        title: L("Czas i koszt", "Срок и цена", "Time and cost", "Срок і ціна"),
        body: L("Zwykle kilka godzin. Koszt: wycena indywidualna (robocizna od ok. 500 zł + olej i filtr). Potwierdzamy przed startem.", "Несколько часов. Индивидуальная смета.", "Usually a few hours. Cost: individual valuation (labor from approx. PLN 500 + oil and filter). We confirm before the start.", "Несколько годин. Индивидуальная кошторис."),
      },
      WHY_BESS_EDU,
    ],
    faqExtra: [
      {
        q: L("Czy to pełna wymiana dynamiczna?", "Это полная динамическая замена?", "Is this a full dynamic exchange?", "Це полная динамическая заміна?"),
        a: L("Zakres (częściowa / pełna / z filtrem) ustalamy po typie skrzyni i zaleceniach. Nie każda skrzynia wymaga płukania dynamicznego.", "Объём зависит от типа КПП.", "The range (partial / full / with filter) is determined after the box type and recommendations. Not every crate requires dynamic flushing.", "Обсяг залежить від типу коробки передач."),
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
