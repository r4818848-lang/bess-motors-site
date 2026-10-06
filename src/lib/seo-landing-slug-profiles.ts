import type { ServiceId } from "@/lib/services-catalog";
import { getPriceItem } from "@/lib/price-list";
import { acHookupPricePln, acR1234yfPer100gPln, acR134aPer100gPln, acRechargeFromPln } from "@/lib/ac-recharge-prices";
import {
  AC_HOOKUP_PROMO_OLD_PLN,
  AC_R1234YF_PROMO_OLD_PLN,
  AC_R134A_PROMO_OLD_PLN,
} from "@/lib/ac-recharge-promo-seo";
import type {
  LocalizedText,
  ServiceLandingEducationItem,
  ServiceLandingPrice,
  ServiceLandingStep,
} from "@/lib/service-landing-content";
import { EXTRA_SEO_SERVICE_PROFILES } from "@/lib/seo-extra-service-pages";

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

const L = (pl: string, ru: string, en?: string, uk?: string): LocalizedText => ({ pl, ru, en, uk });

/** Shown on brand SEO landings — avoids confusion with official dealerships */
const BRAND_INDEPENDENT_FAQ = {
  q: L(
    "Czy jesteście autoryzowanym dealerem lub salonem marki?",
    "Вы официальный дилер или салон марки?",
    "Are you an authorized dealer or brand showroom?",
    "Ви є авторизованим дилером або салоном бренду?"
  ),
  a: L(
    "Nie. BESS MOTORS to niezależny warsztat samochodowy. Obsługujemy wiele marek; współpracujemy z dostawcami części i olejów (m.in. Inter Cars, Motul, Castrol). Nazwy marek należą do ich właścicieli.",
    "Нет. BESS MOTORS — независимый автосервис. Мы обслуживаем разные марки и сотрудничаем с поставщиками запчастей и масел (Inter Cars, Motul, Castrol и др.). Названия брендов принадлежат правообладателям.",
    "No. BESS MOTORS is an independent car repair shop. We serve many brands; we cooperate with suppliers of parts and oils (including Inter Cars, Motul, Castrol). Brand names belong to their owners.",
    "Ні. BESS MOTORS — це незалежний автомобільний сервіс. Ми обслуговуємо різні бренди та співпрацюємо з постачальниками запчастин та масел (Inter Cars, Motul, Castrol тощо). Торгові марки належать правовласникам."
  ),
};

const chipPriceTable: ServiceLandingPrice = {
  fromZl: getPriceItem("stage1")?.basePrice ?? 1020,
  compareAtZl: getPriceItem("stage1")?.listPrice,
  priceFrom: true,
  materialsExtra: false,
  includes: [
    L("Diagnostyka ECU przed tuningiem", "Диагностика ECU", "ECU diagnostics before tuning", "Діагностика ECU"),
    L("Dobór i zapis mapy Stage 1 / 2", "Подбор и запись Stage 1 / 2", "Selection and saving of the Stage 1 / 2 map", "Вибір та запис Етап 1 / 2"),
    L("Jazda testowa i kontrola parametrów", "Тест-драйв и проверка", "Test Drive and Parameter Control", "Тест-драйв та валідація"),
  ],
  priceTable: [
    {
      label: L("Stage 1", "Stage 1", "Stage 1", "Stage 1"),
      priceZl: getPriceItem("stage1")?.basePrice ?? 1020,
      compareAtZl: getPriceItem("stage1")?.listPrice,
      priceFrom: true,
    },
    {
      label: L("Stage 2", "Stage 2", "Stage 2", "Stage 2"),
      priceZl: getPriceItem("stage2")?.basePrice ?? 2125,
      compareAtZl: getPriceItem("stage2")?.listPrice,
      priceFrom: true,
    },
    {
      label: L("Pops & Bangs", "Pops & Bangs", "Pops & Bangs", "Pops & Bangs"),
      priceZl: getPriceItem("pops_bangs")?.basePrice ?? 510,
      compareAtZl: getPriceItem("pops_bangs")?.listPrice,
      priceFrom: true,
    },
  ],
};

/** Per-slug overrides — all 27 SEO landing URLs */
export const SEO_LANDING_SLUG_PROFILES: Record<string, SlugLandingProfile> = {
  ...EXTRA_SEO_SERVICE_PROFILES,
  diagnostyka: {
    education: [
      {
        title: L("Diagnostyka OBD w BESS MOTORS", "Диагностика OBD", "OBD diagnostics at BESS MOTORS", "Діагностика БД"),
        body: L(
          "Odczyt kodów, parametry na żywo, testy podzespołów — nie tylko kasowanie błędu Check Engine.",
          "Считывание кодов, live-параметры — не только сброс Check Engine.",
          "Code reading, live parameters, component tests — not only clearing the Check Engine error.",
          "Зчитування кодів, параметрів в реальному часі — не тільки скидання двигуна перевірки."
        ),
      },
      {
        title: L("Raport po diagnostyce", "Отчёт после диагностики", "Post-diagnosis report", "Звіт після постановки діагнозу"),
        body: L(
          "Dostajesz listę kodów błędów z wyjaśnieniem, priorytetami napraw i orientacyjną wyceną. Bez żargonu — wiesz co jest pilne.",
          "Список кодов с объяснением, приоритетами и ориентировочной сметой. Без жаргона.",
          "You get a list of error codes with an explanation, repair priorities and an indicative quote. No jargon — you know what's urgent.",
          "Список кодів з поясненнями, пріоритетами та оцінками. Жодного жаргону."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy diagnostyka jest płatna?", "Диагностика платная?", "Is the diagnosis paid?", "Діагностика платна?"),
        a: L(
          "Krótki odczyt kodów często bezpłatny — pełna diagnoza według cennika na stronie.",
          "Краткий odczyt часто бесплатен — полная диагностика по прайсу.",
          "Short code reading is often free — full diagnosis according to the price list on the website.",
          "Короткий оджит часто безкоштовний — повна діагностика за прайс-листом."
        ),
      },
    ],
    faqDuration: L("Diagnostyka komputerowa: zwykle 30–60 min.", "Компьютерная диагностика: обычно 30–60 мин.", "Computer diagnostics: usually 30–60 min.", "Комп 'ютерна діагностика: зазвичай 30–60 хв."),
  },
  zawieszenie: {
    faqDuration: L("Diagnostyka i naprawa zawieszenia: od 1 do 4 godzin.", "Подвеска: от 1 до 4 часов.", "Suspension diagnosis and repair: 1 to 4 hours.", "Призупинення: від 1 до 4 годин."),
    galleryTags: ["zawies", "wahacz", "audi", "подвеск", "рычаг"],
  },
  "wymiana-oleju": {
    faqDuration: L("Wymiana oleju i filtra: ok. 1 godziny.", "Замена масла: около 1 часа.", "Oil and filter change: approx. 1 hour.", "Заміна масла: близько 1 години."),
    galleryTags: ["olej", "oil", "масл"],
    education: [
      {
        title: L(
    "Promocja kod BessMotors — wymiana oleju 80 zł",
    "Акция код BessMotors — замена масла 80 zł",
    "Promotion code BessMotors — oil change PLN 80",
    "Промокод BessMotors - заміна масла 80 злотих"
        ),
        body: L(
          "Szukasz gdzie wymienić olej w Warszawie? W BESS MOTORS (Włochy, Aleja Krakowska) robocizna wymiany oleju i filtra to 80 zł zamiast 150 zł — kod BessMotors przy zapisie. Przy wymianie oleju diagnostyka zawieszenia gratis. Olej i filtr dobieramy pod VIN (materiały osobno).",
          "Где поменять масло в Варшаве? В BESS MOTORS (Włochy) работа по замене масла и фильтра — 80 zł вместо 150 zł по коду BessMotors. При замене масла диагностика подвески бесплатно. Масло и фильтр под VIN (материалы отдельно).",
          "Looking for a place to change oil in Warsaw? At BESS MOTORS (Italy, Aleja Krakowska), the labor of changing the oil and filter is PLN 80 instead of PLN 150 — BessMotors code when saving. When changing the oil, the suspension diagnosis is free of charge. The oil and filter are selected under the Vin (materials separately).",
          "Де поміняти масло у Варшаві? У BESS MOTORS (Влохи) робота з заміни масла та фільтра становить 80 злотих замість 150 злотих відповідно до кодексу BessMotors. При заміні масла діагностика підвіски проводиться безкоштовно. Масло та фільтр під VIN (матеріали окремо)."
        ),
      },
      {
        title: L("Pełny serwis olejowy — nie tylko wlewanie", "Полный масляный сервис", "Full oil service — not just pouring", "Повний сервіс мастила"),
        body: L(
          "Spuszczamy stary olej, wymieniamy filtr oleju, uzupełniamy specyfikacją pod VIN. Kontrolujemy poziom i szczelność — auto gotowe z naklejką serwisową.",
          "Сливаем старое масло, меняем фильтр, заливаем по VIN. Проверяем уровень и герметичность — наклейка о сервисе.",
          "Drain the old oil, replace the oil filter, top up with the specification under the Vin. We control the level and tightness — the car is ready with a service sticker.",
          "Злийте стару олію, замініть фільтр, заповніть його VIN-кодом. Перевіряємо рівень і герметичність — наклейка про сервіс."
        ),
      },
      {
        title: L("Marki oleju w warsztacie", "Масла в сервисе", "Brands of oil in the workshop", "Масла в експлуатації"),
        body: L(
          "Castrol, Motul, Shell, Liqui Moly — dobieramy normę producenta (VW 504.00, BMW LL-04, MB 229.5). Możesz przywieźć własny olej po wcześniejszym uzgodnieniu.",
          "Castrol, Motul, Shell, Liqui Moly — норма производителя. Можно со своим маслом по согласованию.",
          "Castrol, Motul, Shell, Liqui Moly — we choose the manufacturer's standard (VW 504.00, BMW LL-04, MB 229.5). You can bring your own oil by prior arrangement.",
          "Castrol, Motul, Shell, LIQUI Moly — стандарт виробника. Ви можете використовувати його з власною олією за домовленістю."
        ),
      },
      {
        title: L("Wymiana oleju Warszawa Włochy / Okęcie", "Замена масла Варшава Włochy", "Oil change Warsaw Italy / Okęcie", "Заміна масла Варшава Влохи"),
        body: L(
          "Dogodny dojazd: Aleja Krakowska 48/52, ok. 5 min od Okęcia i lotniska. Parking przy serwisie. Pn–Sb 8:00–18:00. Zapis online 24/7 na /wymiana-oleju lub telefon +48 791 257 229.",
          "Удобный подъезд: Aleja Krakowska 48/52, ~5 мин от Okęcie. Парковка у сервиса. Пн–Сб 8:00–18:00. Онлайн-запись 24/7.",
          "Convenient access: Aleja Krakowska 48/52, approx. 5 minutes from Okęcie and the airport. Parking at the service. Mon-Sat 8:00–18:00. Online registration 24/7 on /oil-change or phone +48 791 257 229.",
          "Зручний доступ: Aleja Krakowska 48/52, ~5 хв від Окенце. Парковка на службі. Пн–Сб 8:00–18:00. Онлайн запис 24/7."
        ),
      },
    ],
    price: {
      fromZl: getPriceItem("oil_filter")?.basePrice ?? 80,
      compareAtZl: getPriceItem("oil_filter")?.listPrice ?? 150,
      priceFrom: false,
      materialsExtra: true,
      includes: [
        L("Wymiana oleju silnikowego", "Замена моторного масла", "Replacement of engine oil", "Заміна моторного мастила"),
        L("Wymiana filtra oleju", "Замена масляного фильтра", "Oil filter replacement", "Заміна масляного фільтра"),
        L("Kontrola poziomu i szczelności", "Проверка уровня и утечек", "Level and leakage check", "Перевірте рівень та витоки"),
        L("Diagnostyka zawieszenia gratis przy wymianie oleju", "Диагностика подвески бесплатно при замене масла", "Free Suspension Diagnostics with Oil Change", "Діагностика підвіски безкоштовно при заміні масла"),
        L("Kod promocji BessMotors przy zapisie", "Код акции BessMotors при записи", "BessMotors promo code on enrollment", "Код просування реєстрації BessMotors"),
      ],
      priceTable: [
        {
          label: L("Wymiana oleju + filtr (robocizna)", "Масло + фильтр (работа)", "Oil change + filter (labour)", "Масло + фільтр (робота)"),
          priceZl: getPriceItem("oil_filter")?.basePrice ?? 80,
          compareAtZl: getPriceItem("oil_filter")?.listPrice ?? 150,
        },
        {
          label: L("Diagnostyka zawieszenia (przy oleju)", "Диагностика подвески (с маслом)", "Suspension diagnostics (at oil)", "Діагностика суспензії (з маслом)"),
          priceZl: 0,
          compareAtZl: 150,
        },
      ],
      note: L(
        "Promocja kod BessMotors: 80 zł zamiast 150 zł (robocizna) + diagnostyka zawieszenia gratis przy wymianie oleju. Olej i filtr — osobno po doborze VIN.",
        "Акция код BessMotors: 80 zł вместо 150 zł (работа) + диагностика подвески бесплатно при замене масла. Масло и фильтр — отдельно по VIN.",
        "Promotion code BessMotors: PLN 80 instead of PLN 150 (labor) + free suspension diagnostics when changing oil. Oil and filter — separately after selecting the Vin.",
        "Промокод BessMotors: 80 злотих замість 150 злотих (робота) + безкоштовна діагностика підвіски при заміні масла. Масло та фільтр — окремо за VIN."
      ),
    },
  },
  hamulce: {
    faqDuration: L("Wymiana klocków: 1–2 godziny; z tarczami dłużej.", "Колодки: 1–2 часа; с дисками дольше.", "Replacing pads: 1–2 hours; with longer discs.", "Колодки: 1–2 години; з дисками довше."),
    galleryTags: ["hamulc", "brake", "klock", "колод"],
    education: [
      {
        title: L(
          "Promocja kod BessMotors — klocki i tarcze",
          "Акция код BessMotors — колодки и диски",
          "Promo code BessMotors — blocks and discs",
          "Просування коду BessMotors — колодки та диски"
        ),
        body: L(
          "Klocki przednie 100 zł (było 120), tarcze+klocki przód 150 zł (było 220), klocki tył 120 zł (było 150), tarcze+klocki tył 180 zł (było 280). Przy zapisie online lub telefonicznie podaj kod BessMotors.",
          "Передние колодки 100 zł (было 120), диски+колодки спереди 150 zł (было 220), задние колодки 120 zł (было 150), диски+колодки сзади 180 zł (было 280). При записи назовите код BessMotors.",
          "Front blocks PLN 100 (there were 120), discs+ front blocks PLN 150 (there were 220), back blocks PLN 120 (there were 150), discs+ back blocks PLN 180 (there were 280). When signing up online or by phone, enter the BessMotors code.",
          "Передні колодки 100 злотих (було 120 злотих), диски+колодки спереду 150 злотих (було 220 злотих), задні колодки 120 злотих (було 150 злотих), диски+колодки ззаду 180 злотих (було 280 злотих). Під час запису назвіть код BessMotors."
        ),
      },
      {
        title: L("Klocki, tarcze i pełny układ hamulcowy", "Колодки, диски и вся тормозная система", "Pads, discs and full braking system", "Колодки, диски та гальмівна система в цілому"),
        body: L(
          "Nie ograniczamy się do klocków — wymieniamy tarcze, przewody, zaciski i płyn hamulcowy. Mierzymy grubość tarcz i klocków, sprawdzamy szczelność układu.",
          "Не только колодки — диски, шланги, суппорты и тормозная жидкость. Замеряем толщину дисков и колодок, проверяем герметичность.",
          "We do not limit ourselves to pads — we replace discs, wires, calipers and brake fluid. We measure the thickness of the discs and pads, check the tightness of the system.",
          "Не тільки колодки — диски, шланги, штангісти та гальмівна рідина. Вимірюємо товщину дисків і прокладок, перевіряємо герметичність."
        ),
      },
      {
        title: L("Przejrzyste ceny — bez niespodzianek", "Прозрачные цены", "Transparent pricing — no surprises", "Прозорі ціни"),
        body: L(
          "Przed montażem pokazujemy zużyte części i akceptujesz zakres. Części hamulcowe wyceniamy osobno — w promocji podane są ceny robocizny z kodem BessMotors.",
          "Перед работой показываем изношенные детали. Запчасти отдельно — в акции указана работа по коду BessMotors.",
          "Before assembly, we show the worn parts and you accept the range. Brake parts are priced separately — the promotion includes labor prices with the BessMotors code.",
          "Перед роботою показуємо зношені деталі. Запасні частини окремо — акція уточнює роботу за кодом BessMotors."
        ),
      },
    ],
    price: {
      fromZl: getPriceItem("brake_pads_front")?.basePrice ?? 100,
      compareAtZl: getPriceItem("brake_pads_front")?.listPrice ?? 120,
      priceFrom: false,
      materialsExtra: true,
      includes: [
        L("Wymiana klocków hamulcowych", "Замена тормозных колодок", "Replacement of brake pads.", "Заміна гальмівних колодок"),
        L("Wymiana tarcz hamulcowych (gdy zużyte)", "Замена тормозных дисков при износе", "Replacing brake discs (when worn)", "Заміна гальмівних дисків у разі зносу"),
        L("Kontrola zacisków, przewodów i płynu", "Проверка суппортов, шлангов и жидкости", "Inspection of terminals, wires and fluid", "Перевірка штангенциркулів, шлангів та рідини"),
        L("Kod promocji BessMotors przy zapisie", "Код акции BessMotors при записи", "BessMotors promo code on enrollment", "Код просування реєстрації BessMotors"),
      ],
      priceTable: [
        {
          label: L("Klocki przednie", "Передние колодки", "Front pads", "Передні накладки"),
          priceZl: getPriceItem("brake_pads_front")?.basePrice ?? 100,
          compareAtZl: getPriceItem("brake_pads_front")?.listPrice ?? 120,
        },
        {
          label: L("Tarcze + klocki przód", "Диски + колодки спереди", "Discs + pads front", "Диски + накладки спереду"),
          priceZl: getPriceItem("brake_disc_front")?.basePrice ?? 150,
          compareAtZl: getPriceItem("brake_disc_front")?.listPrice ?? 220,
        },
        {
          label: L("Klocki tylne", "Задние колодки", "Rear pads", "Задні колодки"),
          priceZl: getPriceItem("brake_pads_rear")?.basePrice ?? 120,
          compareAtZl: getPriceItem("brake_pads_rear")?.listPrice ?? 150,
        },
        {
          label: L("Tarcze + klocki tył", "Диски + колодки сзади", "Discs + pads rear", "Диски + задні накладки"),
          priceZl: getPriceItem("brake_disc_rear")?.basePrice ?? 180,
          compareAtZl: getPriceItem("brake_disc_rear")?.listPrice ?? 280,
        },
      ],
      note: L(
        "Promocja kod BessMotors — ceny robocizny. Części osobno po akceptacji.",
        "Акция код BessMotors — цены работы. Запчасти отдельно после согласования.",
        "Promo code BessMotors — labor prices. Parts separately after acceptance.",
        "Промокод BessMotors - ціни на роботу. Запасні частини окремо після затвердження."
      ),
    },
  },
  klimatyzacja: {
    faqDuration: L("Serwis klimy: 1–2 godziny.", "Кондиционер: 1–2 часа.", "Climate service: 1–2 hours.", "Кондиціонер: 1–2 години."),
    galleryTags: ["klim", "ac", "chłodnic", "radiator", "радиатор"],
    education: [
      {
        title: L("Nabijanie klimatyzacji — ceny", "Заправка кондиционера — цены", "Air Conditioning Charging — Prices", "Заправка кондиціонера — ціни"),
        body: L(
    "Podłączenie układu ${acHookupPricePln()} zł, freon R134a ${acR134aPer100gPln()} zł/100 g, R1234yf ${acR1234yfPer100gPln()} zł/100 g — pełna zaprawa od ${acRechargeFromPln()} zł. Nabijamy wszystkie marki aut.",
    "Подключение ${acHookupPricePln()} zł, фреон R134a ${acR134aPer100gPln()} zł/100 г, R1234yf ${acR1234yfPer100gPln()} zł/100 г — полная заправка от ${acRechargeFromPln()} zł. Заправляем все марки.",
    "Connection of the system ${acHookupPricePln ()} PLN, freon R134a ${acR134aPer100gPln ()} PLN/100 g, R1234yf ${acR1234yfPer100gPln ()} PLN/100 g — full mortar from ${acRechargeFromPln()} PLN. We charge all car brands.",
    "Підключення ${acHookupPricePln()} zł, фреон R134a ${acR134aPer100gPln()} zł/100 г, R1234yf ${acR1234yfPer100gPln()} zł/100 г — повна заправка від ${acRechargeFromPln()} zł. Ми заправляємо всі бренди."
        ),
      },
      {
        title: L("Kiedy warto zrobić serwis klimatyzacji", "Когда стоит обслуживать кондиционер", "When to do air conditioning service", "Коли обслуговувати кондиціонер"),
        body: L(
          "Nawet gdy klima jeszcze chłodzi, czynnik naturalnie ubywa. Przed upałami warto zrobić próżnię, kontrolę szczelności i uzupełnienie R134a lub R1234yf — mniejsze obciążenie sprężarki i komfort w aucie.",
          "Даже если кондиционер ещё холодит, хладагент со временем уходит. Перед жарой — вакуум, проверка герметичности и заправка R134a или R1234yf: меньше нагрузка на компрессор и комфорт в салоне.",
          "Even when the climate is still cooling, the factor naturally decreases. Before the heat, it is worth doing a vacuum, leakage check and supplementing R134a or R1234yf — less compressor load and comfort in the car.",
          "Навіть якщо кондиціонер все ще холодний, холодоагент з часом закінчується. Перед нагріванням — вакуум, перевірка герметичності та доливання R134a або R1234yf: менше навантаження на компресор та комфорт у салоні."
        ),
      },
      {
        title: L("Co robimy w BESS MOTORS", "Что делаем в BESS MOTORS", "What we do at BESS MOTORS", "Що ми робимо в BESS MOTORS"),
        body: L(
          "Diagnostyka układu, napełnianie czynnikiem, ozonowanie i odgrzybianie, naprawa nieszczelności, wymiana sprężarki lub chłodnicy — obsługujemy większość aut osobowych.",
          "Диагностика, заправка, озонирование и антигрибок, устранение утечек, замена компрессора или радиатора — обслуживаем большинство легковых авто.",
          "System diagnostics, refrigerant filling, ozonation and fungation, leakage repair, compressor or radiator replacement — we service most passenger cars.",
          "Діагностика, заправка, озонування та протигрибкові засоби, усунення витоків, заміна компресора або радіатора — ми обслуговуємо більшість легкових автомобілів."
        ),
      },
      {
        title: L("Naprawa klimatyzacji samochodowej", "Ремонт автокондиционера", "Car air conditioning repair", "Ремонт автомобільних кондиціонерів"),
        body: L(
          "Lokalizujemy wycieki, spawamy przewody, wymieniamy uszczelki, chłodnicę, osuszacz i sprężarkę. Po naprawie — próżnia i nabijanie R134a lub R1234yf.",
          "Находим утечки, варим трубки, меняем уплотнения, радиатор, осушитель и компрессор. После ремонта — вакуум и заправка R134a или R1234yf.",
          "We locate leaks, weld wires, replace gaskets, cooler, dryer and compressor. After repair — vacuum and ramming R134a or R1234yf.",
          "Ми знаходимо витоки, варимо трубки, міняємо ущільнення, радіатор, сушарку та компресор. Після ремонту — вакуумування та наповнення R134a або R1234yf."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy nabijacie klimatyzację we wszystkich autach?", "Заправляете кондиционер на всех авто?", "Do you charge the air conditioning in all cars?", "Заправляєте кондиціонер на всіх автомобілях?"),
        a: L(
          "Tak — obsługujemy wszystkie marki i modele aut osobowych z układem R134a lub R1234yf. Przyjeżdżasz, podłączamy stację Viaken i napełniamy układ na miejscu.",
          "Да — обслуживаем все марки легковых авто с R134a или R1234yf. Подключаем станцию Viaken и заправляем на месте.",
          "Yes — we support all makes and models of passenger cars with an R134a or R1234yf system. You arrive, we connect the Viaken station and refill the system on site.",
          "Так — ми обслуговуємо всі марки легкових автомобілів з R134a або R1234yf. Підключіть станцію Viaken і заправте на місці."
        ),
      },
      {
        q: L("Czy trzeba czekać w kolejce na nabijanie?", "Нужно ждать в очереди на заправку?", "Do you have to wait in line to get stuffed?", "Потрібно чекати в черзі на АЗС?"),
        a: L(
          "Nie — staramy się przyjąć auto od razu, bez długiego oczekiwania. Nabijanie klimatyzacji wykonujemy na miejscu, często w ciągu 1–2 godzin.",
          "Нет — стараемся принять авто сразу, без долгого ожидания. Заправка на месте, обычно за 1–2 часа.",
          "No — we try to accept the car right away, without a long wait. Air conditioning charging is carried out on site, often within 1–2 hours.",
          "Ні — ми намагаємося прийняти машину відразу, без тривалого очікування. Заправка на місці, зазвичай за 1–2 години."
        ),
      },
      {
        q: L("Jakie są aktualne ceny nabijania klimatyzacji?", "Какие актуальные цены заправки кондиционера?", "What are the current air conditioning charging prices?", "Які актуальні ціни на заправку кондиціонера?"),
        a: L(
    "Podłączenie ${acHookupPricePln()} zł, R134a ${acR134aPer100gPln()} zł/100 g, R1234yf ${acR1234yfPer100gPln()} zł/100 g. Minimum od ${acRechargeFromPln()} zł. Umów wizytę online lub zadzwoń +48 791 257 229.",
    "Подключение ${acHookupPricePln()} zł, R134a ${acR134aPer100gPln()} zł/100 г, R1234yf ${acR1234yfPer100gPln()} zł/100 г. Минимум от ${acRechargeFromPln()} zł. Онлайн-запись или телефон +48 791 257 229.",
    "Connection ${acHookupPricePln()} PLN, R134a ${acR134aPer100gPln ()} PLN/100g, R1234yf ${acR1234yfPer100gPln ()} PLN/100g. Minimum starting at ${acRechargeFromPln()} PLN. Make an appointment online or call +48 791 257 229.",
    "Підключення ${acHookupPricePln()} zł, R134a ${acR134aPer100gPln()} zł/100 g, R1234yf ${acR1234yfPer100gPln()} zł/100 g. Мінімум ${acRechargeFromPln()} zł. Онлайн-запис або за телефоном +48 791 257 229."
        ),
      },
      {
        q: L("Ile kosztuje nabijanie klimatyzacji?", "Сколько стоит заправка кондиционера?", "How much does it cost to charge the air conditioner?", "Скільки коштує заправка кондиціонера?"),
        a: L(
    "Podłączenie układu ${acHookupPricePln()} zł, R134a ${acR134aPer100gPln()} zł/100 g, R1234yf ${acR1234yfPer100gPln()} zł/100 g — dokładna ilość czynnika zależy od modelu.",
    "Подключение ${acHookupPricePln()} zł, R134a ${acR134aPer100gPln()} zł/100 г, R1234yf ${acR1234yfPer100gPln()} zł/100 г — объём зависит от модели.",
    "Connection of the system ${acHookupPricePln ()} PLN, R134a ${acR134aPer100gPln()} PLN/100 g, R1234yf ${acR1234yfPer100gPln ()} PLN/100 g — the exact amount of factor depends on the model.",
    "Підключення ${acHookupPricePln()} zł, R134a ${acR134aPer100gPln ()} zł/100 г, R1234yf ${acR1234yfPer100gPln ()} zł/100 г — об 'єм залежить від моделі."
        ),
      },
      {
        q: L("Od ile zł kosztuje pełna zaprawa klimy?", "От какой суммы заправка кондиционера?", "How much does a full air conditioning mortar cost?", "Скільки коштує заправка кондиціонера?"),
        a: L(
    "Minimum to podłączenie (${acHookupPricePln()} zł) plus 100 g czynnika (${acR134aPer100gPln()} zł) — od ${acRechargeFromPln()} zł. Większość aut wymaga więcej niż 100 g.",
    "Минимум: подключение (${acHookupPricePln()} zł) + 100 г фреона (${acR134aPer100gPln()} zł) — от ${acRechargeFromPln()} zł. Большинству авто нужно больше 100 г.",
    "The minimum is a connection (${acHookupPricePln ()} PLN) plus 100 g of factor (${acR134aPer100gPln ()} PLN) — from ${acRechargeFromPln()} PLN. Most cars require more than 100 g.",
    "Мінімум: підключення (${acHookupPricePln()} zł) + 100 г фреону (${acR134aPer100gPln()} zł) — від ${acRechargeFromPln()} zł. Більшості автомобілів потрібно більше 100 грамів."
        ),
      },
      {
        q: L("Czy można umówić się tego samego dnia?", "Можно записаться в тот же день?", "Is it possible to make an appointment on the same day?", "Чи можу я зареєструватися в той же день?"),
        a: L(
          "Tak — w sezonie letnim staramy się przyjąć auto tego samego dnia. Zapis online lub telefon +48 791 257 229.",
          "Да — в летний сезон стараемся принять авто в тот же день. Онлайн-запись или телефон +48 791 257 229.",
          "Yes — in the summer season we try to take the car on the same day. Online registration or phone +48 791 257 229.",
          "Так — в літній сезон намагаємося взяти машину в той же день. Онлайн-запис або за телефоном +48 791 257 229."
        ),
      },
    ],
    price: {
      fromZl: acRechargeFromPln(),
      priceFrom: true,
      materialsExtra: true,
      note: {
        pl: `Podłączenie ${acHookupPricePln()} zł, R134a ${acR134aPer100gPln()} zł/100 g, R1234yf ${acR1234yfPer100gPln()} zł/100 g.`,
        ru: `Подключение ${acHookupPricePln()} zł, R134a ${acR134aPer100gPln()} zł/100 г, R1234yf ${acR1234yfPer100gPln()} zł/100 г.`,
      },
      includes: [
        L("Podłączenie układu i próżniowanie", "Подключение и вакуумирование", "System connection and vacuuming", "Підключення та евакуація"),
        L("Napełnianie R134a lub R1234yf", "Заправка R134a или R1234yf", "Filling R134a or R1234yf", "Заправте R134a або R1234yf"),
        L("Kontrola szczelności i ciśnienia", "Проверка герметичности и давления", "Leak and pressure check", "Перевірка герметичності та тиску"),
        L("Odgrzybianie / ozonowanie (opcjonalnie)", "Антигрибок / озонирование (опционально)", "Dehumidification / ozonation (optional)", "Протигрибкове / озонування (необов 'язково)"),
      ],
      priceTable: [
        {
          label: L("Podłączenie układu klimatyzacji", "Подключение системы кондиционера", "Connection of the air conditioning system", "Підключення системи кондиціонування"),
          priceZl: acHookupPricePln(),
          priceFrom: false,
        },
        {
          label: L("Napełnianie R134a (za 100 g)", "Заправка R134a (за 100 г)", "Filling R134a (per 100 g)", "Заправка R134a (на 100 г)"),
          priceZl: acR134aPer100gPln(),
          priceFrom: false,
        },
        {
          label: L("Napełnianie R1234yf (za 100 g)", "Заправка R1234yf (за 100 г)", "Filling R1234yf (per 100g)", "Заправка R1234yf (на 100 г)"),
          priceZl: acR1234yfPer100gPln(),
          priceFrom: false,
        },
        {
          label: L("Diagnostyka klimatyzacji", "Диагностика кондиционера", "Air conditioning diagnostics", "Діагностика кондиціонерів"),
          priceZl: getPriceItem("ac_diag")?.basePrice ?? 150,
          priceFrom: true,
        },
        {
          label: L("Odgrzybianie klimatyzacji", "Антигрибок кондиционера", "Air conditioning desiccation", "Кондиціонер протигрибковий"),
          priceZl: getPriceItem("ac_clean")?.basePrice ?? 150,
          priceFrom: true,
        },
        {
          label: L("Sprawdzenie szczelności układu", "Проверка герметичности", "Checking the tightness of the system", "3) перевірка герметичності"),
          priceZl: getPriceItem("ac_leak")?.basePrice ?? 150,
          priceFrom: true,
        },
        {
          label: L("Wymiana sprężarki klimatyzacji", "Замена компрессора", "Replacement, Air Conditioner Compressor", "Заміна компресора"),
          priceZl: getPriceItem("ac_compressor")?.basePrice ?? 400,
          priceFrom: true,
        },
        {
          label: L("Wymiana chłodnicy klimatyzacji", "Замена радиатора кондиционера", "Air Conditioning Cooler Replacement", "Заміна радіатора кондиціонера"),
          priceZl: getPriceItem("ac_radiator")?.basePrice ?? 350,
          priceFrom: true,
        },
      ],
    },
  },
  "naprawa-klimatyzacji": {
    bookServiceId: "acRepair",
    contentServiceId: "acRepair",
    faqDuration: L("Naprawa klimatyzacji: zwykle 1 dzień — zależy od zakresu.", "Ремонт кондиционера: обычно 1 день — зависит от объёма.", "Air conditioning repair: usually 1 day — depends on the scope.", "Ремонт кондиціонера: зазвичай 1 день — залежить від обсягу."),
    galleryTags: ["klim", "ac", "chłodnic", "radiator", "spawan", "радиатор"],
    education: [
      {
        title: L("Naprawa klimatyzacji samochodowej w Warszawie", "Ремонт автокондиционера в Варшаве", "Repair of car air conditioning in Warsaw", "Ремонт кондиціонерів у Варшаві"),
        body: L(
          "BESS MOTORS na Alei Krakowskiej 48/52 (Włochy) — niezależny warsztat z pełną obsługą układów klimatyzacji: od diagnostyki po wymianę sprężarki i chłodnicy.",
          "BESS MOTORS на Aleja Krakowska 48/52 (Włochy) — независимый сервис с полным обслуживанием кондиционеров: от диагностики до замены компрессора и радиатора.",
          "BESS MOTORS at Aleja Krakowska 48/52 (Italy) — an independent workshop with full service of air conditioning systems: from diagnostics to compressor and cooler replacement.",
          "BESS MOTORS at Aleja Krakowska 48/52 (Włochy) — це незалежна служба з повним обслуговуванням кондиціонерів: від діагностики до заміни компресора та радіатора."
        ),
      },
      {
        title: L("Typowe usterki klimatyzacji", "Типичные неисправности", "Common Air Conditioning Malfunctions", "Типові несправності"),
        body: L(
          "Nieszczelność przewodów lub chłodnicy, zużyta sprężarka, zatkany osuszacz, uszkodzone uszczelki — objawy to słabe chłodzenie, syczenie, wyciek czynnika lub nieprzyjemny zapach z nawiewów.",
          "Утечки в трубках или радиаторе, износ компрессора, засоренный осушитель — слабое охлаждение, шипение, утечка фреона или запах из дефлекторов.",
          "Leakage of hoses or cooler, worn compressor, clogged dehumidifier, damaged gaskets — symptoms include poor cooling, hissing, leakage of refrigerant or unpleasant odor from air vents.",
          "Витоки в трубках або радіаторі, знос компресора, засмічення сушарки — слабке охолодження, шипіння, витік фреону або запах від дефлекторів."
        ),
      },
      {
        title: L("Spawanie przewodów i wymiana elementów", "Сварка трубок и замена узлов", "Welding of wires and replacement of components", "Зварювання труб та заміна вузлів"),
        body: L(
          "Naprawiamy pęknięte przewody klimatyzacji metodą spawania, wymieniamy chłodnicę, osuszacz i sprężarkę. Po każdej naprawie — próżniowanie i nabijanie R134a lub R1234yf .",
          "Ремонтируем трещины в трубках сваркой, меняем радиатор, осушитель и компрессор. После ремонта — вакуум и заправка R134a или R1234yf .",
          "We repair the cracked air conditioning pipes by welding, replace the radiator, dryer and compressor. After each repair — vacuuming and charging R134a or R1234yf .",
          "Ми ремонтуємо тріщини в трубах шляхом зварювання, змінюємо радіатор, сушарку та компресор. Після ремонту — вакуумування та наповнення R134a або R1234yf ."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Ile trwa naprawa klimatyzacji samochodowej?", "Сколько длится ремонт кондиционера?", "How long does it take to repair a car air conditioner?", "Скільки часу займає ремонт кондиціонера?"),
        a: L(
          "Prosta naprawa nieszczelności lub wymiana uszczelki — często ten sam dzień. Wymiana sprężarki lub chłodnicy — zwykle 1 dzień roboczy, w zależności od dostępności części.",
          "Простая утечка — часто в тот же день. Замена компрессора или радиатора — обычно 1 рабочий день, в зависимости от запчастей.",
          "Simple leak repair or gasket replacement — often the same day. Replacement of the compressor or cooler — usually 1 working day, depending on the availability of parts.",
          "Простий витік — часто в один день. Заміна компресора або радіатора — зазвичай 1 робочий день, залежно від запасних частин."
        ),
      },
      {
        q: L("Czy naprawiacie klimatyzację w aucie z R1234yf?", "Ремонтируете системы с R1234yf?", "Are you repairing air conditioning in a car with R1234yf?", "Ремонт систем за допомогою R1234yf?"),
        a: L(
          "Tak — obsługujemy układy R134a i R1234yf. Po naprawie napełniamy właściwym czynnikiem na stacji serwisowej.",
          "Да — обслуживаем R134a и R1234yf. После ремонта заправляем нужным хладагентом на сервисной станции.",
          "Yes — we support R134a and R1234yf systems. After repair, fill with the correct medium at the service station.",
          "Так — ми обслуговуємо R134a та R1234yf. Після ремонту заправляємо необхідний холодоагент на сто."
        ),
      },
    ],
    price: {
      fromZl: getPriceItem("ac_leak")?.basePrice ?? 150,
      priceFrom: true,
      materialsExtra: true,
      note: {
        pl: "Robocizna według cennika — części i ilość czynnika wyceniamy po diagnostyce. Nabijanie po naprawie według cennika.",
        ru: "Работа по прайсу — запчасти и фреон после диагностики. Заправка после ремонта по прайсу.",
      },
      includes: [
        L("Diagnostyka i test szczelności", "Диагностика и проверка герметичности", "Diagnostics and leakage test", "Діагностика та тестування на герметичність"),
        L("Naprawa nieszczelności / spawanie przewodów", "Устранение утечек / сварка трубок", "Repair of leaks / welding of wires", "Усунення несправностей/ зварювання труб"),
        L("Wymiana sprężarki, chłodnicy, osuszacza", "Замена компрессора, радиатора, осушителя", "Replacement of compressor, cooler, dryer", "Заміна компресора, радіатора, сушарки"),
        L("Próżnia i nabijanie po naprawie", "Вакуум и заправка после ремонта", "Vacuum and ramming after repair", "Вакуум та заправка після ремонту"),
      ],
      priceTable: [
        {
          label: L("Diagnostyka klimatyzacji", "Диагностика кондиционера", "Air conditioning diagnostics", "Діагностика кондиціонерів"),
          priceZl: getPriceItem("ac_diag")?.basePrice ?? 150,
          priceFrom: true,
        },
        {
          label: L("Sprawdzenie szczelności układu", "Проверка герметичности", "Checking the tightness of the system", "3) перевірка герметичності"),
          priceZl: getPriceItem("ac_leak")?.basePrice ?? 150,
          priceFrom: true,
        },
        {
          label: L("Wymiana przewodów klimatyzacji", "Замена трубок кондиционера", "Replacing the air conditioning ducts", "Заміна трубок кондиціонера"),
          priceZl: getPriceItem("ac_lines")?.basePrice ?? 250,
          priceFrom: true,
        },
        {
          label: L("Wymiana osuszacza klimatyzacji", "Замена осушителя", "Replacing the A/C dryer", "Заміна сушильної машини"),
          priceZl: getPriceItem("ac_dryer")?.basePrice ?? 200,
          priceFrom: true,
        },
        {
          label: L("Wymiana chłodnicy klimatyzacji", "Замена радиатора кондиционера", "Air Conditioning Cooler Replacement", "Заміна радіатора кондиціонера"),
          priceZl: getPriceItem("ac_radiator")?.basePrice ?? 350,
          priceFrom: true,
        },
        {
          label: L("Wymiana sprężarki klimatyzacji", "Замена компрессора", "Replacement, Air Conditioner Compressor", "Заміна компресора"),
          priceZl: getPriceItem("ac_compressor")?.basePrice ?? 400,
          priceFrom: true,
        },
      ],
    },
  },
  geometria: {
    faqDuration: L("Geometria kół: ok. 1 godziny.", "Развал-схождение: около 1 часа.", "Wheel alignment: approx. 1 hour.", "Конвергенція розломів: близько 1 години."),
    galleryTags: ["geometr", "opon", "align", "развал"],
  },
  silnik: {
    faqDuration: L("Zależy od zakresu — wycena po diagnostyce silnika.", "Зависит от объёма — смета после диагностики.", "It depends on the scope — pricing after engine diagnostics.", "Залежить від обсягу — оцінка після постановки діагнозу."),
  },
  elektryka: {
    faqDuration: L("Diagnostyka elektryki: 1–3 godziny.", "Электрика: 1–3 часа.", "Electrical diagnostics: 1–3 hours.", "Електрика: 1–3 години."),
    galleryTags: ["elektr", "alternator", "rozrusznik", "генератор"],
  },
  przeglad: {
    faqDuration: L("Przygotowanie do przeglądu: 2–4 godziny.", "Подготовка к техосмотру: 2–4 часа.", "Preparation for review: 2–4 hours.", "Підготовка до огляду: 2–4 години."),
    faqExtra: [
      {
        q: L("Co sprawdzacie przed przeglądem?", "Что проверяете перед техосмотром?", "What do you check before the inspection?", "Що ви перевіряєте перед перевіркою?"),
        a: L(
          "Światła, hamulce, zawieszenie, wycieki, emisja spalin, płyny — lista punktów przed wizytą na stacji.",
          "Свет, тормоза, подвеска, утечки, выхлоп, жидкости — чек-лист перед станцией.",
          "Lights, brakes, suspension, leaks, exhaust emissions, fluids — a list of points before visiting the station.",
          "Світло, гальма, підвіска, витоки, вихлопні гази, рідини — контрольний список перед станцією."
        ),
      },
    ],
  },
  opony: {
    faqDuration: L("Wymiana 4 kół: 45–90 min.", "Замена 4 колёс: 45–90 мин.", "Replacement of 4 wheels: 45–90 min.", "Заміна 4-х коліс: 45–90 хв."),
    galleryTags: ["opon", "tire", "wulkan", "шин"],
  },
  bmw: {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Niezależny serwis BMW w BESS MOTORS", "Независимый сервис BMW", "Independent BMW Service at BESS MOTORS", "Незалежна служба BMW"),
        body: L(
          "Zaawansowana diagnostyka, oleje Longlife, hamulce, zawieszenie i elektryka. Znamy typowe usterki N47, B48, xDrive. Nie jesteśmy dealerem BMW.",
          "Диагностика, масла Longlife, тормоза, подвеска. Знаем N47, B48, xDrive. Мы не дилер BMW.",
          "Advanced diagnostics, Longlife oils, brakes, suspension and electrics. We know the typical N47, B48, xDrive faults. We are not a BMW dealer.",
          "Діагностика, олії Longlife, гальма, підвіска. Ми знаємо N47, B48, xDrive. Ми не є дилером BMW."
        ),
      },
      {
        title: L("Oleje i serwis okresowy BMW", "Масло и ТО BMW", "Oils and BMW Periodic Service", "Олива та технічне обслуговування BMW"),
        body: L(
          "Oleje LL-04, LL-12FE, filtry OEM/OES od sprawdzonych dostawców. Naklejka serwisowa z datą i przebiegiem.",
          "Масла LL-04, LL-12FE, фильтры OEM/OES. Сервисная наклейка.",
          "LL-04, LL-12FE oils, OEM/OES filters from reliable suppliers. Service sticker with date and mileage.",
          "LL-04, LL-12FE, фільтри OEM/OES Сервісна наклейка."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
      {
        q: L("Czy serwisujecie wszystkie modele BMW?", "Все ли модели BMW?", "Do you service all BMW models?", "Чи всі моделі BMW?"),
        a: L("Tak — od serii 1 do X5/X6, diesel i benzyna.", "Да — от 1-й серии до X5/X6, дизель и бензин.", "Yes — from series 1 to X5/X6, diesel and petrol.", "Так — від 1 серії до X5/X6, дизельні та бензинові."),
      },
      {
        q: L("Czy używacie olejów zgodnych z BMW LL?", "Масла BMW LL?", "Do you use BMW LL-compliant oils?", "Масла BMW LL?"),
        a: L("Tak — dobieramy specyfikację LL-04 / LL-12FE pod silnik.", "Да — LL-04 / LL-12FE по мотору.", "Yes — we choose the LL-04 /LL-12FE specification for the engine.", "Так — LL-04 / LL-12FE на двигуні."),
      },
    ],
    faqDuration: L("Wizyta serwisowa BMW: od 1 godziny.", "Визит BMW: от 1 часа.", "BMW service visit: from 1 hour.", "Візит BMW: від 1 години."),
    galleryTags: ["bmw"],
  },
  mercedes: {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Niezależny serwis Mercedes-Benz", "Независимый сервис Mercedes", "Independent Mercedes-Benz Service", "Незалежна служба Mercedes"),
        body: L(
          "Diagnostyka, serwis olejowy MB 229.5, hamulce, klima, elektryka. Obsługa A/B/C/GLA/GLC i klasy E. Nie jesteśmy autoryzowanym salonem Mercedes.",
          "Диагностика, масло MB 229.5, тормоза, климат. Мы не официальный салон Mercedes.",
          "Diagnostics, oil service MB 229.5, brakes, climate, electrics. Support A/B/C/GLA/GLC and Class E. We are not an authorized Mercedes dealership.",
          "Діагностика, масло МБ 229,5, гальма, клімат. Ми не є офіційним шоу-румом Mercedes."
        ),
      },
      {
        title: L("Oleje MB i AdBlue", "Масла MB и AdBlue", "MB and AdBlue oils", "Масла MB та AdBlue"),
        body: L(
          "Dobór specyfikacji 229.5 / 229.51, kontrola poziomu AdBlue i układu SCR.",
          "Подбор 229.5 / 229.51, контроль AdBlue и SCR.",
          "Selection of specification 229.5 / 229.51, control of AdBlue level and SCR system.",
          "Вибір 229.5 / 229.51, керування AdBlue та SCR."
        ),
      },
      {
        title: L("Hamulce i zawieszenie Mercedes", "Тормоза и подвеска", "Mercedes brakes and suspension", "Гальма та підвіска"),
        body: L(
          "Klocki, tarcze, amortyzatory — części OEM lub jakości premium, z gwarancją na robociznę.",
          "Колодки, диски, амортизаторы — OEM или premium.",
          "Pads, discs, shock absorbers — OEM or premium quality parts, with a labor guarantee.",
          "Колодки, диски, амортизатори — OEM або Premium."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
      {
        q: L("Czy macie doświadczenie z AdBlue i dieslami?", "AdBlue и дизели?", "Do you have experience with AdBlue and diesel?", "AdBlue і дизелі?"),
        a: L("Tak — diagnostyka układu SCR i typowych błędów silników CDI.", "Да — SCR и типичные ошибки CDI.", "Yes — diagnostics of the SCR system and common CDI motor errors.", "Так — SCR та типові помилки CDI."),
      },
    ],
    faqDuration: L("Serwis Mercedes: zwykle 1–3 godziny.", "Mercedes: обычно 1–3 часа.", "Mercedes service: usually 1–3 hours.", "Mercedes: зазвичай 1–3 години."),
    galleryTags: ["mercedes"],
  },
  vag: {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Grupa VAG — Audi, VW, Skoda, Seat", "Группа VAG", "VAG Group — Audi, VW, Skoda, Seat", "VAG Group"),
        body: L(
          "Doświadczenie VAG: DSG, rozrząd, olej 504.00, diagnostyka. Niezależny warsztat — nie jesteśmy dealerem VAG.",
          "Опыт VAG: DSG, ГРМ, масло 504.00. Независимый сервис, не дилер VAG.",
          "VAG experience: DSG, timing, oil 504.00, diagnostics. Independent workshop — we are not a VAG dealer.",
          "Досвід VAG: DSG, TIMING, Oil 504.00. Незалежна служба, а не дилер VAG."
        ),
      },
      {
        title: L("Skrzynie DSG i rozrząd", "DSG и ГРМ", "DSG boxes and timing", "DSG та хронометраж"),
        body: L(
          "Wymiana oleju DSG, kontrola łańcucha/rozrzedu — według przebiegu i historii serwisu.",
          "Масло DSG, цепь ГРМ — по пробегу и истории.",
          "Changing the DSG oil, checking the chain/dilution - according to the course and history of the service.",
          "Олива DSG, ланцюг синхронізації — за пробігом та історією."
        ),
      },
      {
        title: L("Elektryka i klima VAG", "Электрика и климат VAG", "Electricity & Climate VAG", "VAG Electrics & Climate"),
        body: L(
          "Błędy komfortu, oświetlenie, nagrzewnica — diagnostyka modułowa.",
          "Комфорт, свет, печка — модульная диагностика.",
          "Comfort errors, lighting, heater — modular diagnostics.",
          "Комфорт, світло, плита — модульна діагностика."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
      {
        q: L("Czy serwisujecie skrzynie DSG?", "DSG?", "Do you service DSG boxes?", "DSG?"),
        a: L("Tak — wymiana oleju DSG, diagnostyka i naprawy według wyceny.", "Да — масло DSG, диагностика и ремонт.", "Yes — replacement of DSG oil, diagnostics and repairs according to the valuation.", "Так — масло DSG, діагностика та ремонт."),
      },
    ],
    faqDuration: L("Wizyta VAG: od 1 godziny.", "VAG: от 1 часа.", "VAG visit: from 1 hour.", "VAG: від 1 години."),
    galleryTags: ["audi", "vw", "vag"],
  },
  kontakt: {
    bookServiceId: "diagnostic",
    steps: [
      {
        title: L("Wybierz termin online", "Выберите время онлайн", "Select an online appointment", "Виберіть час онлайн"),
        description: L(
          "Kalendarz 24/7 — dzień, godzina, rodzaj usługi. Potwierdzenie SMS/Telegram.",
          "Календарь 24/7 — день, час, услуга. Подтверждение SMS/Telegram.",
          "24/7 calendar — day, time, type of service. SMS/Telegram confirmation.",
          "Календар 24/7 — день, година, послуга. Підтвердження SMS/Telegram."
        ),
      },
      {
        title: L("Przyjazd na Aleję Krakowską 48/52", "Приезд на Aleja Krakowska 48/52", "Arrival at Aleja Krakowska 48/52", "Прибуття в Aleja Krakowska 48/52"),
        description: L(
          "Dogodny dojazd S2 i lotnisko Chopina. Parking przy warsztacie.",
          "Удобно с S2 и аэропорта. Парковка у сервиса.",
          "Convenient access to S2 and Chopin Airport. Parking by the workshop.",
          "Зручно з S2 та аеропортом. Парковка на службі."
        ),
      },
      {
        title: L("Obsługa w warsztacie", "Обслуживание", "Workshop service", "Обслуговування"),
        description: L(
          "Mechanik przyjmuje auto, ustala zakres i orientacyjny czas zakończenia.",
          "Механик принимает авто, согласует объём и срок.",
          "The mechanic accepts the car, sets the scope and approximate completion time.",
          "Механік приймає автомобіль, погоджує обсяг та термін."
        ),
      },
      {
        title: L("Odbiór lub kontakt w sprawie postępu", "Выдача или связь", "Receipt or contact for progress", "Отримання або зв 'язок"),
        description: L(
          "Status naprawy online w kliencie lub telefon — wiesz, kiedy odebrać auto.",
          "Статус онлайн в кабинете или звонок — знаете, когда забрать авто.",
          "Online repair status in the client or phone — you know when to pick up the car.",
          "Статус онлайн в офісі або дзвінок — ви знаєте, коли забрати автомобіль."
        ),
      },
    ],
    education: [
      {
        title: L("Jak umówić wizytę?", "Как записаться?", "How to make an appointment?", "Як зареєструватися?"),
        body: L(
          "Online, telefon +48 791 257 229, WhatsApp lub Telegram @bessmotors_bot — wybierz, co wygodnie.",
          "Онлайн, телефон, WhatsApp или Telegram — как удобнее.",
          "Online, phone +48 791 257 229, WhatsApp or Telegram @bessmotors_bot — choose what's convenient.",
          "Онлайн, телефон, WhatsApp або Telegram — як зручніше."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Gdzie dokładnie jest warsztat?", "Где сервис?", "Where exactly is the workshop?", "Де послуга?"),
        a: L("Aleja Krakowska 48/52, 02-284 Warszawa (Włochy).", "Aleja Krakowska 48/52, Warszawa.", "Aleja Krakowska 48/52, 02-284 Warsaw (Italy).", "Aleja Krakowska 48/52, Warszawa."),
      },
      {
        q: L("Czy mogę umówić się na dziś?", "Можно на сегодня?", "Can I make an appointment for today?", "Можна мені на сьогодні?"),
        a: L("Sprawdź wolne terminy w kalendarzu — często mamy slot tego samego dnia.", "Смотрите календарь — часто есть слот в тот же день.", "Check the free dates on the calendar — we often have a slot on the same day.", "Дивіться календар — часто в один і той же день є слот."),
      },
    ],
    price: {
      fromZl: 0,
      priceFrom: false,
      materialsExtra: false,
      includes: [
        L("Rezerwacja online 24/7", "Онлайн-запись 24/7", "Online booking 24/7", "Онлайн-запис 24/7"),
        L("Potwierdzenie terminu", "Подтверждение времени", "Date Confirmation", "Підтвердження часу"),
        L("Konsultacja przy przyjęciu auta", "Консультация при приёме", "Consultation at the reception of the car", "Консультація на рецепції"),
      ],
      note: L("Ceny poszczególnych usług — w cenniku na stronie.", "Цены услуг — в прайсе на сайте.", "Prices of individual services — in the price list on the website.", "Ціни на послуги — в прайс-листі на сайті."),
    },
  },
  "warszawa-wlochy": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Mechanik Włochy / Okęcie", "Механик Włochy / Okęcie", "Mechanic Italy / Okęcie", "Механік Влохи / Окенце"),
        body: L(
          "BESS MOTORS przy Alei Krakowskiej — 5 min od trasy na lotnisko. Diagnostyka, opony, olej, hamulce, klima.",
          "У Alei Krakowskiej — 5 мин до аэропорта. Диагностика, шины, масло, тормоза.",
          "BESS MOTORS at Aleja Krakowska — 5 minutes from the route to the airport. Diagnostics, tyres, oil, brakes, climate.",
          "Alei Krakowskiej знаходиться в 5 хвилинах їзди від аеропорту. Діагностика, шини, масло, гальма."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy jest parking?", "Есть парковка?", "Is there  a parking lot?", "Чи є парковка?"),
        a: L("Tak — możesz zostawić auto na czas naprawy przy warsztacie.", "Да — парковка на время ремонта.", "Yes — you can leave the car at the workshop for the time of repair.", "Так — стоянка під час ремонту."),
      },
    ],
    faqDuration: L("Wizyta: od 30 min (diagnostyka) do całego dnia (naprawa).", "Визит: от 30 мин до полного дня.", "Visit: from 30 minutes (diagnostics) to the whole day (repair).", "Візит: від 30 хвилин до повного дня."),
  },
  "warszawa-ursynow": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Serwis dla mieszkańców Ursynowa", "Сервис для Ursynów", "Service for residents of Ursynów", "Сервіс для Урсинува"),
        body: L(
          "Dojazd z Ursynowa i Mokotowa przez S2 lub Al. Krakowską — ok. 15–20 min. Umów wizytę bez kolejki.",
          "Из Ursynów и Mokotów — 15–20 мин. Запись без очереди.",
          "Access from Ursynowo and Mokotów via S2 or Al. Krakowska — approx. 15–20 min. Arrange a skip the line appointment.",
          "З Урсинува та Мокотува — 15–20 хв. Без черги."
        ),
      },
      {
        title: L("Usługi na miejscu", "Услуги на месте", "On-Site Services:", "Послуги на місці"),
        body: L(
          "Olej, opony, hamulce, geometria, diagnostyka — kompleksowo w jednym warsztacie.",
          "Масло, шины, тормоза, развал, диагностика — всё в одном сервисе.",
          "Oil, tyres, brakes, geometry, diagnostics — comprehensively in one workshop.",
          "Масло, шини, гальма, колапс, діагностика — все в одному сервісі."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Jak dojechać z Ursynowa?", "Как доехать с Ursynów?", "How to get from Ursynów?", "Як дістатися з Урсинова?"),
        a: L("S2 do Włoch lub Aleja Krakowska 48/52 — ok. 15–20 min.", "S2 до Włoch или Aleja Krakowska — 15–20 мин.", "S2 to Italy or Aleja Krakowska 48/52 — approx. 15–20 min.", "S2 до Влоха або Алеї Краківської — 15–20 хв."),
      },
    ],
    faqDuration: L("Czas zależy od usługi — podajemy przy rezerwacji.", "Время — при записи.", "The time depends on the service — we provide it when booking.", "Час — при записі."),
  },
  "warszawa-mokotow": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Serwis dla południowego Mokotowa", "Сервис для южного Mokotów", "Service for southern Mokotów", "Обслуговування Південного Мокотува"),
        body: L(
          "Z Służewca, Służewca lub Okęcia dojazd do Alei Krakowskiej 48/52 zajmuje zwykle 10–15 min. Diagnostyka, opony, hamulce, olej.",
          "Из Służewiec/Okęcie — 10–15 мин до Aleja Krakowska.",
          "From Służewiec, Służewiec or Okęcie, it usually takes 10–15 minutes to get to Aleja Krakowska 48/52. Diagnostics, tyres, brakes, oil.",
          "Від Служевця/Окенце — 10–15 хв до Алеї Краківської."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy obsługujecie kierowców z Mokotowa?", "Обслуживаете Mokotów?", "Do you serve drivers from Mokotów?", "Обслуговуєте Мокотув?"),
        a: L(
          "Tak — wielu klientów dojeżdża z południowego Mokotowa. Warsztat leży przy głównej Alei Krakowskiej (Włochy).",
          "Да — многие клиенты едут с южного Mokotów.",
          "Yes — many customers commute from southern Mokotów. The workshop is located at the main Krakowska Avenue (Italy).",
          "Так — багато клієнтів приїжджають з південного Мокотува."
        ),
      },
    ],
    faqDuration: L("Wizyta: od 30 min (diagnostyka) do całego dnia.", "Визит: от 30 мин до дня.", "Visit: from 30 minutes (diagnostics) to the whole day.", "Візит: від 30 хвилин до дня."),
  },
  "warszawa-ochota": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Mechanik blisko Ochoty i Rakowca", "Механик рядом с Ochota", "Mechanic close to Ochota and Rakowiec", "Механік біля Очоти"),
        body: L(
          "BESS MOTORS — ok. 15 min autem z Rakowca lub Szczęśliwic. Kompleksowy serwis: diagnostyka, hamulce, klima, opony.",
          "Ок. 15 мин от Rakowiec. Диагностика, тормоза, кондиционер.",
          "BESS MOTORS — about 15 minutes by car from Rakowiec or Szczęśliwice. Comprehensive service: diagnostics, brakes, climate, tires.",
          "Прибл. 15 хв від Раковця. Діагностика, гальмування, кондиціонування."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Jak dojechać z Ochoty?", "Как доехать с Ochota?", "How to get from Ochota?", "Як дістатися з Очоти?"),
        a: L(
          "Aleja Krakowska 48/52 (Włochy) — trasa przez Południową obwodnicę lub Al. Krakowską. Parking przy warsztacie.",
          "Aleja Krakowska 48/52 — через obwodnicę или Aleja Krakowska.",
          "Aleja Krakowska 48/52 (Italy) — route through the Southern Bypass or Al. Krakowska. Parking by the workshop.",
          "Aleja Krakowska 48/52 — via obwodnicę або Aleja Krakowska."
        ),
      },
    ],
    faqDuration: L("Czas naprawy zależy od zakresu — informujemy po diagnostyce.", "Время — после диагностики.", "The repair time depends on the scope — we inform you after the diagnosis.", "Час — після постановки діагнозу."),
  },
  "serwis-audi": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Niezależny serwis Audi Warszawa", "Независимый сервис Audi", "Independent service of Audi Warsaw", "Незалежна служба Audi"),
        body: L(
          "Quattro, TFSI, TDI — diagnostyka VAG, olej 504.00, hamulce, DSG, elektryka. Niezależny warsztat — nie jesteśmy salonem Audi.",
          "Quattro, TFSI, TDI — VAG, DSG. Независимый сервис, не салон Audi.",
          "Quattro, TFSI, TDI — VAG diagnostics, oil 504.00, brakes, DSG, electrics. Independent workshop — we are not an Audi showroom.",
          "Quattro, TFSI, TDI — VAG, DSG. Незалежний сервіс, а не салон Audi."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
      {
        q: L("Czy obsługujecie Audi A3/A4/Q5?", "A3/A4/Q5?", "Do you operate Audi A3/A4/Q5?", "A3/A4/Q5?"),
        a: L("Tak — wszystkie modele Audi grupy VAG.", "Да — все модели VAG.", "Yes — all Audi models of the VAG group.", "Так — всі моделі VAG."),
      },
    ],
    galleryTags: ["audi"],
  },
  "serwis-toyota": {
    bookServiceId: "oil",
    contentServiceId: "diagnostic",
    education: [
      {
        title: L("Niezależny serwis Toyota i Lexus", "Независимый сервис Toyota / Lexus", "Independent Toyota and Lexus service", "Незалежний сервіс Toyota / Lexus"),
        body: L(
          "Hybrydy i benzyna — olej 0W-20/0W-16, hamulce, diagnostyka Check Engine, serwis okresowy. Nie jesteśmy dealerem Toyota.",
          "Гибриды и бензин — масло 0W-20, тормоза. Мы не дилер Toyota.",
          "Hybrids and petrol — 0W-20/0W-16 oil, brakes, Check Engine diagnostics, periodic service. We are not a Toyota dealer.",
          "Гібриди та бензин — масло 0W-20, гальма. Ми не є дилером Toyota."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
      {
        q: L("Czy serwisujecie Prius / hybrid?", "Prius / hybrid?", "Do you service the Prius / hybrid?", "Пріус / гібрид?"),
        a: L("Tak — obsługa hybryd po procedurze producenta.", "Да — гибриды по процедуре.", "Yes — handling hybrids after the manufacturer's procedure.", "Так — гібриди згідно процедури."),
      },
    ],
  },
  "serwis-opel": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Opel i Chevrolet", "Opel и Chevrolet", "Opel and Chevrolet", "Opel і Chevrolet"),
        body: L(
          "Astra, Insignia, Corsa — diagnostyka, zawieszenie, hamulce, olej Dexos2.",
          "Astra, Insignia — диагностика, подвеска, Dexos2.",
          "Astra, Insignia, Corsa — diagnostics, suspension, brakes, Dexos2 oil.",
          "Astra, Insignia — діагностика, підвіска, Dexos2."
        ),
      },
      {
        title: L("Typowe usterki Opla", "Типичные болячки Opel", "Typical faults", "Типові болячки Opel"),
        body: L(
          "EGR, kolektor, elektryka — diagnozujemy przed wymianą części.",
          "EGR, коллектор, электрика — диагностика до замены.",
          "EGR, collector, electrics — we diagnose before replacing parts.",
          "EGR, колектор, електрика — діагностика перед заміною."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
      {
        q: L("Czy macie olej Dexos2?", "Dexos2?", "Do you have Dexos2 oil?", "Dexos2?"),
        a: L("Tak — dobieramy specyfikację pod silnik.", "Да — по мотору.", "Yes — we select the specification for the engine.", "Так — на двигуні."),
      },
    ],
    faqDuration: L("Serwis Opel: od 1 godziny.", "Opel: от 1 часа.", "Opel service: from 1 hour.", "Opel: від 1 години."),
  },
  "serwis-ford": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Ford Focus, Kuga, Mondeo", "Ford Focus, Kuga", "Ford Focus, Kuga, Mondeo", "Ford Focus, Kuga"),
        body: L(
          "Ecoboost i diesel — typowe usterki, rozrząd, olej, hamulce, elektryka.",
          "Ecoboost и дизель — ГРМ, масло, тормоза.",
          "Ecoboost and diesel — typical faults, timing, oil, brakes, electrics.",
          "Ecoboost і дизель — ГРМ, масло, гальма."
        ),
      },
      {
        title: L("PowerShift / automat", "PowerShift / АКПП", "PowerShift / automatic", "PowerShift / автоматична трансмісія"),
        body: L(
          "Diagnostyka skrzyni, wymiana oleju ATF według zaleceń producenta.",
          "Диагностика КПП, замена ATF.",
          "Diagnostics of the box, replacement of ATF oil according to the manufacturer's recommendations.",
          "Діагностика КПП, заміна ATF."
        ),
      },
    ],
    faqExtra: [BRAND_INDEPENDENT_FAQ],
    faqDuration: L("Ford: zwykle 1–3 godziny.", "Ford: 1–3 часа.", "Ford: usually 1–3 hours.", "Ford: 1–3 години."),
  },
  "serwis-renault": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Renault / Dacia", "Renault / Dacia", "Renault / Dacia", "Renault / Dacia"),
        body: L(
          "Megane, Clio, Duster — diagnostyka, hamulce, zawieszenie, klima.",
          "Megane, Clio, Duster — диагностика, тормоза, кондиционер.",
          "Megane, Clio, Duster — diagnostics, brakes, suspension, climate.",
          "Megane, Clio, Duster — діагностика, гальма, кондиціонер."
        ),
      },
      {
        title: L("Klima i elektryka Renault", "Климат Renault", "Renault climate and electrics", "Клімат Renault"),
        body: L(
          "Nabicie klimy, odgrzybianie, błędy BSI — obsługa po diagnozie.",
          "Заправка, антибактериальная, BSI.",
          "Climate charging, fungi removal, BSI errors — post-diagnosis service.",
          "Заправка, антибактеріальна, BSI."
        ),
      },
    ],
    faqExtra: [BRAND_INDEPENDENT_FAQ],
    faqDuration: L("Renault / Dacia: od 1 godziny.", "Renault: от 1 часа.", "Renault / Dacia: from 1 hour.", "Renault: від 1 години."),
  },
  "serwis-peugeot": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Peugeot / Citroën PSA", "Peugeot / Citroën", "Peugeot / Citroën PSA", "Peugeot / Citroën"),
        body: L(
          "Silniki PureTech i HDi — diagnostyka, rozrząd, hamulce, olej.",
          "PureTech и HDi — диагностика, ГРМ, масло.",
          "PureTech and HDi engines — diagnostics, timing, brakes, oil.",
          "PureTech і HDi — діагностика, хронометраж, олія."
        ),
      },
      {
        title: L("PureTech — rozrząd na czas", "PureTech — ГРМ вовремя", "PureTech — timing", "PureTech — Таймінг"),
        body: L(
          "Kontrola łańcucha rozrządu i oleju — zapobiega kosztownym naprawom.",
          "Контроль цепи ГРМ и масла — профилактика.",
          "Inspection of the timing chain and oil — prevents costly repairs.",
          "Контроль ланцюга ГРМ та масла — профілактика."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
      {
        q: L("Czy serwisujecie Citroën?", "Citroën?", "Do you service Citroën?", "Citroën?"),
        a: L("Tak — grupa PSA, te same procedury.", "Да — группа PSA.", "Yes — PSA group, same procedures.", "Так — група пса."),
      },
    ],
    faqDuration: L("Peugeot / Citroën: od 1 godziny.", "Peugeot: от 1 часа.", "Peugeot / Citroën: from 1 hour.", "Peugeot: від 1 години."),
  },
  "serwis-volvo": {
    bookServiceId: "diagnostic",
    education: [
      {
        title: L("Niezależny serwis Volvo Warszawa", "Независимый сервис Volvo", "Volvo Independent Service Warsaw", "Незалежна служба Volvo"),
        body: L(
          "XC60, V60, S60, XC90 — diagnostyka VIDA-style, olej ACEA A5/C5, hamulce, klima. Niezależny warsztat — nie jesteśmy salonem Volvo.",
          "XC60, V60, S60 — диагностика, масло, тормоза. Независимый сервис, не салон Volvo.",
          "XC60, V60, S60, XC90 — VIDA-style diagnostics, ACEA A5/C5 oil, brakes, climate. Independent workshop — we are not a Volvo dealership.",
          "XC60, V60, S60 — діагностика, масло, гальма. Незалежний сервіс, а не салон Volvo."
        ),
      },
      {
        title: L("Hybrydy i Drive-E", "Гибриды и Drive-E", "Hybrids and Drive-E", "Гібриди та Drive-E"),
        body: L(
          "Serwis okresowy hybryd i silników Drive-E według specyfikacji — olej, filtry, diagnostyka Check Engine.",
          "ТО гибридов и Drive-E — масло, фильтры, Check Engine.",
          "Periodic service of hybrids and Drive-E engines according to specifications — oil, filters, Check Engine diagnostics.",
          "Технічне обслуговування гібридів та Drive-E — масло, фільтри, перевірка двигуна."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
      {
        q: L("Czy serwisujecie Volvo XC60 / V60?", "XC60 / V60?", "Do you service the Volvo XC60 / V60?", "XC60 / V60?"),
        a: L("Tak — popularne modele Volvo z południowej Warszawy.", "Да — популярные модели Volvo.", "Yes — popular Volvo models from southern Warsaw.", "Так — популярні моделі Volvo."),
      },
    ],
    faqDuration: L("Volvo: zwykle 1–3 godziny.", "Volvo: 1–3 часа.", "Volvo: usually 1–3 hours.", "Volvo: 1–3 години."),
    galleryTags: ["volvo"],
  },
  "serwis-hyundai": {
    bookServiceId: "oil",
    contentServiceId: "diagnostic",
    education: [
      {
        title: L("Niezależny serwis Hyundai Warszawa", "Независимый сервис Hyundai", "Independent Hyundai Warsaw service", "Незалежна служба Hyundai"),
        body: L(
          "i30, Tucson, Kona, i20 — olej, hamulce, klima, diagnostyka. Nie jesteśmy dealerem Hyundai.",
          "i30, Tucson, Kona — масло, тормоза, кондиционер. Мы не дилер Hyundai.",
          "i30, Tucson, Kona, i20 — oil, brakes, climate, diagnostics. We are not a Hyundai dealer.",
          "i30, Tucson, Kona — масло, гальма, кондиціонер. Ми не є дилером Hyundai."
        ),
      },
      {
        title: L("Kia / Hyundai — te same grupy", "Kia / Hyundai", "Kia / Hyundai — the same groups", "Kia / Hyundai"),
        body: L(
          "Wiele procedur serwisowych pokrywa się z Kia — dobieramy olej i klocki pod VIN.",
          "Многие процедуры как у Kia — масло и колодки по VIN.",
          "Many service procedures overlap with Kia — we choose the oil and blocks for the Vin.",
          "Багато процедур, як-от KIA — олія та прокладки VIN."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
      {
        q: L("Czy obsługujecie Tucson / i30?", "Tucson / i30?", "Do you support Tucson / i30?", "Tucson / i30?"),
        a: L("Tak — serwis okresowy i naprawy mechaniczne.", "Да — ТО и механика.", "Yes — periodic service and mechanical repairs.", "Так — технічне обслуговування та механіка."),
      },
    ],
    faqDuration: L("Hyundai: od 1 godziny.", "Hyundai: от 1 часа.", "Hyundai: from 1 hour.", "Hyundai: від 1 години."),
    galleryTags: ["hyundai"],
  },
  "serwis-kia": {
    bookServiceId: "oil",
    contentServiceId: "diagnostic",
    education: [
      {
        title: L("Niezależny serwis Kia Warszawa", "Независимый сервис Kia", "Independent Kia Warsaw service", "Незалежна служба Kia"),
        body: L(
          "Ceed, Sportage, Stonic, Rio — olej, hamulce, klima, diagnostyka. Nie jesteśmy dealerem Kia.",
          "Ceed, Sportage, Stonic — масло, тормоза, кондиционер. Мы не дилер Kia.",
          "Ceed, Sportage, Stonic, Rio — oil, brakes, climate, diagnostics. We are not a Kia dealer.",
          "Ceed, Sportage, Stonic — масло, гальма, кондиціонер. Ми не є дилером Kia."
        ),
      },
      {
        title: L("Gwarancja a niezależny serwis", "Гарантия и независимый сервис", "Warranty and independent service", "Гарантійне ТА незалежне обслуговування"),
        body: L(
          "Serwis niezależny z częściami jakości OE nie odbiera gwarancji ustawowej — prowadzimy historię wizyt.",
          "Независимый сервис с OE-качеством не снимает законную гарантию.",
          "Independent service with OE quality parts does not receive a statutory guarantee — we keep a history of visits.",
          "Незалежна послуга з якістю оригінальних комплектуючих не скасовує юридичну гарантію."
        ),
      },
    ],
    faqExtra: [
      BRAND_INDEPENDENT_FAQ,
      {
        q: L("Czy serwisujecie Kia Sportage / Ceed?", "Sportage / Ceed?", "Do you service Kia Sportage / Ceed?", "Sportage / Ceed?"),
        a: L("Tak — to jedne z najczęstszych aut u nas na Alei Krakowskiej.", "Да — частые авто у нас.", "Yes — it is one of the most common cars in our country on Aleja Krakowska.", "Так — у нас часто бувають машини."),
      },
    ],
    faqDuration: L("Kia: od 1 godziny.", "Kia: от 1 часа.", "Kia: from 1 hour.", "КІА: від 1 години."),
    galleryTags: ["kia"],
  },
  "check-engine": {
    bookServiceId: "diagnostic",
    steps: [
      {
        title: L("Opis objawów i rezerwacja", "Симптомы и запись", "Symptom description and reservation", "Симптоми та запис"),
        description: L(
          "Świeci się kontrolka — umów termin, opisz kiedy się zapala (na zimno, pod obciążeniem).",
          "Горит лампа — запишитесь, опишите когда загорается.",
          "The indicator light is on — make an appointment, describe when it lights up (cold, under load).",
          "Лампа ввімкнена — зареєструйтеся, опишіть, коли вона засвітиться."
        ),
      },
      {
        title: L("Odczyt kodów OBD", "Считывание OBD", "Reading OBD codes", "Зчитування OBD"),
        description: L(
          "Podłączamy skaner, odczytujemy błędy aktualne i zapisane w pamięci ECU.",
          "Сканер, текущие и сохранённые коды ECU.",
          "We connect the scanner, read the errors current and stored in the ECU memory.",
          "Сканер, поточні та збережені коди ECU."
        ),
      },
      {
        title: L("Analiza przyczyny", "Анализ причины", "Reason Analysis", "Аналіз причин"),
        description: L(
          "Sprawdzamy parametry na żywo — nie tylko kasujemy błąd, szukamy źródła.",
          "Живые параметры — ищем причину, не только сброс.",
          "We check live parameters — we not only delete the error, we look for the source.",
          "Живі параметри — пошук причини, а не просто скидання."
        ),
      },
      {
        title: L("Plan naprawy i wycena", "План и смета", "Recovery plan and pricing", "План і кошторис"),
        description: L(
          "Dostajesz listę rekomendowanych napraw — decydujesz co robimy od razu.",
          "Список рекомендаций — решаете, что делаем сейчас.",
          "You get a list of recommended repairs — you decide what we do right away.",
          "Список рекомендацій — вирішіть, що ми робимо зараз."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Czy kasowanie błędu wystarczy?", "Достаточно сброса?", "Is deleting an error enough?", "Чи достатньо скидання?"),
        a: L(
          "Nie zawsze — jeśli usterka zostaje, lampka wróci. Diagnozujemy przyczynę.",
          "Не всегда — если неисправность остаётся, лампа вернётся.",
          "Not always — if the fault remains, the lamp will come back. We diagnose the cause.",
          "Не завжди — якщо несправність залишиться, лампа повернеться."
        ),
      },
    ],
    price: {
      fromZl: getPriceItem("check_engine")?.basePrice === 0 ? 150 : 150,
      priceFrom: true,
      materialsExtra: false,
      includes: [
        L("Odczyt kodów Check Engine", "Считывание Check Engine", "Read Check Engine codes", "Читати Check Engine"),
        L("Omówienie z mechanikiem", "Разбор с механиком", "Discussion with the mechanic", "Обговорення з механіком"),
        L("Rekomendacje napraw", "Рекомендации", "Recommendations for repairs", "Рекомендації"),
      ],
      note: L("Krótki odczyt kodów może być bezpłatny — pełna diagnoza według cennika.", "Краткий оdczyt может быть бесплатным.", "A short reading of codes can be free — full diagnosis according to the price list.", "Короткий одцит може бути вільним."),
    },
  },
  "klocki-hamulcowe": {
    bookServiceId: "brakePads",
    faqDuration: L("Wymiana klocków: ok. 1–2 godziny.", "Колодки: 1–2 часа.", "Replacement of blocks: approx. 1–2 hours.", "Подушечки: 1–2 години."),
    galleryTags: ["hamulc", "brake", "klock", "колод"],
  },
  "serwis-klimatyzacji": {
    bookServiceId: "acRefill",
    faqDuration: L("Nabicie i odgrzybianie: 1–2 godziny.", "Заправка: 1–2 часа.", "Charging and antifungal treatment: 1–2 hours.", "Заправка: 1–2 години."),
  },
  "chip-tuning-warszawa": {
    bookServiceId: "chip",
    price: chipPriceTable,
    faqDuration: L("Stage 1: zwykle 1 dzień roboczy.", "Stage 1: обычно 1 рабочий день.", "Stage 1: usually 1 business day.", "Етап 1: зазвичай 1 робочий день."),
  },
  promocje: {
    bookServiceId: "otherReason",
    steps: [
      {
        title: L("Sprawdź aktualne promocje", "Актуальные акции", "Check current promotions", "Поточні промоакції"),
        description: L(
          "Aktualna oferta: wymiana oleju 80 zł + zawieszenie gratis przy oleju, hamulce z kodem BessMotors. Szczegóły na stronie promocji.",
          "Актуальная акция: замена масла 80 zł + подвеска бесплатно при масле, тормоза по коду BessMotors. Подробности на странице акций.",
          "Current offer: oil change PLN 80 + free suspension with oil, brakes with BessMotors code. Details on the promotion page.",
          "Фактичне просування: заміна масла 80 злотих + підвіска без масла, гальма відповідно до кодексу BessMotors. Докладніше на сторінці промоакцій."
        ),
      },
      {
        title: L("Powiedz kod przy przyjęciu auta", "Назовите код при приёмке", "Say the code when you pick up the car", "Назвіть код після прийняття"),
        description: L(
          "Kod BessMotors działa na robociznę i części według aktualnych warunków promocji.",
          "Код BessMotors действует на работы и запчасти по актуальным условиям акции.",
          "The BessMotors code works on labor and parts according to the current terms of the promotion.",
          "Код BessMotors дійсний для робіт та запасних частин відповідно до поточних умов акції."
        ),
      },
      {
        title: L("Wizyta w warsztacie", "Визит", "6. Machine shop visit", "Візит"),
        description: L(
          "Realizujemy usługę według warunków promocji — bez ukrytych dopłat.",
          "Услуга по условиям акции — без скрытых доплат.",
          "We provide the service according to the terms of the promotion — without hidden surcharges.",
          "Послуга за умовами акції без прихованих доплат."
        ),
      },
      {
        title: L("Odbiór z rabatem", "Выдача со скидкой", "Rebate pickup", "Висадка зі знижкою"),
        description: L(
          "Paragon z zastosowaną zniżką — zachowaj na kolejną wizytę program poleceń.",
          "Чек со скидкой — программа рефералов.",
          "Receipt with discount applied — save the referral program for your next visit.",
          "Чек зі знижкою — це програма рекомендацій."
        ),
      },
    ],
    education: [
      {
        title: L("Kod BessMotors — −15% na naprawę", "Промокод BessMotors — −15%", "BessMotors code — −15% for repair", "Промокод BessMotors — −15%"),
        body: L(
          "Podaj menedżerowi kod BessMotors przy przyjęciu auta — 15% rabatu na robociznę i części. Dotyczy wszystkich usług warsztatu.",
          "Назовите менеджеру промокод BessMotors — 15% скидка на работы и запчасти. На все виды ремонта.",
          "Give the manager the BessMotors code when you take the car — 15% discount on labor and parts. Applies to all workshop services.",
          "Подаруйте менеджеру промокод BessMotors — знижка 15% на роботи та запчастини. Для всіх видів ремонту."
        ),
      },
      {
        title: L("Klimatyzacja — cennik usługi", "Кондиционер — прайс услуги", "Air conditioning — price list", "Кондиціонер — прайс-лист послуг"),
        body: L(
          "Nabijanie klimatyzacji: podłączenie i gaz według cennika. Szczegóły na /klimatyzacja.",
          "Заправка кондиционера: подключение и газ по прайсу. Подробности на /klimatyzacja.",
          "Air conditioning charging: connection and gas according to the price list. Details on /air conditioning.",
          "Заряджання кондиціонера: підключення та газ згідно прайс-листу. Докладніше за посиланням /klimatyzacja."
        ),
      },
      {
        title: L("Program poleceń", "Реферальная программа", "Merchant Referral Programme", "Реферальна програма"),
        body: L(
          "Poleć znajomego — oboje dostajecie bonus na kolejną wizytę. Szczegóły na /referral.",
          "Приведи друга — бонус обоим. Подробности на /referral.",
          "Refer a friend — you both get a bonus for your next visit. Details on /referral.",
          "Приведи друга — бонус для обох. Подробиці щодо /направлення."
        ),
      },
    ],
    faqExtra: [
      {
        q: L("Jaki jest aktualny kod rabatowy?", "Какой сейчас промокод?", "What is the current discount code?", "Який промокод зараз?"),
        a: L(
          "BessMotors — 15% rabatu na robociznę i części. Podaj kod menedżerowi przy przyjęciu auta.",
          "BessMotors — 15% на работы и запчасти. Назовите код менеджеру при сдаче авто.",
          "BessMotors — 15% discount on labor and parts. Enter the code to the manager when you pick up the car.",
          "BessMotors — 15% на роботи та запчастини. Надайте код менеджеру під час висадки автомобіля."
        ),
      },
      {
        q: L("Gdzie wpisać kod rabatowy?", "Куда ввести промокод?", "Where to enter the discount code?", "Де ввести промокод?"),
        a: L("Powiedz kod BessMotors menedżerowi przy przyjęciu — zniżka naliczy się przy rozliczeniu.", "Назовите код BessMotors менеджеру при приёмке — скидка при оплате.", "Tell the BessMotors code to the manager at the reception — the discount will be applied at the billing.", "Надати код BessMotors менеджеру при прийнятті — знижка при оплаті."),
      },
    ],
    price: {
      fromZl: 0,
      priceFrom: false,
      materialsExtra: false,
      includes: [
        L("Kod BessMotors — −15% robocizna i części", "BessMotors — −15% работы и запчасти", "BessMotors Code — −15% Labour & Parts", "BessMotors — −15% роботи та запчастин"),
        L("Klimatyzacja — cennik na /klimatyzacja", "Кондиционер — прайс на /klimatyzacja", "Air conditioning — price list for /air conditioning", "Кондиціонер — прайс-лист на /klimatyzacja"),
      ],
      note: L("Kod podaj menedżerowi. Klimatyzacja — ceny promocyjne według /klimatyzacja.", "Код менеджеру. Кондиционер — по акции на /klimatyzacja.", "Give the code to the manager. Air conditioning — promotional prices by /air conditioning.", "Код менеджеру. Кондиціонер — для акції на /klimatyzacja."),
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
