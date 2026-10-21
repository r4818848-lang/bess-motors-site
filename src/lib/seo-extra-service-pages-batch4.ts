/**
 * Extra SEO landings — batch 4 (P2 growth).
 * Confirmed workshop intents with distinct demand; no geo clones.
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

export const EXTRA_SEO_SERVICE_PAGES_BATCH4: SeoLandingPage[] = [
  {
    slug: "wymiana-turbosprezarki-warszawa",
    title: "Wymiana turbosprężarki Warszawa",
    line1: "Diagnostyka turbodziury i wymiana turbo",
    line2: "Wycena po ocenie i doborze części",
    metaTitle: "Wymiana turbosprężarki Warszawa Włochy | BESS MOTORS",
    metaDescription:
      "Wymiana turbosprężarki Warszawa — diagnostyka, demontaż/montaż, dobór części. BESS MOTORS Włochy, Aleja Krakowska 48/52. Wycena po ocenie.",
    serviceId: "turbo",
    icon: "Fan",
  },
  {
    slug: "diagnostyka-elektryki-samochodowej-warszawa",
    title: "Diagnostyka elektryki samochodowej Warszawa",
    line1: "Problemy z ładowaniem, rozruchem, instalacją",
    line2: "Test akumulatora, alternatora i obwodów",
    metaTitle: "Diagnostyka elektryki Warszawa Włochy | BESS MOTORS",
    metaDescription:
      "Diagnostyka elektryki samochodowej Warszawa — akumulator, ładowanie, rozrusznik, instalacja. BESS MOTORS Włochy. Zapytaj o termin.",
    serviceId: "electric",
    icon: "Zap",
  },
  {
    slug: "wymiana-termostatu-warszawa",
    title: "Wymiana termostatu Warszawa",
    line1: "Przegrzewanie lub zimny silnik",
    line2: "Wymiana termostatu i kontrola układu chłodzenia",
    metaTitle: "Wymiana termostatu Warszawa | BESS MOTORS",
    metaDescription:
      "Wymiana termostatu Warszawa Włochy — objawy, diagnostyka układu chłodzenia, robocizna według cennika. BESS MOTORS, Aleja Krakowska 48/52.",
    serviceId: "engine",
    icon: "Thermometer",
  },
  {
    slug: "wymiana-tlumika-warszawa",
    title: "Wymiana tłumika Warszawa",
    line1: "Głośny wydech, korozja, nieszczelność",
    line2: "Wymiana lub spawanie — po ocenie",
    metaTitle: "Wymiana tłumika Warszawa Włochy | BESS MOTORS",
    metaDescription:
      "Wymiana tłumika i naprawa układu wydechowego Warszawa — ocena, spawanie lub wymiana. BESS MOTORS Włochy. Wycena po oględzinach.",
    serviceId: "exhaust",
    icon: "Flame",
  },
  {
    slug: "sprawdzenie-szczelnosci-klimatyzacji-warszawa",
    title: "Sprawdzenie szczelności klimatyzacji Warszawa",
    line1: "Próżnia i test układu przed nabiciem",
    line2: "Szukamy nieszczelności zamiast „dopychać gaz”",
    metaTitle: "Szczelność klimatyzacji Warszawa | BESS MOTORS",
    metaDescription:
      "Sprawdzenie szczelności klimatyzacji Warszawa — próżnia, test układu. BESS MOTORS Włochy. Często przed nabijaniem R134a / R1234yf.",
    serviceId: "acRepair",
    icon: "Wind",
  },
];

export const EXTRA_SEO_SERVICE_PROFILES_BATCH4: Record<string, SlugLandingProfile> = {
  "wymiana-turbosprezarki-warszawa": {
    bookServiceId: "turbo",
    contentServiceId: "turbo",
    faqDuration: L(
      "Po diagnostyce i dostawie części — zwykle 1–2 dni robocze; potwierdzimy po ocenie.",
      "После диагностики и поставки частей — обычно 1–2 рабочих дня.",
      "After diagnostics and parts delivery — usually 1–2 business days.",
      "Після діагностики та поставки частин — зазвичай 1–2 робочі дні."
    ),
    price: {
      fromZl: getPriceItem("turbo_replace")?.basePrice ?? 800,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Cena robocizny „od” — zależy od silnika i dostępu. Turbosprężarka i uszczelnienia wyceniamy osobno.",
        "Цена работы «от» — зависит от двигателя. Турбина отдельно.",
        "Labour from — depends on engine access. Turbo unit quoted separately.",
        "Робота «від» — залежить від доступу. Турбіна окремо."
      ),
      includes: [
        L("Diagnostyka objawów (dym, gwizd, spadek mocy)", "Диагностика симптомов", "Symptom diagnostics", "Діагностика симптомів"),
        L("Demontaż / montaż turbosprężarki", "Демонтаж / монтаж турбины", "Turbo remove / fit", "Демонтаж / монтаж турбіни"),
        L("Kontrola układu dolotowego i olejowego", "Контроль впуска и масла", "Intake and oil circuit check", "Контроль впуску та оливи"),
      ],
    },
    education: [
      {
        title: L("Kiedy turbo wymaga uwagi", "Когда нужна турбина", "When turbo needs attention", "Коли потрібна турбіна"),
        body: L(
          "Gwizd, niebieski/czarny dym, utrata mocy, błędy doładowania. Najpierw diagnostyka — czasem problem jest w przewodach lub zaworze, nie w samej turbosprężarce.",
          "Свист, дым, потеря мощности. Сначала диагностика.",
          "Whistle, smoke, power loss. Diagnostics first — sometimes hoses/valves, not the turbo itself.",
          "Свист, дим, втрата потужності. Спочатку діагностика."
        ),
      },
      {
        title: L("Co wpływa na cenę", "Что влияет на цену", "What affects price", "Що впливає на ціну"),
        body: L(
          "Typ silnika, dostęp do turbo, regeneracja vs nowa część, stan kolektorów i przewodów olejowych.",
          "Тип двигателя, доступ, регенерация vs новая деталь.",
          "Engine type, access, reman vs new unit, oil lines condition.",
          "Тип двигуна, доступ, регенерація vs нова деталь."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy zawsze trzeba wymieniać turbo?", "Всегда менять турбину?", "Always replace turbo?", "Завжди міняти турбіну?"),
        a: L(
          "Nie. Po diagnostyce mówimy, czy wystarczy naprawa układu (przewody, zawór, intercooler) czy wymiana/regeneracja turbosprężarki.",
          "Нет. После диагностики скажем, что реально нужно.",
          "No. After diagnostics we say if lines/valves/intercooler fix is enough or turbo replace/regen is needed.",
          "Ні. Після діагностики скажемо, що потрібно."
        ),
      },
    ],
  },
  "diagnostyka-elektryki-samochodowej-warszawa": {
    bookServiceId: "electric",
    contentServiceId: "electric",
    faqDuration: L(
      "Podstawowa diagnostyka elektryki zwykle tego samego dnia — zależnie od kolejki. Zapytaj o najbliższy termin.",
      "Базовая диагностика электрики обычно в день визита.",
      "Basic electrics diagnostics usually same day — ask about the next slot.",
      "Базова діагностика електрики зазвичай того ж дня."
    ),
    price: {
      fromZl:
        getPriceItem("computer_diag")?.basePrice ??
        getPriceItem("electric_fault")?.basePrice ??
        150,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Najpierw test i lokalizacja usterki. Części (akumulator, alternator itd.) wyceniamy osobno.",
        "Сначала тест и поиск неисправности. Запчасти отдельно.",
        "Test and fault location first. Parts quoted separately.",
        "Спочатку тест і пошук несправності. Запчастини окремо."
      ),
      includes: [
        L("Test akumulatora i układu ładowania", "Тест АКБ и зарядки", "Battery and charging test", "Тест АКБ і зарядки"),
        L("Odczyt dostępnych kodów / pomiar obwodów", "Коды / измерение цепей", "Codes / circuit measurements", "Коди / вимірювання кіл"),
        L("Rekomendacja naprawy z wyceną", "Рекомендация с сметой", "Repair recommendation with quote", "Рекомендація з кошторисом"),
      ],
    },
    education: [
      {
        title: L("Typowe objawy", "Типичные симптомы", "Typical symptoms", "Типові симптоми"),
        body: L(
          "Słaby rozruch, gasnące światła, kontrolki ładowania, rozładowany akumulator, problemy z elektryką po deszczu.",
          "Слабый запуск, тусклый свет, лампа зарядки, севший АКБ.",
          "Weak start, dim lights, charge warning, flat battery.",
          "Слабкий запуск, тьмяне світло, лампа зарядки, розряджений АКБ."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy wymieniacie akumulator od razu?", "Меняете АКБ сразу?", "Replace battery same visit?", "Міняєте АКБ одразу?"),
        a: L(
          "Po teście ładowania. Jeśli akumulator jest zużyty, a alternator sprawny — możemy wymienić po doborze pojemności. Osobna strona: /wymiana-akumulatora-warszawa.",
          "После теста зарядки. Есть отдельная страница замены АКБ.",
          "After charging test. See also /wymiana-akumulatora-warszawa.",
          "Після тесту зарядки. Є окрема сторінка заміни АКБ."
        ),
      },
    ],
  },
  "wymiana-termostatu-warszawa": {
    bookServiceId: "engine",
    contentServiceId: "engine",
    faqDuration: L(
      "Wymiana termostatu często tego samego dnia, jeśli część jest dostępna.",
      "Замена термостата часто в тот же день при наличии детали.",
      "Thermostat replacement often same day if the part is available.",
      "Заміна термостата часто того ж дня за наявності деталі."
    ),
    price: {
      fromZl: getPriceItem("thermostat")?.basePrice ?? 200,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Robocizna według cennika „od”. Termostat i płyn chłodniczy — osobno, dobór do modelu.",
        "Работа по прайсу «от». Термостат и антифриз отдельно.",
        "Labour from price list. Thermostat and coolant separate.",
        "Робота за прайсом «від». Термостат і антифриз окремо."
      ),
      includes: [
        L("Ocena objawów układu chłodzenia", "Оценка симптомов охлаждения", "Cooling symptom assessment", "Оцінка симптомів охолодження"),
        L("Wymiana termostatu", "Замена термостата", "Thermostat replacement", "Заміна термостата"),
        L("Kontrola temperatury po wymianie", "Контроль температуры", "Temperature check after", "Контроль температури"),
      ],
    },
    education: [
      {
        title: L("Objawy zużytego termostatu", "Симптомы", "Symptoms", "Симптоми"),
        body: L(
          "Silnik długo nie osiąga temperatury, przegrzewanie, skoki wskazówki, błędy temperatury. Sprawdzamy też pompę i chłodnicę — nie wymieniamy „w ciemno”.",
          "Долго не греется, перегрев, скачки температуры. Проверяем и помпу/радиатор.",
          "Slow warm-up, overheating, temp swings. We also check pump/radiator.",
          "Довго не гріється, перегрів. Перевіряємо помпу/радіатор."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy trzeba wymieniać płyn?", "Нужно менять антифриз?", "Replace coolant too?", "Чи міняти антифриз?"),
        a: L(
          "Często tak — przy otwarciu układu uzupełniamy lub wymieniamy płyn według normy. Koszt materiału osobno.",
          "Часто да — материал отдельно.",
          "Often yes — coolant top-up/change quoted separately.",
          "Часто так — матеріал окремо."
        ),
      },
    ],
  },
  "wymiana-tlumika-warszawa": {
    bookServiceId: "exhaust",
    contentServiceId: "exhaust",
    faqDuration: L(
      "Wiele napraw wydechu robimy tego samego dnia po oględzinach — potwierdzimy termin po kontakcie.",
      "Многие ремонты выхлопа — в день осмотра.",
      "Many exhaust repairs same day after inspection — we confirm after contact.",
      "Багато ремонтів вихлопу — у день огляду."
    ),
    price: {
      fromZl: getPriceItem("muffler_replace")?.basePrice ?? 200,
      priceFrom: true,
      materialsExtra: true,
      note: L(
        "Spawanie lub wymiana — decyzja po oględzinach. Część wyceniamy osobno.",
        "Сварка или замена — после осмотра. Деталь отдельно.",
        "Weld or replace — decided after inspection. Part separate.",
        "Зварювання або заміна — після огляду. Деталь окремо."
      ),
      includes: [
        L("Oględziny układu wydechowego", "Осмотр выхлопа", "Exhaust inspection", "Огляд вихлопу"),
        L("Spawanie lub wymiana tłumika", "Сварка или замена глушителя", "Weld or replace muffler", "Зварювання або заміна глушника"),
        L("Kontrola szczelności po naprawie", "Контроль герметичности", "Leak check after repair", "Контроль герметичності"),
      ],
    },
    education: [
      {
        title: L("Kiedy jechać do warsztatu", "Когда ехать", "When to visit", "Коли їхати"),
        body: L(
          "Głośniejszy wydech, metaliczny stukot, zapach spalin w kabinie, korozja widoczna pod autem.",
          "Громче выхлоп, стук, запах в салоне.",
          "Louder exhaust, rattle, cabin fumes, visible rust.",
          "Гучніший вихлоп, стукіт, запах у салоні."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy zawsze wymieniacie cały tłumik?", "Всегда меняете весь глушитель?", "Always full muffler?", "Завжди міняєте весь глушник?"),
        a: L(
          "Nie. Jeśli korozja jest lokalna, często wystarczy spawanie. Przy dużym zużyciu — wymiana odcinka.",
          "Нет — иногда достаточно сварки.",
          "No — local corrosion can often be welded; heavy wear means section replace.",
          "Ні — інколи досить зварювання."
        ),
      },
    ],
  },
  "sprawdzenie-szczelnosci-klimatyzacji-warszawa": {
    bookServiceId: "acRepair",
    contentServiceId: "acRepair",
    faqDuration: L(
      "Test szczelności zwykle w ramach wizyty serwisu klimy — ok. 1 godziny przy wolnym stanowisku.",
      "Тест герметичности обычно в рамках визита — около часа.",
      "Leak test usually within an A/C visit — about 1 hour if a bay is free.",
      "Тест герметичності зазвичай у межах візиту — близько години."
    ),
    price: {
      fromZl: getPriceItem("ac_hookup")?.basePrice ?? 80,
      priceFrom: false,
      materialsExtra: true,
      note: L(
        "Podłączenie / próżnia według cennika. Nabijanie czynnika i naprawa nieszczelności — osobno, po wyniku testu.",
        "Подключение/вакуум по прайсу. Заправка и ремонт утечки — отдельно.",
        "Hook-up/vacuum per price list. Recharge and leak repair separate after test.",
        "Підключення/вакуум за прайсом. Заправка і ремонт витоку — окремо."
      ),
      includes: [
        L("Podłączenie stacji klimatyzacji", "Подключение станции", "A/C station hook-up", "Підключення станції"),
        L("Próżnia i ocena szczelności", "Вакуум и оценка герметичности", "Vacuum and leak assessment", "Вакуум і оцінка герметичності"),
        L("Rekomendacja: nabicie lub naprawa", "Рекомендация: заправка или ремонт", "Recommendation: recharge or repair", "Рекомендація: заправка або ремонт"),
      ],
    },
    education: [
      {
        title: L("Dlaczego nie „dopychamy gazu”", "Почему не «допихиваем газ»", "Why we don’t just top up gas", "Чому не «допихаємо газ»"),
        body: L(
          "Jeśli układ nie trzyma próżni, najpierw szukamy nieszczelności. Samo dolewanie czynnika bez naprawy wraca problem po kilku dniach.",
          "Если вакуум не держит — ищем утечку, а не только заправляем.",
          "If vacuum fails, we find the leak instead of only recharging.",
          "Якщо вакуум не тримає — шукаємо витік, а не лише заправляємо."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy to to samo co nabijanie?", "Это то же, что заправка?", "Same as recharge?", "Це те саме, що заправка?"),
        a: L(
          "Nie. Najpierw szczelność, potem ewentualne nabicie R134a/R1234yf. Strona nabijania: /klimatyzacja i /serwis-klimatyzacji-warszawa.",
          "Нет — сначала герметичность, потом заправка.",
          "No — leak check first, then optional recharge. See /klimatyzacja.",
          "Ні — спочатку герметичність, потім заправка."
        ),
      },
    ],
  },
};

export const EXTRA_SEO_RELATED_BATCH4: Record<string, string[]> = {
  "wymiana-turbosprezarki-warszawa": [
    "diagnostyka-silnika-warszawa",
    "czyszczenie-dpf-warszawa",
    "silnik",
    "diagnostyka-komputerowa-warszawa",
  ],
  "diagnostyka-elektryki-samochodowej-warszawa": [
    "wymiana-akumulatora-warszawa",
    "wymiana-alternatora-warszawa",
    "elektryka",
    "diagnostyka-komputerowa-warszawa",
  ],
  "wymiana-termostatu-warszawa": [
    "wymiana-plynu-chlodniczego-warszawa",
    "wymiana-pompy-wody-warszawa",
    "silnik",
    "diagnostyka-silnika-warszawa",
  ],
  "wymiana-tlumika-warszawa": [
    "naprawa-wydechu-warszawa",
    "czyszczenie-dpf-warszawa",
    "silnik",
    "mechanik-warszawa-wlochy",
  ],
  "sprawdzenie-szczelnosci-klimatyzacji-warszawa": [
    "serwis-klimatyzacji-warszawa",
    "klimatyzacja",
    "naprawa-klimatyzacji",
    "odgrzybianie-klimatyzacji-warszawa",
  ],
};
