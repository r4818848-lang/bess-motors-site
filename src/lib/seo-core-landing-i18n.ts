/** Core SEO landing heroes — RU / EN / UK (PL from seo-landing-pages). */
import type { SeoLandingPage } from "@/lib/seo-landing-pages";

type SeoText = Pick<SeoLandingPage, "title" | "line1" | "line2" | "metaTitle" | "metaDescription">;

export const CORE_SEO_RU: Partial<Record<string, SeoText>> = {
  "naprawa-klimatyzacji": {
    title: "Ремонт автокондиционера",
    line1: "Утечки, компрессор, радиатор, трубки",
    line2: "Диагностика, сварка и замена элементов",
    metaTitle: "Ремонт кондиционера Варшава",
    metaDescription:
      "Ремонт автокондиционера в BESS MOTORS — утечки, компрессор, радиатор, трубки. Варшава Włochy, Aleja Krakowska 48/52.",
  },
  "geometria": {
    title: "Развал-схождение",
    line1: "Настройка углов колёс",
    line2: "Авто не уводит в сторону",
    metaTitle: "Развал-схождение Варшава Włochy",
    metaDescription:
      "Развал-схождение в BESS MOTORS Варшава. Авто уводит в сторону — настройка осей. Aleja Krakowska 48/52, Włochy.",
  },
  "silnik": {
    title: "Ремонт двигателя",
    line1: "Диагностика и ремонт двигателя",
    line2: "Опытные механики",
    metaTitle: "Ремонт двигателя Варшава — диагностика",
    metaDescription:
      "Ремонт двигателя в BESS MOTORS Варшава Włochy — диагностика, течи, ГРМ, турбина. Aleja Krakowska 48/52.",
  },
  "elektryka": {
    title: "Автоэлектрик",
    line1: "Ошибки, датчики, проводка",
    line2: "Современная диагностика авто",
    metaTitle: "Автоэлектрик Варшава Włochy",
    metaDescription:
      "Автоэлектрик Варшава — Check Engine, датчики, проводка, стартер, генератор. BESS MOTORS Aleja Krakowska 48/52.",
  },
  "przeglad": {
    title: "Подготовка к техосмотру",
    line1: "Подготовка авто к осмотру",
    line2: "Выше шанс положительного результата",
    metaTitle: "Подготовка к техосмотру Варшава",
    metaDescription:
      "Подготовка авто к техосмотру — выше шанс успешного прохождения. BESS MOTORS Варшава.",
  },
  "opony": {
    title: "Шиномонтаж",
    line1: "Замена и балансировка шин",
    line2: "Быстрое обслуживание без очередей",
    metaTitle: "Шиномонтаж Варшава — замена шин Włochy",
    metaDescription:
      "Шиномонтаж Варшава Włochy: замена и балансировка шин без очереди. BESS MOTORS, Aleja Krakowska 48/52.",
  },
  "bmw": {
    title: "Сервис BMW",
    line1: "Независимый сервис BMW — Варшава",
    line2: "Опыт с маркой · детали OEM/OES",
    metaTitle: "Независимый сервис BMW Варшава",
    metaDescription:
      "Независимый сервис BMW в Варшаве — диагностика, механика, масло. Мы не дилер BMW. BESS MOTORS, Aleja Krakowska.",
  },
  "mercedes": {
    title: "Сервис Mercedes",
    line1: "Независимый сервис Mercedes — Варшава",
    line2: "Диагностика и ремонт премиум-авто",
    metaTitle: "Независимый сервис Mercedes Варшава",
    metaDescription:
      "Независимый сервис Mercedes — диагностика, ремонт, масло. Мы не официальный салон Mercedes. BESS MOTORS.",
  },
  "vag": {
    title: "Сервис Audi / VW",
    line1: "Независимый сервис группы VAG",
    line2: "Audi, VW, Skoda, Seat — Варшава",
    metaTitle: "Сервис VAG Варшава — независимый сервис",
    metaDescription:
      "Независимый сервис VAG (Audi, VW, Skoda, Seat) — диагностика и ремонт. Мы не дилер марок группы. BESS MOTORS.",
  },
  "kontakt": {
    title: "Запись онлайн",
    line1: "Удобное бронирование времени",
    line2: "Выберите удобный день и час",
    metaTitle: "Запись онлайн — BESS MOTORS",
    metaDescription:
      "Запишитесь онлайн в BESS MOTORS — выберите удобный день и час. Варшава, Aleja Krakowska 48/52.",
  },
  "warszawa-wlochy": {
    title: "Автосервис Włochy / Okęcie",
    line1: "Рядом с Aleja Krakowska",
    line2: "Диагностика, ремонт, сервис",
    metaTitle: "Механик Włochy Варшава — BESS MOTORS",
    metaDescription:
      "Автосервис на Aleja Krakowska 48/52 — Włochy, Okęcie (~5 мин). Диагностика, тормоза, масло, кондиционер.",
  },
  "warszawa-ursynow": {
    title: "Сервис для Ursynów",
    line1: "Доезд с Ursynów и Mokotów",
    line2: "Запись онлайн",
    metaTitle: "Автосервис Ursynów — BESS MOTORS",
    metaDescription:
      "BESS MOTORS — сервис для Ursynów (Kabaty, Natolin, Stokłosy). Доезд ~15–20 мин. Ремонт, диагностика, шины.",
  },
  "warszawa-mokotow": {
    title: "Сервис для Mokotów",
    line1: "Służewiec, Okęcie, южный Mokotów",
    line2: "Рядом с Aleja Krakowska — ~10–15 мин",
    metaTitle: "Механик Mokotów Варшава — BESS MOTORS",
    metaDescription:
      "Автосервис для Mokotów — Służewiec, Wyględów, Okęcie. BESS MOTORS, Aleja Krakowska 48/52.",
  },
  "warszawa-ochota": {
    title: "Сервис для Ochota",
    line1: "Rakowiec, Szczęśliwice — доезд ~15 мин",
    line2: "Запись онлайн без очереди",
    metaTitle: "Механик Ochota Варшава — BESS MOTORS",
    metaDescription:
      "Механик для Ochota и Rakowiec — BESS MOTORS на Aleja Krakowska 48/52. Тормоза, диагностика, кондиционер, масло.",
  },
  "serwis-audi": {
    title: "Сервис Audi",
    line1: "Независимый сервис Audi",
    line2: "Диагностика VAG · детали OEM/OES",
    metaTitle: "Независимый сервис Audi Варшава",
    metaDescription:
      "Независимый сервис Audi — диагностика, тормоза, масло, DSG. Мы не салон Audi. BESS MOTORS Варшава.",
  },
  "serwis-toyota": {
    title: "Сервис Toyota / Lexus",
    line1: "Независимый сервис Toyota / Lexus",
    line2: "Гибриды и бензиновые моторы",
    metaTitle: "Независимый сервис Toyota Варшава",
    metaDescription:
      "Независимый сервис Toyota и Lexus — диагностика, тормоза, масло. Мы не дилер Toyota. BESS MOTORS.",
  },
  "serwis-opel": {
    title: "Сервис Opel",
    line1: "Независимый сервис Opel / Chevrolet",
    line2: "Диагностика и детали OEM/OES",
    metaTitle: "Независимый сервис Opel Варшава",
    metaDescription:
      "Независимый сервис Opel — ремонт, диагностика, ТО. Мы не дилер Opel. BESS MOTORS.",
  },
  "serwis-ford": {
    title: "Сервис Ford",
    line1: "Независимый сервис Ford",
    line2: "Focus, Kuga, Mondeo — диагностика",
    metaTitle: "Независимый сервис Ford Варшава",
    metaDescription:
      "Независимый сервис Ford — ремонт, диагностика, масло. Мы не дилер Ford. BESS MOTORS.",
  },
  "serwis-renault": {
    title: "Сервис Renault / Dacia",
    line1: "Независимый сервис Renault / Dacia",
    line2: "Варшава Włochy",
    metaTitle: "Независимый сервис Renault Варшава",
    metaDescription:
      "Независимый сервис Renault и Dacia. Мы не дилер Renault. BESS MOTORS Aleja Krakowska.",
  },
  "serwis-peugeot": {
    title: "Сервис Peugeot / Citroën",
    line1: "Независимый сервис Peugeot / Citroën",
    line2: "Тормоза, подвеска, масло",
    metaTitle: "Независимый сервис Peugeot Варшава",
    metaDescription:
      "Независимый сервис Peugeot и Citroën. Мы не авторизованный сервис PSA. BESS MOTORS.",
  },
  "serwis-volvo": {
    title: "Сервис Volvo",
    line1: "Независимый сервис Volvo — Варшава",
    line2: "XC60, V60, S60 — диагностика и масло",
    metaTitle: "Независимый сервис Volvo Варшава — BESS MOTORS",
    metaDescription:
      "Независимый сервис Volvo — диагностика, масло, тормоза, кондиционер. Мы не дилер Volvo. BESS MOTORS.",
  },
  "serwis-hyundai": {
    title: "Сервис Hyundai",
    line1: "Независимый сервис Hyundai — Варшава",
    line2: "i30, Tucson, Kona — ТО",
    metaTitle: "Независимый сервис Hyundai Варшава — BESS MOTORS",
    metaDescription:
      "Независимый сервис Hyundai — масло, тормоза, кондиционер, диагностика. Мы не дилер Hyundai. BESS MOTORS Włochy.",
  },
  "serwis-kia": {
    title: "Сервис Kia",
    line1: "Независимый сервис Kia — Варшава",
    line2: "Ceed, Sportage, Stonic — тормоза и масло",
    metaTitle: "Независимый сервис Kia Варшава — BESS MOTORS",
    metaDescription:
      "Независимый сервис Kia — диагностика, тормоза, масло, кондиционер. Мы не дилер Kia. BESS MOTORS.",
  },
  "klocki-hamulcowe": {
    title: "Замена тормозных колодок",
    line1: "Скрип, скрежет, длинный путь торможения?",
    line2: "Тормоза в BESS MOTORS",
    metaTitle: "Тормозные колодки Варшава — BESS MOTORS",
    metaDescription:
      "Замена колодок и дисков. Быстрый визит, гарантия на работу. BESS MOTORS Варшава.",
  },
  "serwis-klimatyzacji": {
    title: "Сервис кондиционера",
    line1: "Заправка и сервис климатической системы",
    line2: "R134a, R1234yf и антибактериальная обработка",
    metaTitle: "Сервис кондиционера Варшава — BESS MOTORS",
    metaDescription:
      "Сервис автокондиционера в BESS MOTORS — заправка R134a/R1234yf, диагностика. Варшава Włochy.",
  },
  "chip-tuning-warszawa": {
    title: "Chip tuning Варшава",
    line1: "Больше мощности и момента",
    line2: "Stage 1 и Stage 2 — безопасно",
    metaTitle: "Chip tuning Варшава — Stage 1 / Stage 2",
    metaDescription:
      "Chip tuning в BESS MOTORS — Stage 1 от 1200 zł, Stage 2 от 2500 zł. Диагностика до тюнинга, карта ECU. Варшава.",
  },
  "promocje": {
    title: "Акции и скидки",
    line1: "Актуальные акции сервиса",
    line2: "Экономьте на ремонте авто",
    metaTitle: "Акции BESS MOTORS — масло 80 zł + подвеска бесплатно",
    metaDescription:
      "Код BessMotors: замена масла 80 zł (было 150) + проверка подвески бесплатно при масле, колодки от 100 zł. Варшава Włochy.",
  },
};

export const CORE_SEO_EN: Partial<Record<string, SeoText>> = {
  "naprawa-klimatyzacji": {
    title: "Car A/C repair",
    line1: "Leaks, compressor, condenser, pipes",
    line2: "Diagnostics, welding and part replacement",
    metaTitle: "Car A/C repair Warsaw",
    metaDescription:
      "Car air-conditioning repair at BESS MOTORS — leaks, compressor, condenser, lines. Warsaw Włochy, Aleja Krakowska 48/52.",
  },
  "geometria": {
    title: "Wheel alignment",
    line1: "Toe and camber setup",
    line2: "Stop the car pulling to one side",
    metaTitle: "Wheel alignment Warsaw Włochy",
    metaDescription:
      "Wheel alignment at BESS MOTORS Warsaw. Car pulls aside — axle geometry setup. Aleja Krakowska 48/52, Włochy.",
  },
  "silnik": {
    title: "Engine repair",
    line1: "Engine diagnostics and repair",
    line2: "Experienced mechanics",
    metaTitle: "Engine repair Warsaw — diagnostics",
    metaDescription:
      "Engine repair at BESS MOTORS Warsaw Włochy — diagnostics, leaks, timing belt, turbo. Aleja Krakowska 48/52.",
  },
  "elektryka": {
    title: "Car electrician",
    line1: "Faults, sensors, wiring",
    line2: "Modern vehicle diagnostics",
    metaTitle: "Car electrician Warsaw Włochy",
    metaDescription:
      "Car electrician in Warsaw — Check Engine, sensors, wiring, starter, alternator. BESS MOTORS Aleja Krakowska 48/52.",
  },
  "przeglad": {
    title: "Pre-inspection prep",
    line1: "Get the car ready for inspection",
    line2: "Improve the chance of a pass",
    metaTitle: "Car inspection prep Warsaw",
    metaDescription:
      "Prepare your car for technical inspection — improve the chance of a pass. BESS MOTORS Warsaw.",
  },
  "opony": {
    title: "Tyre fitting",
    line1: "Tyre change and balancing",
    line2: "Fast service without long queues",
    metaTitle: "Tyre fitting Warsaw — tyre change Włochy",
    metaDescription:
      "Tyre fitting in Warsaw Włochy: change and balancing without the queue. BESS MOTORS, Aleja Krakowska 48/52.",
  },
  "bmw": {
    title: "BMW service",
    line1: "Independent BMW workshop — Warsaw",
    line2: "Brand experience · OEM/OES parts",
    metaTitle: "Independent BMW service Warsaw",
    metaDescription:
      "Independent BMW workshop in Warsaw — diagnostics, mechanics, oil. We are not a BMW dealer. BESS MOTORS.",
  },
  "mercedes": {
    title: "Mercedes service",
    line1: "Independent Mercedes workshop — Warsaw",
    line2: "Diagnostics and repairs for premium cars",
    metaTitle: "Independent Mercedes service Warsaw",
    metaDescription:
      "Independent Mercedes workshop — diagnostics, repair, oil service. We are not an authorised Mercedes dealer. BESS MOTORS.",
  },
  "vag": {
    title: "Audi / VW service",
    line1: "Independent VAG group workshop",
    line2: "Audi, VW, Skoda, Seat — Warsaw",
    metaTitle: "VAG service Warsaw — independent workshop",
    metaDescription:
      "Independent VAG service (Audi, VW, Skoda, Seat) — diagnostics and repairs. We are not a group dealer. BESS MOTORS.",
  },
  "kontakt": {
    title: "Book a visit online",
    line1: "Convenient appointment booking",
    line2: "Pick a day and time that suits you",
    metaTitle: "Book online — BESS MOTORS",
    metaDescription:
      "Book a visit online at BESS MOTORS — choose a convenient day and time. Warsaw, Aleja Krakowska 48/52.",
  },
  "warszawa-wlochy": {
    title: "Car service Włochy / Okęcie",
    line1: "Near Aleja Krakowska",
    line2: "Diagnostics, repairs, servicing",
    metaTitle: "Mechanic Włochy Warsaw — BESS MOTORS",
    metaDescription:
      "Workshop at Aleja Krakowska 48/52 — Włochy, Okęcie (~5 min). Diagnostics, brakes, oil, A/C.",
  },
  "warszawa-ursynow": {
    title: "Service for Ursynów",
    line1: "Easy from Ursynów and Mokotów",
    line2: "Book online",
    metaTitle: "Car service Ursynów — BESS MOTORS",
    metaDescription:
      "BESS MOTORS — workshop for Ursynów (Kabaty, Natolin, Stokłosy). About 15–20 min drive. Repairs, diagnostics, tyres.",
  },
  "warszawa-mokotow": {
    title: "Service for Mokotów",
    line1: "Służewiec, Okęcie, southern Mokotów",
    line2: "Near Aleja Krakowska — about 10–15 min",
    metaTitle: "Mechanic Mokotów Warsaw — BESS MOTORS",
    metaDescription:
      "Car service for Mokotów — Służewiec, Wyględów, Okęcie. BESS MOTORS, Aleja Krakowska 48/52.",
  },
  "warszawa-ochota": {
    title: "Service for Ochota",
    line1: "Rakowiec, Szczęśliwice — about 15 min",
    line2: "Book online without the queue",
    metaTitle: "Mechanic Ochota Warsaw — BESS MOTORS",
    metaDescription:
      "Mechanic for Ochota and Rakowiec — BESS MOTORS at Aleja Krakowska 48/52. Brakes, diagnostics, A/C, oil.",
  },
  "serwis-audi": {
    title: "Audi service",
    line1: "Independent Audi workshop",
    line2: "VAG diagnostics · OEM/OES parts",
    metaTitle: "Independent Audi service Warsaw",
    metaDescription:
      "Independent Audi workshop — diagnostics, brakes, oil, DSG. We are not an Audi dealer. BESS MOTORS Warsaw.",
  },
  "serwis-toyota": {
    title: "Toyota / Lexus service",
    line1: "Independent Toyota / Lexus workshop",
    line2: "Hybrids and petrol engines",
    metaTitle: "Independent Toyota service Warsaw",
    metaDescription:
      "Independent Toyota and Lexus workshop — diagnostics, brakes, oil. We are not a Toyota dealer. BESS MOTORS.",
  },
  "serwis-opel": {
    title: "Opel service",
    line1: "Independent Opel / Chevrolet workshop",
    line2: "Diagnostics and OEM/OES parts",
    metaTitle: "Independent Opel service Warsaw",
    metaDescription:
      "Independent Opel workshop — repairs, diagnostics, servicing. We are not an Opel dealer. BESS MOTORS.",
  },
  "serwis-ford": {
    title: "Ford service",
    line1: "Independent Ford workshop",
    line2: "Focus, Kuga, Mondeo — diagnostics",
    metaTitle: "Independent Ford service Warsaw",
    metaDescription:
      "Independent Ford workshop — repairs, diagnostics, oil. We are not a Ford dealer. BESS MOTORS.",
  },
  "serwis-renault": {
    title: "Renault / Dacia service",
    line1: "Independent Renault / Dacia workshop",
    line2: "Warsaw Włochy",
    metaTitle: "Independent Renault service Warsaw",
    metaDescription:
      "Independent Renault and Dacia workshop. We are not a Renault dealer. BESS MOTORS Aleja Krakowska.",
  },
  "serwis-peugeot": {
    title: "Peugeot / Citroën service",
    line1: "Independent Peugeot / Citroën workshop",
    line2: "Brakes, suspension, oil",
    metaTitle: "Independent Peugeot service Warsaw",
    metaDescription:
      "Independent Peugeot and Citroën workshop. We are not an authorised PSA dealer. BESS MOTORS.",
  },
  "serwis-volvo": {
    title: "Volvo service",
    line1: "Independent Volvo workshop — Warsaw",
    line2: "XC60, V60, S60 — diagnostics and oil",
    metaTitle: "Independent Volvo service Warsaw — BESS MOTORS",
    metaDescription:
      "Independent Volvo workshop — diagnostics, oil, brakes, A/C. We are not a Volvo dealer. BESS MOTORS.",
  },
  "serwis-hyundai": {
    title: "Hyundai service",
    line1: "Independent Hyundai workshop — Warsaw",
    line2: "i30, Tucson, Kona — scheduled service",
    metaTitle: "Independent Hyundai service Warsaw — BESS MOTORS",
    metaDescription:
      "Independent Hyundai workshop — oil, brakes, A/C, diagnostics. We are not a Hyundai dealer. BESS MOTORS Włochy.",
  },
  "serwis-kia": {
    title: "Kia service",
    line1: "Independent Kia workshop — Warsaw",
    line2: "Ceed, Sportage, Stonic — brakes and oil",
    metaTitle: "Independent Kia service Warsaw — BESS MOTORS",
    metaDescription:
      "Independent Kia workshop — diagnostics, brakes, oil, A/C. We are not a Kia dealer. BESS MOTORS.",
  },
  "klocki-hamulcowe": {
    title: "Brake pad replacement",
    line1: "Squeal, grinding, longer stopping distance?",
    line2: "Brakes at BESS MOTORS",
    metaTitle: "Brake pads Warsaw — BESS MOTORS",
    metaDescription:
      "Brake pad and disc replacement. Fast visit, warranty on labour. BESS MOTORS Warsaw.",
  },
  "serwis-klimatyzacji": {
    title: "A/C service",
    line1: "Recharge and climate-system service",
    line2: "R134a, R1234yf and antibacterial treatment",
    metaTitle: "A/C service Warsaw — BESS MOTORS",
    metaDescription:
      "Car A/C service at BESS MOTORS — R134a/R1234yf recharge, diagnostics. Warsaw Włochy.",
  },
  "chip-tuning-warszawa": {
    title: "Chip tuning Warsaw",
    line1: "More power and torque",
    line2: "Stage 1 and Stage 2 — done safely",
    metaTitle: "Chip tuning Warsaw — Stage 1 / Stage 2",
    metaDescription:
      "Chip tuning at BESS MOTORS — Stage 1 from 1200 zł, Stage 2 from 2500 zł. Pre-tune diagnostics, ECU map. Warsaw.",
  },
  "promocje": {
    title: "Promos and discounts",
    line1: "Current workshop promotions",
    line2: "Save on car repairs",
    metaTitle: "BESS MOTORS promos — oil 80 zł + free suspension check",
    metaDescription:
      "Code BessMotors: oil change 80 zł (was 150) + free suspension check with oil, pads from 100 zł. Warsaw Włochy.",
  },
};

export const CORE_SEO_UK: Partial<Record<string, SeoText>> = {
  "naprawa-klimatyzacji": {
    title: "Ремонт автокондиціонера",
    line1: "Витоки, компресор, радіатор, трубки",
    line2: "Діагностика, зварювання та заміна елементів",
    metaTitle: "Ремонт кондиціонера Варшава",
    metaDescription:
      "Ремонт автокондиціонера в BESS MOTORS — витоки, компресор, радіатор. Варшава Włochy, Aleja Krakowska 48/52.",
  },
  "geometria": {
    title: "Розвал-сходження",
    line1: "Налаштування кутів коліс",
    line2: "Авто не відводить убік",
    metaTitle: "Розвал-сходження Варшава Włochy",
    metaDescription:
      "Розвал-сходження в BESS MOTORS Варшава. Авто відводить убік — налаштування осей. Aleja Krakowska 48/52.",
  },
  "silnik": {
    title: "Ремонт двигуна",
    line1: "Діагностика та ремонт двигуна",
    line2: "Досвідчені механіки",
    metaTitle: "Ремонт двигуна Варшава — діагностика",
    metaDescription:
      "Ремонт двигуна в BESS MOTORS Варшава Włochy — діагностика, течі, ГРМ, турбіна. Aleja Krakowska 48/52.",
  },
  "elektryka": {
    title: "Автоелектрик",
    line1: "Помилки, датчики, проводка",
    line2: "Сучасна діагностика авто",
    metaTitle: "Автоелектрик Варшава Włochy",
    metaDescription:
      "Автоелектрик Варшава — Check Engine, датчики, проводка, стартер, генератор. BESS MOTORS Aleja Krakowska 48/52.",
  },
  "przeglad": {
    title: "Підготовка до техогляду",
    line1: "Підготовка авто до огляду",
    line2: "Вищий шанс позитивного результату",
    metaTitle: "Підготовка до техогляду Варшава",
    metaDescription:
      "Підготовка авто до техогляду — вищий шанс успішного проходження. BESS MOTORS Варшава.",
  },
  "opony": {
    title: "Шиномонтаж",
    line1: "Заміна та балансування шин",
    line2: "Швидке обслуговування без черг",
    metaTitle: "Шиномонтаж Варшава — заміна шин Włochy",
    metaDescription:
      "Шиномонтаж Варшава Włochy: заміна й балансування шин без черги. BESS MOTORS, Aleja Krakowska 48/52.",
  },
  "bmw": {
    title: "Сервіс BMW",
    line1: "Незалежний сервіс BMW — Варшава",
    line2: "Досвід з маркою · деталі OEM/OES",
    metaTitle: "Незалежний сервіс BMW Варшава",
    metaDescription:
      "Незалежний сервіс BMW у Варшаві — діагностика, механіка, олива. Ми не дилер BMW. BESS MOTORS.",
  },
  "mercedes": {
    title: "Сервіс Mercedes",
    line1: "Незалежний сервіс Mercedes — Варшава",
    line2: "Діагностика та ремонт преміум-авто",
    metaTitle: "Незалежний сервіс Mercedes Варшава",
    metaDescription:
      "Незалежний сервіс Mercedes — діагностика, ремонт, олива. Ми не офіційний салон Mercedes. BESS MOTORS.",
  },
  "vag": {
    title: "Сервіс Audi / VW",
    line1: "Незалежний сервіс групи VAG",
    line2: "Audi, VW, Skoda, Seat — Варшава",
    metaTitle: "Сервіс VAG Варшава — незалежний сервіс",
    metaDescription:
      "Незалежний сервіс VAG (Audi, VW, Skoda, Seat) — діагностика та ремонт. Ми не дилер марок групи. BESS MOTORS.",
  },
  "kontakt": {
    title: "Запис онлайн",
    line1: "Зручне бронювання часу",
    line2: "Оберіть зручний день і годину",
    metaTitle: "Запис онлайн — BESS MOTORS",
    metaDescription:
      "Запишіться онлайн у BESS MOTORS — оберіть зручний день і годину. Варшава, Aleja Krakowska 48/52.",
  },
  "warszawa-wlochy": {
    title: "Автосервіс Włochy / Okęcie",
    line1: "Поруч з Aleja Krakowska",
    line2: "Діагностика, ремонт, сервіс",
    metaTitle: "Механік Włochy Варшава — BESS MOTORS",
    metaDescription:
      "Автосервіс на Aleja Krakowska 48/52 — Włochy, Okęcie (~5 хв). Діагностика, гальма, олива, кондиціонер.",
  },
  "warszawa-ursynow": {
    title: "Сервіс для Ursynów",
    line1: "Доїзд з Ursynów і Mokotów",
    line2: "Запис онлайн",
    metaTitle: "Автосервіс Ursynów — BESS MOTORS",
    metaDescription:
      "BESS MOTORS — сервіс для Ursynów (Kabaty, Natolin, Stokłosy). Доїзд ~15–20 хв. Ремонт, діагностика, шини.",
  },
  "warszawa-mokotow": {
    title: "Сервіс для Mokotów",
    line1: "Służewiec, Okęcie, південний Mokotów",
    line2: "Поруч з Aleja Krakowska — ~10–15 хв",
    metaTitle: "Механік Mokotów Варшава — BESS MOTORS",
    metaDescription:
      "Автосервіс для Mokotów — Służewiec, Wyględów, Okęcie. BESS MOTORS, Aleja Krakowska 48/52.",
  },
  "warszawa-ochota": {
    title: "Сервіс для Ochota",
    line1: "Rakowiec, Szczęśliwice — доїзд ~15 хв",
    line2: "Запис онлайн без черги",
    metaTitle: "Механік Ochota Варшава — BESS MOTORS",
    metaDescription:
      "Механік для Ochota і Rakowiec — BESS MOTORS на Aleja Krakowska 48/52. Гальма, діагностика, кондиціонер, олива.",
  },
  "serwis-audi": {
    title: "Сервіс Audi",
    line1: "Незалежний сервіс Audi",
    line2: "Діагностика VAG · деталі OEM/OES",
    metaTitle: "Незалежний сервіс Audi Варшава",
    metaDescription:
      "Незалежний сервіс Audi — діагностика, гальма, олива, DSG. Ми не салон Audi. BESS MOTORS Варшава.",
  },
  "serwis-toyota": {
    title: "Сервіс Toyota / Lexus",
    line1: "Незалежний сервіс Toyota / Lexus",
    line2: "Гібриди та бензинові мотори",
    metaTitle: "Незалежний сервіс Toyota Варшава",
    metaDescription:
      "Незалежний сервіс Toyota і Lexus — діагностика, гальма, олива. Ми не дилер Toyota. BESS MOTORS.",
  },
  "serwis-opel": {
    title: "Сервіс Opel",
    line1: "Незалежний сервіс Opel / Chevrolet",
    line2: "Діагностика та деталі OEM/OES",
    metaTitle: "Незалежний сервіс Opel Варшава",
    metaDescription:
      "Незалежний сервіс Opel — ремонт, діагностика, ТО. Ми не дилер Opel. BESS MOTORS.",
  },
  "serwis-ford": {
    title: "Сервіс Ford",
    line1: "Незалежний сервіс Ford",
    line2: "Focus, Kuga, Mondeo — діагностика",
    metaTitle: "Незалежний сервіс Ford Варшава",
    metaDescription:
      "Незалежний сервіс Ford — ремонт, діагностика, олива. Ми не дилер Ford. BESS MOTORS.",
  },
  "serwis-renault": {
    title: "Сервіс Renault / Dacia",
    line1: "Незалежний сервіс Renault / Dacia",
    line2: "Варшава Włochy",
    metaTitle: "Незалежний сервіс Renault Варшава",
    metaDescription:
      "Незалежний сервіс Renault і Dacia. Ми не дилер Renault. BESS MOTORS Aleja Krakowska.",
  },
  "serwis-peugeot": {
    title: "Сервіс Peugeot / Citroën",
    line1: "Незалежний сервіс Peugeot / Citroën",
    line2: "Гальма, підвіска, олива",
    metaTitle: "Незалежний сервіс Peugeot Варшава",
    metaDescription:
      "Незалежний сервіс Peugeot і Citroën. Ми не авторизований сервіс PSA. BESS MOTORS.",
  },
  "serwis-volvo": {
    title: "Сервіс Volvo",
    line1: "Незалежний сервіс Volvo — Варшава",
    line2: "XC60, V60, S60 — діагностика та олива",
    metaTitle: "Незалежний сервіс Volvo Варшава — BESS MOTORS",
    metaDescription:
      "Незалежний сервіс Volvo — діагностика, олива, гальма, кондиціонер. Ми не дилер Volvo. BESS MOTORS.",
  },
  "serwis-hyundai": {
    title: "Сервіс Hyundai",
    line1: "Незалежний сервіс Hyundai — Варшава",
    line2: "i30, Tucson, Kona — ТО",
    metaTitle: "Незалежний сервіс Hyundai Варшава — BESS MOTORS",
    metaDescription:
      "Незалежний сервіс Hyundai — олива, гальма, кондиціонер, діагностика. Ми не дилер Hyundai. BESS MOTORS Włochy.",
  },
  "serwis-kia": {
    title: "Сервіс Kia",
    line1: "Незалежний сервіс Kia — Варшава",
    line2: "Ceed, Sportage, Stonic — гальма й олива",
    metaTitle: "Незалежний сервіс Kia Варшава — BESS MOTORS",
    metaDescription:
      "Незалежний сервіс Kia — діагностика, гальма, олива, кондиціонер. Ми не дилер Kia. BESS MOTORS.",
  },
  "klocki-hamulcowe": {
    title: "Заміна гальмівних колодок",
    line1: "Скрип, скрегіт, довший шлях гальмування?",
    line2: "Гальма в BESS MOTORS",
    metaTitle: "Гальмівні колодки Варшава — BESS MOTORS",
    metaDescription:
      "Заміна колодок і дисків. Швидкий візит, гарантія на роботу. BESS MOTORS Варшава.",
  },
  "serwis-klimatyzacji": {
    title: "Сервіс кондиціонера",
    line1: "Заправка та сервіс кліматичної системи",
    line2: "R134a, R1234yf і антибактеріальна обробка",
    metaTitle: "Сервіс кондиціонера Варшава — BESS MOTORS",
    metaDescription:
      "Сервіс автокондиціонера в BESS MOTORS — заправка R134a/R1234yf, діагностика. Варшава Włochy.",
  },
  "chip-tuning-warszawa": {
    title: "Chip tuning Варшава",
    line1: "Більше потужності та моменту",
    line2: "Stage 1 і Stage 2 — безпечно",
    metaTitle: "Chip tuning Варшава — Stage 1 / Stage 2",
    metaDescription:
      "Chip tuning в BESS MOTORS — Stage 1 від 1200 zł, Stage 2 від 2500 zł. Діагностика до тюнінгу, карта ECU. Варшава.",
  },
  "promocje": {
    title: "Акції та знижки",
    line1: "Актуальні акції сервісу",
    line2: "Економте на ремонті авто",
    metaTitle: "Акції BESS MOTORS — олива 80 zł + підвіска безкоштовно",
    metaDescription:
      "Код BessMotors: заміна оливи 80 zł (було 150) + перевірка підвіски безкоштовно з оливою, колодки від 100 zł. Варшава Włochy.",
  },
};
