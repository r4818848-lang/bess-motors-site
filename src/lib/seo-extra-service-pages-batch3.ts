/**
 * Extra SEO landings — batch 3 (TZ 2026-10-19 P1 gaps).
 * Only real offered services with distinct search intent.
 */
import type { SeoLandingPage } from "@/lib/seo-landing-pages";
import type { LocalizedText } from "@/lib/service-landing-content";
import type { SlugLandingProfile } from "@/lib/seo-landing-slug-profiles";
import { getPriceItem } from "@/lib/price-list";

const L = (pl: string, ru: string, en?: string, uk?: string): LocalizedText => ({
  pl,
  ru,
  en,
  uk,
});

export const EXTRA_SEO_SERVICE_PAGES_BATCH3: SeoLandingPage[] = [
  {
    slug: "czyszczenie-dpf-warszawa",
    title: "Czyszczenie DPF Warszawa",
    line1: "Diagnostyka i czyszczenie filtra DPF",
    line2: "Bez promocji wyłączania DPF OFF",
    metaTitle: "Czyszczenie DPF Warszawa Włochy | BESS MOTORS",
    metaDescription:
      "Czyszczenie i diagnostyka DPF Warszawa — ocena stanu filtra, legalna regeneracja/czyszczenie. BESS MOTORS Włochy. Wycena po diagnostyce.",
    serviceId: "diagnostic",
    icon: "Gauge",
  },
  {
    slug: "czyszczenie-egr-warszawa",
    title: "Czyszczenie EGR Warszawa",
    line1: "Zawór EGR — diagnostyka i czyszczenie",
    line2: "Objawy: błędy, dym, spadek mocy",
    metaTitle: "Czyszczenie EGR Warszawa | BESS MOTORS",
    metaDescription:
      "Czyszczenie zaworu EGR Warszawa — diagnostyka, demontaż/czyszczenie gdy uzasadnione. BESS MOTORS Włochy. Bez EGR OFF.",
    serviceId: "diagnostic",
    icon: "Gauge",
  },
  {
    slug: "diagnostyka-zawieszenia-warszawa",
    title: "Diagnostyka zawieszenia Warszawa",
    line1: "Kontrola amortyzatorów, tulei, luzów",
    line2: "Gratis przy wymianie oleju (kod BessMotors)",
    metaTitle: "Diagnostyka zawieszenia Warszawa Włochy | BESS MOTORS",
    metaDescription:
      "Diagnostyka zawieszenia Warszawa — ocena amortyzatorów, wahaczy, łożysk. Przy wymianie oleju diagnostyka zawieszenia gratis (kod BessMotors).",
    serviceId: "diagnostic",
    icon: "Gauge",
  },
  {
    slug: "wymiana-akumulatora-warszawa",
    title: "Wymiana akumulatora Warszawa",
    line1: "Test ładowania i montaż akumulatora",
    line2: "Dobór pojemności do modelu",
    metaTitle: "Wymiana akumulatora Warszawa | BESS MOTORS",
    metaDescription:
      "Wymiana akumulatora Warszawa Włochy — test układu ładowania, dobór i montaż. BESS MOTORS, Aleja Krakowska 48/52. Zapytaj o wycenę.",
    serviceId: "electric",
    icon: "Zap",
  },
  {
    slug: "odgrzybianie-klimatyzacji-warszawa",
    title: "Odgrzybianie klimatyzacji Warszawa",
    line1: "Dezynfekcja układu i nawiewów",
    line2: "Po nieprzyjemnym zapachu z klimy",
    metaTitle: "Odgrzybianie klimatyzacji Warszawa | BESS MOTORS",
    metaDescription:
      "Odgrzybianie klimatyzacji samochodowej Warszawa — dezynfekcja układu. BESS MOTORS Włochy. Można połączyć z nabijaniem klimy.",
    serviceId: "acRepair",
    icon: "Wind",
  },
];

export const EXTRA_SEO_SERVICE_PROFILES_BATCH3: Record<string, SlugLandingProfile> = {
  "czyszczenie-dpf-warszawa": {
    bookServiceId: "diagnostic",
    contentServiceId: "diagnostic",
    faqDuration: L(
      "Diagnostyka zwykle tego samego dnia; czas czyszczenia zależy od metody i stanu filtra — potwierdzimy po ocenie.",
      "Диагностика обычно в день визита; время очистки зависит от состояния фильтра.",
      "Diagnostics usually same day; cleaning time depends on method and filter condition.",
      "Діагностика зазвичай того ж дня; час очищення залежить від стану фільтра."
    ),
    price: {
      fromZl: getPriceItem("dpf_clean")?.basePrice ?? getPriceItem("computer_diag")?.basePrice ?? 150,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Najpierw diagnostyka i ocena DPF. Oferujemy legalne czyszczenie/regenerację — nie wyłączamy DPF (DPF OFF).",
        "Сначала диагностика. Предлагаем легальную очистку — не отключаем DPF.",
        "Diagnostics first. We offer legal cleaning/regeneration — we do not disable DPF.",
        "Спочатку діагностика. Пропонуємо легальне очищення — не вимикаємо DPF."
      ),
      includes: [
        L("Odczyt błędów i ocena stanu DPF", "Считывание ошибок и оценка DPF", "Fault read and DPF assessment", "Зчитування помилок і оцінка DPF"),
        L("Rekomendacja: czyszczenie / naprawa / wymiana", "Рекомендация: очистка / ремонт / замена", "Recommendation: clean / repair / replace", "Рекомендація: очищення / ремонт / заміна"),
      ],
    },
    education: [
      {
        title: L("Kiedy DPF wymaga uwagi", "Когда нужен DPF", "When DPF needs attention", "Коли потрібен DPF"),
        body: L(
          "Kontrolka DPF, częste regeneracje, spadek mocy, dymienie. Zaczynamy od diagnostyki — bez obiecywania „cudownego wyłączenia”.",
          "Лампочка DPF, частые регенерации, потеря мощности. Начинаем с диагностики.",
          "DPF light, frequent regenerations, power loss. We start with diagnostics — no ‘disable’ shortcuts.",
          "Лампа DPF, часті регенерації, втрата потужності. Починаємо з діагностики."
        ),
      },
      {
        title: L("Co robimy legalnie", "Что делаем законно", "What we do legally", "Що робимо легально"),
        body: L(
          "Diagnostyka, ocena zapełnienia, czyszczenie / serwis układu zgodnie z możliwościami warsztatu. Nie reklamujemy DPF OFF na auta drogowe.",
          "Диагностика и очистка по возможности сервиса. Не рекламируем DPF OFF.",
          "Diagnostics and cleaning within workshop capabilities. We do not advertise DPF OFF for road cars.",
          "Діагностика й очищення за можливостями сервісу. Не рекламуємо DPF OFF."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy robicie DPF OFF?", "Делаете DPF OFF?", "Do you do DPF OFF?", "Робите DPF OFF?"),
        a: L(
          "Nie — nie oferujemy wyłączania filtrów DPF w autach drogowych. Pomagamy w diagnostyce i legalnym czyszczeniu/naprawie.",
          "Нет — не отключаем DPF на дорожных авто. Помогаем с диагностикой и легальной очисткой.",
          "No — we do not disable DPF on road cars. We help with diagnostics and legal cleaning/repair.",
          "Ні — не вимикаємо DPF на дорожніх авто. Допомагаємо з діагностикою та легальним очищенням."
        ),
      },
    ],
  },
  "czyszczenie-egr-warszawa": {
    bookServiceId: "diagnostic",
    contentServiceId: "diagnostic",
    faqDuration: L(
      "Diagnostyka szybko; czyszczenie EGR — zwykle w dniu wizyty lub po uzgodnieniu części.",
      "Диагностика быстро; очистка EGR — обычно в день визита.",
      "Diagnostics quickly; EGR cleaning usually same day or after parts are agreed.",
      "Діагностика швидко; очищення EGR — зазвичай того ж дня."
    ),
    price: {
      fromZl: getPriceItem("egr_clean")?.basePrice ?? 350,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Cena od diagnostyki i zakresu (czyszczenie / demontaż). Nie oferujemy EGR OFF.",
        "Цена от диагностики и объёма работ. EGR OFF не предлагаем.",
        "Price from diagnostics and scope. We do not offer EGR OFF.",
        "Ціна від діагностики та обсягу. EGR OFF не пропонуємо."
      ),
      includes: [
        L("Diagnostyka i ocena zaworu EGR", "Диагностика клапана EGR", "EGR valve diagnostics", "Діагностика клапана EGR"),
        L("Czyszczenie gdy technicznie uzasadnione", "Очистка при необходимости", "Cleaning when justified", "Очищення за потреби"),
      ],
    },
    education: [
      {
        title: L("Objawy problemów z EGR", "Симптомы EGR", "EGR symptoms", "Симптоми EGR"),
        body: L(
          "Błędy silnika, nierówna praca, dym, spadek mocy. Najpierw sprawdzamy przyczynę — czasem problem leży poza samym zaworem.",
          "Ошибки двигателя, дым, потеря мощности. Сначала ищем причину.",
          "Engine faults, smoke, power loss. We check the root cause first.",
          "Помилки двигуна, дим, втрата потужності. Спочатку шукаємо причину."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy robicie EGR OFF?", "Делаете EGR OFF?", "Do you do EGR OFF?", "Робите EGR OFF?"),
        a: L(
          "Nie. Oferujemy diagnostykę i czyszczenie/naprawę — bez wyłączania systemów emisji.",
          "Нет. Диагностика и очистка/ремонт — без отключения систем выбросов.",
          "No. Diagnostics and cleaning/repair — without disabling emissions systems.",
          "Ні. Діагностика й очищення/ремонт — без вимкнення систем викидів."
        ),
      },
    ],
  },
  "diagnostyka-zawieszenia-warszawa": {
    bookServiceId: "diagnostic",
    contentServiceId: "diagnostic",
    faqDuration: L(
      "Podstawowa diagnostyka zawieszenia zwykle 30–60 minut.",
      "Базовая диагностика подвески обычно 30–60 минут.",
      "Basic suspension check usually 30–60 minutes.",
      "Базова діагностика підвіски зазвичай 30–60 хвилин."
    ),
    price: {
      fromZl: getPriceItem("suspension_diag")?.basePrice ?? 150,
      priceFrom: true,
      materialsExtra: false,
      note: L(
        "Przy wymianie oleju (kod BessMotors) diagnostyka zawieszenia jest gratis. Samodzielna diagnostyka — wg cennika.",
        "При замене масла (код BessMotors) диагностика подвески бесплатно.",
        "With oil change (BessMotors code) suspension check is free. Standalone check — see price list.",
        "При заміні оливи (код BessMotors) діагностика підвіски безкоштовно."
      ),
      includes: [
        L("Ocena amortyzatorów, tulei, luzów", "Оценка амортизаторов, сайлентблоков, люфтов", "Dampers, bushes, play check", "Оцінка амортизаторів, втулок, люфтів"),
        L("Rekomendacja napraw z wyceną", "Рекомендации с сметой", "Repair recommendations with quote", "Рекомендації з кошторисом"),
      ],
    },
    education: [
      {
        title: L("Kiedy sprawdzić zawieszenie", "Когда проверить подвеску", "When to check suspension", "Коли перевірити підвіску"),
        body: L(
          "Stuki na nierównościach, ściąganie, nierówne zużycie opon, „pływanie” auta. Warto sprawdzić przed dłuższą trasą.",
          "Стуки, увод, неравномерный износ шин.",
          "Knocks, pulling, uneven tyre wear, vague steering.",
          "Стуки, відведення, нерівномірний знос шин."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy diagnostyka zawieszenia jest darmowa?", "Диагностика подвески бесплатная?", "Is suspension check free?", "Діагностика підвіски безкоштовна?"),
        a: L(
          "Tak — przy wymianie oleju z kodem BessMotors. Osobna wizyta diagnostyczna jest płatna wg cennika.",
          "Да — при замене масла с кодом BessMotors. Отдельный визит платный.",
          "Yes — with oil change and BessMotors code. A standalone visit is charged per the price list.",
          "Так — при заміні оливи з кодом BessMotors. Окремий візит платний."
        ),
      },
    ],
  },
  "wymiana-akumulatora-warszawa": {
    bookServiceId: "electric",
    contentServiceId: "electric",
    faqDuration: L(
      "Test i wymiana akumulatora zwykle do godziny — zależnie od modelu i dostępu.",
      "Тест и замена АКБ обычно до часа.",
      "Battery test and replacement usually within an hour.",
      "Тест і заміна АКБ зазвичай до години."
    ),
    price: {
      fromZl: getPriceItem("battery_replace")?.basePrice ?? getPriceItem("computer_diag")?.basePrice ?? 100,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Robocizna i dobór akumulatora — wycena po modelu. Akumulator (część) osobno.",
        "Работа и подбор АКБ — по модели. Сам аккумулятор отдельно.",
        "Labour and battery selection by model. The battery (part) is separate.",
        "Робота і підбір АКБ — за моделлю. Акумулятор окремо."
      ),
      includes: [
        L("Pomiar napięcia / układu ładowania", "Замер напряжения / зарядки", "Voltage / charging system check", "Замір напруги / зарядки"),
        L("Demontaż i montaż akumulatora", "Снятие и установка АКБ", "Battery removal and fitment", "Зняття й встановлення АКБ"),
      ],
    },
    education: [
      {
        title: L("Objawy słabej baterii", "Признаки слабого АКБ", "Weak battery signs", "Ознаки слабкого АКБ"),
        body: L(
          "Wolny rozruch, migające kontrolki, problemy z elektroniką po postoju. Warto sprawdzić też alternator — nie zawsze winny jest sam akumulator.",
          "Медленный запуск, проблемы с электроникой. Проверяем и генератор.",
          "Slow cranking, electronics issues after standing. We also check the alternator.",
          "Повільний запуск, проблеми з електронікою. Перевіряємо й генератор."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy akumulator jest w cenie?", "АКБ в цене?", "Is the battery included?", "АКБ в ціні?"),
        a: L(
          "Nie — część dobieramy i wyceniamy osobno. W cenniku jest robocizna / usługa montażu.",
          "Нет — деталь отдельно. В прайсе работа.",
          "No — the part is quoted separately. The price list covers labour/fitting.",
          "Ні — деталь окремо. У прайсі робота."
        ),
      },
    ],
  },
  "odgrzybianie-klimatyzacji-warszawa": {
    bookServiceId: "acRepair",
    contentServiceId: "acRepair",
    faqDuration: L(
      "Odgrzybianie zwykle w trakcie tej samej wizyty co serwis klimy — ok. 30–60 minut.",
      "Обычно 30–60 минут в рамках визита.",
      "Usually 30–60 minutes during the same visit.",
      "Зазвичай 30–60 хвилин під час візиту."
    ),
    price: {
      fromZl: getPriceItem("ac_clean")?.basePrice ?? 150,
      priceFrom: true,
      materialsExtra: false,
      note: L(
        "Często łączymy z nabijaniem klimy (podłączenie + czynnik wg cennika). Zapach z nawiewów to typowy powód wizyty.",
        "Часто совмещаем с заправкой. Запах из воздуховодов — типичная причина.",
        "Often combined with A/C recharge. Odour from vents is a common reason.",
        "Часто поєднуємо із заправкою. Запах з повітропроводів — типова причина."
      ),
      includes: [
        L("Dezynfekcja układu / nawiewów", "Дезинфекция системы", "System / vent disinfection", "Дезінфекція системи"),
        L("Zalecenia pielęgnacji po zabiegu", "Рекомендации после процедуры", "Aftercare advice", "Рекомендації після процедури"),
      ],
    },
    education: [
      {
        title: L("Kiedy warto odgrzybiać", "Когда нужна обработка", "When to treat", "Коли потрібна обробка"),
        body: L(
          "Nieprzyjemny zapach przy włączeniu klimy, zwłaszcza po postoju. Warto też sprawdzić filtr kabinowy.",
          "Неприятный запах при включении — проверьте и салонный фильтр.",
          "Unpleasant smell when A/C starts — also check cabin filter.",
          "Неприємний запах при увімкненні — перевірте й салонний фільтр."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy trzeba nabijać klimę przy odgrzybianiu?", "Нужна заправка при обработке?", "Is recharge required?", "Чи потрібна заправка?"),
        a: L(
          "Nie zawsze. Jeśli czynnik jest w normie, robimy odgrzybianie osobno. Po diagnostyce powiemy, co faktycznie potrzebne.",
          "Не всегда. Скажем после диагностики.",
          "Not always. We advise after inspection what is actually needed.",
          "Не завжди. Скажемо після діагностики."
        ),
      },
    ],
  },
};

export const EXTRA_SEO_RELATED_BATCH3: Record<string, string[]> = {
  "czyszczenie-dpf-warszawa": [
    "czyszczenie-egr-warszawa",
    "diagnostyka-komputerowa-warszawa",
    "diagnostyka-silnika-warszawa",
    "naprawa-wydechu-warszawa",
  ],
  "czyszczenie-egr-warszawa": [
    "czyszczenie-dpf-warszawa",
    "diagnostyka-komputerowa-warszawa",
    "diagnostyka-silnika-warszawa",
    "silnik",
  ],
  "diagnostyka-zawieszenia-warszawa": [
    "naprawa-zawieszenia-warszawa",
    "wymiana-amortyzatorow-warszawa",
    "wymiana-oleju-warszawa",
    "geometria",
  ],
  "wymiana-akumulatora-warszawa": [
    "wymiana-alternatora-warszawa",
    "elektryka",
    "diagnostyka-komputerowa-warszawa",
    "mechanik-warszawa-wlochy",
  ],
  "odgrzybianie-klimatyzacji-warszawa": [
    "serwis-klimatyzacji-warszawa",
    "naprawa-klimatyzacji",
    "klimatyzacja",
    "wymiana-filtrow-warszawa",
  ],
};
