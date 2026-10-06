/** Hero/meta i18n for EXTRA SEO service landings (RU / EN / UK). PL comes from page defs. */
import type { SeoLandingPage } from "@/lib/seo-landing-pages";

type SeoText = Pick<SeoLandingPage, "title" | "line1" | "line2" | "metaTitle" | "metaDescription">;

export const EXTRA_SEO_RU: Partial<Record<string, SeoText>> = {
  "wymiana-rozrzadu-warszawa": {
    title: "Замена ГРМ Варшава – BESS MOTORS",
    line1: "Ремень или цепь ГРМ",
    line2: "Диагностика, смета и замена во Włochy",
    metaTitle: "Замена ГРМ Варшава",
    metaDescription:
      "Замена ГРМ в Варшаве Włochy — ремень, цепь, помпа. Диагностика и смета до работ. BESS MOTORS, Aleja Krakowska 48/52.",
  },
  "wymiana-sprzegla-warszawa": {
    title: "Замена сцепления Варшава – BESS MOTORS",
    line1: "Комплект сцепления и диагностика",
    line2: "Пробуксовка, рывки, тяжёлое переключение",
    metaTitle: "Замена сцепления Варшава",
    metaDescription:
      "Замена сцепления в Варшаве — диагностика, комплект, двухмассовый маховик при необходимости. BESS MOTORS Włochy.",
  },
  "mechanik-warszawa-wlochy": {
    title: "Автомеханик Варшава Włochy",
    line1: "Сервис на Aleja Krakowska 48/52",
    line2: "Масло, тормоза, диагностика, кондиционер, подвеска",
    metaTitle: "Механик Варшава Włochy",
    metaDescription:
      "Автомеханик Варшава Włochy — BESS MOTORS на Aleja Krakowska 48/52. Диагностика, масло, тормоза, кондиционер. Запись онлайн.",
  },
  "diagnostyka-komputerowa-warszawa": {
    title: "Компьютерная диагностика автомобиля Варшава",
    line1: "Check Engine и ошибки OBD",
    line2: "Отчёт с кодами и сметой ремонта",
    metaTitle: "Компьютерная диагностика Варшава",
    metaDescription:
      "Компьютерная диагностика авто в Варшаве — Check Engine, OBD, live-параметры. BESS MOTORS Włochy. Запись онлайн.",
  },
  "wymiana-oleju-warszawa": {
    title: "Замена масла Варшава",
    line1: "Работа 80 zł — код BessMotors",
    line2: "Подвеска бесплатно при замене масла · масло и фильтр отдельно",
    metaTitle: "Замена масла Варшава | работа 80 zł",
    metaDescription:
      "Замена масла Варшава Włochy — работа 80 zł, проверка подвески бесплатно. Масло и фильтр по VIN. BESS MOTORS.",
  },
  "serwis-klimatyzacji-warszawa": {
    title: "Сервис автокондиционера Варшава",
    line1: "Заправка от прайса",
    line2: "R134a и R1234yf · вакуум и герметичность",
    metaTitle: "Сервис кондиционера Варшава",
    metaDescription:
      "Сервис автокондиционера Варшава — заправка R134a/R1234yf, диагностика. BESS MOTORS Włochy, Aleja Krakowska 48/52.",
  },
  "hamulce-warszawa": {
    title: "Замена колодок и дисков Варшава",
    line1: "Колодки от 100 zł работа — код BessMotors",
    line2: "Перед и зад · диски + колодки",
    metaTitle: "Тормоза Варшава — колодки и диски",
    metaDescription:
      "Замена колодок и дисков Варшава — работа от 100 zł (код BessMotors). BESS MOTORS Włochy. Запись или +48 791 257 229.",
  },
  "naprawa-zawieszenia-warszawa": {
    title: "Ремонт подвески Варшава",
    line1: "Амортизаторы, рычаги, шаровые",
    line2: "Стуки, люфт, неравномерный износ шин",
    metaTitle: "Ремонт подвески Варшава",
    metaDescription:
      "Ремонт подвески Варшава — диагностика, амортизаторы, рычаги. BESS MOTORS Włochy. Смета до ремонта.",
  },
  "wymiana-oleju-skrzynia-automatyczna-warszawa": {
    title: "Замена масла АКПП Варшава",
    line1: "ATF / DSG — подбор по VIN",
    line2: "Диагностика КПП и замена по процедуре",
    metaTitle: "Замена масла АКПП Варшава",
    metaDescription:
      "Замена масла в АКПП Варшава — ATF, DSG, фильтр при необходимости. BESS MOTORS Włochy. Индивидуальная смета.",
  },
  "wulkanizacja-warszawa": {
    title: "Шиномонтаж и замена шин Варшава",
    line1: "Замена, балансировка и ремонт шин",
    line2: "Варшава Włochy — Aleja Krakowska 48/52",
    metaTitle: "Шиномонтаж Варшава | Замена шин",
    metaDescription:
      "Шиномонтаж Варшава Włochy — замена и балансировка шин, ремонт прокола. BESS MOTORS, Aleja Krakowska 48/52. Запись или +48 791 257 229.",
  },
  "wymiana-opon-warszawa": {
    title: "Замена шин Варшава",
    line1: "Комплект 4 колёс с балансировкой",
    line2: "Быстрый срок во Włochy",
    metaTitle: "Замена шин Варшава",
    metaDescription:
      "Замена шин Варшава Włochy с балансировкой — комплект 4 колёс. BESS MOTORS, Aleja Krakowska 48/52. Онлайн или +48 791 257 229.",
  },
  "wywazanie-kol-warszawa": {
    title: "Балансировка колёс Варшава",
    line1: "Уберите вибрации руля",
    line2: "Балансировка шин на станке",
    metaTitle: "Балансировка колёс Варшава",
    metaDescription:
      "Балансировка колёс Варшава Włochy — меньше вибраций, ровный износ шин. BESS MOTORS. Запись онлайн.",
  },
  "naprawa-opon-warszawa": {
    title: "Ремонт шин Варшава",
    line1: "Ремонт проколотой шины",
    line2: "Демонтаж, ремонт, монтаж и балансировка",
    metaTitle: "Ремонт шин Варшава",
    metaDescription:
      "Ремонт шин Варшава — прокол, шиномонтаж. BESS MOTORS Włochy, Aleja Krakowska 48/52. Спросите срок или запишитесь.",
  },
  "wymiana-klockow-hamulcowych-warszawa": {
    title: "Замена тормозных колодок Варшава",
    line1: "Перед и зад — смета до монтажа",
    line2: "Код BessMotors на работу по колодкам",
    metaTitle: "Замена тормозных колодок Варшава",
    metaDescription:
      "Замена тормозных колодок Варшава — работа от 100 zł (код BessMotors). BESS MOTORS Włochy. Запись или +48 791 257 229.",
  },
  "wymiana-tarcz-hamulcowych-warszawa": {
    title: "Замена тормозных дисков Варшава",
    line1: "Диски с колодками или отдельно",
    line2: "Замер толщины и биения до решения",
    metaTitle: "Замена тормозных дисков Варшава",
    metaDescription:
      "Замена тормозных дисков Варшава — замер, смета, монтаж. BESS MOTORS Włochy. Запись онлайн.",
  },
  "wymiana-plynu-hamulcowego-warszawa": {
    title: "Замена тормозной жидкости Варшава",
    line1: "Свежая жидкость и прокачка",
    line2: "Надёжная педаль тормоза",
    metaTitle: "Замена тормозной жидкости Варшава",
    metaDescription:
      "Замена тормозной жидкости Варшава — замена и прокачка контура. BESS MOTORS Włochy. Запись или смета.",
  },
  "wymiana-amortyzatorow-warszawa": {
    title: "Замена амортизаторов Варшава",
    line1: "Перед / зад — диагностика до замены",
    line2: "Меньше раскачки, лучше сцепление",
    metaTitle: "Замена амортизаторов Варшава",
    metaDescription:
      "Замена амортизаторов Варшава — диагностика подвески и монтаж. BESS MOTORS Włochy. Смета до работ.",
  },
  "wymiana-wahaczy-warszawa": {
    title: "Замена рычагов Варшава",
    line1: "Люфты, стуки, неравномерный износ шин",
    line2: "Смета после диагностики на подъёмнике",
    metaTitle: "Замена рычагов подвески Варшава",
    metaDescription:
      "Замена рычагов Варшава — стуки и люфты в подвеске. BESS MOTORS Włochy. После замены рекомендуем геометрию.",
  },
  "naprawa-ukladu-kierowniczego-warszawa": {
    title: "Ремонт рулевого управления Варшава",
    line1: "Люфты, стуки, увод автомобиля",
    line2: "Рейка, наконечники, диагностика",
    metaTitle: "Ремонт рулевого управления Варшава",
    metaDescription:
      "Ремонт рулевого управления Варшава — рейка, тяги, наконечники. BESS MOTORS Włochy. Смета после диагностики.",
  },
  "wymiana-przekladni-kierowniczej-warszawa": {
    title: "Замена рулевой рейки Варшава",
    line1: "Рейка — индивидуальная смета",
    line2: "Диагностика до демонтажа",
    metaTitle: "Замена рулевой рейки Варшава",
    metaDescription:
      "Замена рулевой рейки (maglownicy) Варшава. BESS MOTORS Włochy — диагностика, смета, монтаж.",
  },
  "wymiana-drazkow-kierowniczych-warszawa": {
    title: "Замена рулевых тяг Варшава",
    line1: "Наконечники и тяги — меньше люфта на руле",
    line2: "После замены рекомендуем геометрию",
    metaTitle: "Замена рулевых тяг Варшава",
    metaDescription:
      "Замена рулевых тяг и наконечников Варшава. BESS MOTORS Włochy. Запись или +48 791 257 229.",
  },
  "wymiana-filtrow-warszawa": {
    title: "Замена автомобильных фильтров Варшава",
    line1: "Масляный, воздушный, салонный, топливный",
    line2: "Подбор фильтров по VIN",
    metaTitle: "Замена фильтров Варшава",
    metaDescription:
      "Замена фильтров Варшава — воздух, салон, топливо, масло. BESS MOTORS Włochy. Запись онлайн.",
  },
  "wymiana-plynu-chlodniczego-warszawa": {
    title: "Замена охлаждающей жидкости Варшава",
    line1: "Свежий антифриз и контроль системы",
    line2: "Меньше риска перегрева двигателя",
    metaTitle: "Замена охлаждающей жидкости Варшава",
    metaDescription:
      "Замена ОЖ Варшава — слив, заправка, контроль. BESS MOTORS Włochy. Запись или смета.",
  },
  "wymiana-swiec-zaplonowych-warszawa": {
    title: "Замена свечей зажигания Варшава",
    line1: "Ровная работа бензинового мотора",
    line2: "Подбор свечей под двигатель / VIN",
    metaTitle: "Замена свечей зажигания Варшава",
    metaDescription:
      "Замена свечей зажигания Варшава — лучший пуск и расход. BESS MOTORS Włochy. Запись онлайн.",
  },
  "wymiana-alternatora-warszawa": {
    title: "Замена генератора Варшава",
    line1: "Зарядка АКБ и электрика",
    line2: "Диагностика до замены",
    metaTitle: "Замена генератора Варшава",
    metaDescription:
      "Замена генератора Варшава — диагностика зарядки, монтаж. BESS MOTORS Włochy. Смета до работ.",
  },
  "wymiana-rozrusznika-warszawa": {
    title: "Замена стартера Варшава",
    line1: "Трудный пуск, щелчки, нет оборотов",
    line2: "Проверка АКБ и проводки",
    metaTitle: "Замена стартера Варшава",
    metaDescription:
      "Замена стартера Варшава — диагностика пуска и монтаж. BESS MOTORS Włochy. Запись онлайн.",
  },
  "naprawa-wydechu-warszawa": {
    title: "Ремонт выхлопной системы Варшава",
    line1: "Сварка, негерметичность, шум",
    line2: "Катализатор и глушитель — смета после осмотра",
    metaTitle: "Ремонт выхлопной системы Варшава",
    metaDescription:
      "Ремонт выхлопа Варшава — сварка, глушитель, негерметичность. BESS MOTORS Włochy. Смета или запись.",
  },
  "diagnostyka-silnika-warszawa": {
    title: "Диагностика двигателя Варшава",
    line1: "Мощность, дым, стуки, Check Engine",
    line2: "Компьютер + механическая оценка",
    metaTitle: "Диагностика двигателя Варшава",
    metaDescription:
      "Диагностика двигателя Варшава — Check Engine, параметры, смета. BESS MOTORS Włochy. Запись онлайн.",
  },
  "test-kompresji-warszawa": {
    title: "Замер компрессии двигателя Варшава",
    line1: "Оценка состояния цилиндров",
    line2: "Когда мотор слабо тянет или работает неровно",
    metaTitle: "Замер компрессии двигателя Варшава",
    metaDescription:
      "Замер компрессии двигателя Варшава — диагностика состояния мотора. BESS MOTORS Włochy. Запросите смету.",
  },
  "diagnostyka-dymem-warszawa": {
    title: "Диагностика дымом впускного тракта Варшава",
    line1: "Поиск подсоса воздуха",
    line2: "При ошибках смеси и неровной работе",
    metaTitle: "Диагностика дымом Варшава",
    metaDescription:
      "Диагностика дымом Варшава — негерметичность впуска. BESS MOTORS Włochy. Запросите смету.",
  },
  "diagnostyka-przed-zakupem-warszawa": {
    title: "Проверка автомобиля перед покупкой Варшава",
    line1: "Осмотр + диагностика до сделки",
    line2: "Отчёт с рекомендациями",
    metaTitle: "Проверка авто перед покупкой Варшава",
    metaDescription:
      "Проверка автомобиля перед покупкой Варшава — диагностика и осмотр. BESS MOTORS Włochy. Запишитесь до осмотра авто.",
  },
  "wymiana-pompy-wody-warszawa": {
    title: "Замена помпы Варшава",
    line1: "Часто с ГРМ или при течи",
    line2: "Контроль охлаждения после монтажа",
    metaTitle: "Замена помпы воды Варшава",
    metaDescription:
      "Замена помпы Варшава — течь, шум, перегрев. BESS MOTORS Włochy. Смета до работ.",
  },
  "wymiana-uszczelki-pokrywy-zaworow-warszawa": {
    title: "Замена прокладки клапанной крышки Варшава",
    line1: "Течь масла на двигателе",
    line2: "Чистый мотор, меньше запаха гари",
    metaTitle: "Замена прокладки клапанной крышки Варшава",
    metaDescription:
      "Замена прокладки клапанной крышки Варшава — устранение течи масла. BESS MOTORS Włochy.",
  },
  "wymiana-poduszki-silnika-warszawa": {
    title: "Замена подушки двигателя Варшава",
    line1: "Вибрации на холостых",
    line2: "Диагностика опор двигателя",
    metaTitle: "Замена подушки двигателя Варшава",
    metaDescription:
      "Замена подушки двигателя Варшава — вибрации и удары при старте. BESS MOTORS Włochy.",
  },
  "wymiana-lozyska-kola-warszawa": {
    title: "Замена подшипника колеса Варшава",
    line1: "Гул при езде, люфт на колесе",
    line2: "Диагностика и замена ступицы / подшипника",
    metaTitle: "Замена подшипника колеса Варшава",
    metaDescription:
      "Замена подшипника колеса Варшава — шум и люфт. BESS MOTORS Włochy. Запись онлайн.",
  },
  "serwis-skrzyni-automatycznej-warszawa": {
    title: "Сервис АКПП Варшава",
    line1: "ATF, фильтр, диагностика автомата",
    line2: "Подбор масла и процедуры по VIN",
    metaTitle: "Сервис автоматической КПП Варшава",
    metaDescription:
      "Сервис АКПП Варшава — масло ATF, фильтр, диагностика. BESS MOTORS Włochy. Индивидуальная смета.",
  },
  "wymiana-oleju-dsg-warszawa": {
    title: "Замена масла в DSG Варшава",
    line1: "Масло DSG по процедуре",
    line2: "Фильтр, если предусмотрен производителем",
    metaTitle: "Замена масла DSG Варшава",
    metaDescription:
      "Замена масла DSG Варшава — процедура, фильтр, подбор масла. BESS MOTORS Włochy. Запись онлайн.",
  },
  "serwis-haldex-warszawa": {
    title: "Сервис Haldex Варшава",
    line1: "Полный привод — масло и фильтр Haldex",
    line2: "Типично для VAG и выбранных моделей",
    metaTitle: "Сервис Haldex Варшава",
    metaDescription:
      "Сервис Haldex Варшава — масло/фильтры муфты Haldex. BESS MOTORS Włochy. Смета по модели / VIN.",
  },
  "mechanik-warszawa-okecie": {
    title: "Автомеханик Варшава Okęcie",
    line1: "Рядом с аэропортом — Aleja Krakowska 48/52",
    line2: "Ок. 5 мин от Okęcie · парковка у сервиса",
    metaTitle: "Механик Варшава Okęcie",
    metaDescription:
      "Механик Варшава Okęcie — BESS MOTORS на Aleja Krakowska 48/52 (Włochy), ~5 мин от Okęcie. Диагностика, масло, тормоза, шины.",
  },
};

export const EXTRA_SEO_EN: Partial<Record<string, SeoText>> = {
  "wymiana-rozrzadu-warszawa": {
    title: "Timing belt replacement Warsaw – BESS MOTORS",
    line1: "Belt or chain timing service",
    line2: "Diagnostics, quote and replacement in Włochy",
    metaTitle: "Timing belt replacement Warsaw",
    metaDescription:
      "Timing belt/chain replacement in Warsaw Włochy — water pump when needed. Quote before work. BESS MOTORS, Aleja Krakowska 48/52.",
  },
  "wymiana-sprzegla-warszawa": {
    title: "Clutch replacement Warsaw – BESS MOTORS",
    line1: "Full clutch kit and diagnostics",
    line2: "Slipping, judder, hard gear changes",
    metaTitle: "Clutch replacement Warsaw",
    metaDescription:
      "Clutch replacement in Warsaw — diagnostics, clutch kit, dual-mass flywheel if needed. BESS MOTORS Włochy.",
  },
  "mechanik-warszawa-wlochy": {
    title: "Car mechanic Warsaw Włochy",
    line1: "Workshop at Aleja Krakowska 48/52",
    line2: "Oil, brakes, diagnostics, A/C, suspension",
    metaTitle: "Car mechanic Warsaw Włochy",
    metaDescription:
      "Independent car mechanic in Warsaw Włochy — BESS MOTORS, Aleja Krakowska 48/52. Book online or call.",
  },
  "diagnostyka-komputerowa-warszawa": {
    title: "Car computer diagnostics Warsaw",
    line1: "Check Engine and OBD faults",
    line2: "Report with codes and repair quote",
    metaTitle: "Computer diagnostics Warsaw",
    metaDescription:
      "Car computer diagnostics in Warsaw — Check Engine, OBD, live data. BESS MOTORS Włochy. Book online.",
  },
  "wymiana-oleju-warszawa": {
    title: "Oil change Warsaw",
    line1: "Labour 80 zł — code BessMotors",
    line2: "Free suspension check with oil · oil & filter separate",
    metaTitle: "Oil change Warsaw | 80 zł labour",
    metaDescription:
      "Oil change in Warsaw Włochy — 80 zł labour, free suspension check with oil. Oil & filter by VIN. BESS MOTORS.",
  },
  "serwis-klimatyzacji-warszawa": {
    title: "Car air conditioning service Warsaw",
    line1: "Recharge from price list",
    line2: "R134a & R1234yf · vacuum and leak check",
    metaTitle: "A/C service Warsaw",
    metaDescription:
      "Car A/C service in Warsaw — R134a/R1234yf recharge, diagnostics. BESS MOTORS Włochy, Aleja Krakowska 48/52.",
  },
  "hamulce-warszawa": {
    title: "Brake pads and discs Warsaw",
    line1: "Pads from 100 zł labour — code BessMotors",
    line2: "Front and rear · discs + pads",
    metaTitle: "Brakes Warsaw — pads and discs",
    metaDescription:
      "Brake pads and discs in Warsaw — labour from 100 zł (code BessMotors). BESS MOTORS Włochy. Book or call.",
  },
  "naprawa-zawieszenia-warszawa": {
    title: "Suspension repair Warsaw",
    line1: "Shocks, control arms, ball joints",
    line2: "Knocks, play, uneven tyre wear",
    metaTitle: "Suspension repair Warsaw",
    metaDescription:
      "Suspension repair in Warsaw — diagnostics, shocks, arms. BESS MOTORS Włochy. Quote before repair.",
  },
  "wymiana-oleju-skrzynia-automatyczna-warszawa": {
    title: "Automatic gearbox oil change Warsaw",
    line1: "ATF / DSG — oil by VIN",
    line2: "Gearbox diagnostics and procedure-based service",
    metaTitle: "Automatic gearbox oil Warsaw",
    metaDescription:
      "Automatic gearbox oil change in Warsaw — ATF, DSG, filter when required. BESS MOTORS Włochy.",
  },
  "wulkanizacja-warszawa": {
    title: "Tyre fitting and tyre change Warsaw",
    line1: "Fitting, balancing and puncture repair",
    line2: "Warsaw Włochy — Aleja Krakowska 48/52",
    metaTitle: "Tyre fitting Warsaw | Tyre change",
    metaDescription:
      "Tyre fitting in Warsaw Włochy — change, balancing, puncture repair. BESS MOTORS, Aleja Krakowska 48/52. Book or call.",
  },
  "wymiana-opon-warszawa": {
    title: "Tyre change Warsaw",
    line1: "Set of 4 wheels with balancing",
    line2: "Fast booking in Włochy",
    metaTitle: "Tyre change Warsaw",
    metaDescription:
      "Tyre change in Warsaw Włochy with balancing — full set of 4. BESS MOTORS, Aleja Krakowska 48/52. Book online.",
  },
  "wywazanie-kol-warszawa": {
    title: "Wheel balancing Warsaw",
    line1: "Stop steering wheel vibration",
    line2: "Machine tyre balancing",
    metaTitle: "Wheel balancing Warsaw",
    metaDescription:
      "Wheel balancing in Warsaw Włochy — less vibration, even tyre wear. BESS MOTORS. Book online.",
  },
  "naprawa-opon-warszawa": {
    title: "Tyre repair Warsaw",
    line1: "Puncture repair",
    line2: "Removal, repair, refit and balancing",
    metaTitle: "Tyre repair Warsaw",
    metaDescription:
      "Tyre puncture repair in Warsaw. BESS MOTORS Włochy, Aleja Krakowska 48/52. Ask for a slot or book online.",
  },
  "wymiana-klockow-hamulcowych-warszawa": {
    title: "Brake pad replacement Warsaw",
    line1: "Front and rear — quote before fitting",
    line2: "BessMotors code on pad labour",
    metaTitle: "Brake pad replacement Warsaw",
    metaDescription:
      "Brake pad replacement in Warsaw — labour from 100 zł (code BessMotors). BESS MOTORS Włochy. Book or call.",
  },
  "wymiana-tarcz-hamulcowych-warszawa": {
    title: "Brake disc replacement Warsaw",
    line1: "Discs with pads or as needed",
    line2: "Thickness and runout check first",
    metaTitle: "Brake disc replacement Warsaw",
    metaDescription:
      "Brake disc replacement in Warsaw — measure, quote, fit. BESS MOTORS Włochy. Book online.",
  },
  "wymiana-plynu-hamulcowego-warszawa": {
    title: "Brake fluid change Warsaw",
    line1: "Fresh fluid and bleed",
    line2: "Confident brake pedal feel",
    metaTitle: "Brake fluid change Warsaw",
    metaDescription:
      "Brake fluid change in Warsaw — drain, refill and bleed. BESS MOTORS Włochy. Book or ask for a quote.",
  },
  "wymiana-amortyzatorow-warszawa": {
    title: "Shock absorber replacement Warsaw",
    line1: "Front / rear — diagnose first",
    line2: "Less body roll, better grip",
    metaTitle: "Shock absorber replacement Warsaw",
    metaDescription:
      "Shock absorber replacement in Warsaw — suspension check and fitting. BESS MOTORS Włochy.",
  },
  "wymiana-wahaczy-warszawa": {
    title: "Control arm replacement Warsaw",
    line1: "Play, knocks, uneven tyre wear",
    line2: "Quote after ramp inspection",
    metaTitle: "Control arm replacement Warsaw",
    metaDescription:
      "Control arm replacement in Warsaw — suspension knocks and play. BESS MOTORS Włochy. Alignment often recommended after.",
  },
  "naprawa-ukladu-kierowniczego-warszawa": {
    title: "Steering system repair Warsaw",
    line1: "Play, knocks, pulling to one side",
    line2: "Rack, tie rods, diagnostics",
    metaTitle: "Steering system repair Warsaw",
    metaDescription:
      "Steering repair in Warsaw — rack, tie rods, ends. BESS MOTORS Włochy. Quote after diagnostics.",
  },
  "wymiana-przekladni-kierowniczej-warszawa": {
    title: "Steering rack replacement Warsaw",
    line1: "Rack — individual quote",
    line2: "Diagnostics before removal",
    metaTitle: "Steering rack replacement Warsaw",
    metaDescription:
      "Steering rack replacement in Warsaw. BESS MOTORS Włochy — diagnose, quote, fit.",
  },
  "wymiana-drazkow-kierowniczych-warszawa": {
    title: "Tie rod replacement Warsaw",
    line1: "Ends and rods — less steering play",
    line2: "Alignment recommended after",
    metaTitle: "Tie rod replacement Warsaw",
    metaDescription:
      "Tie rod and track-rod end replacement in Warsaw. BESS MOTORS Włochy. Book or call.",
  },
  "wymiana-filtrow-warszawa": {
    title: "Car filter replacement Warsaw",
    line1: "Oil, air, cabin and fuel filters",
    line2: "Filters selected by VIN",
    metaTitle: "Filter replacement Warsaw",
    metaDescription:
      "Car filter replacement in Warsaw — air, cabin, fuel, oil. BESS MOTORS Włochy. Book online.",
  },
  "wymiana-plynu-chlodniczego-warszawa": {
    title: "Coolant change Warsaw",
    line1: "Fresh coolant and system check",
    line2: "Lower overheating risk",
    metaTitle: "Coolant change Warsaw",
    metaDescription:
      "Coolant change in Warsaw — drain, refill, check. BESS MOTORS Włochy. Book or ask for a quote.",
  },
  "wymiana-swiec-zaplonowych-warszawa": {
    title: "Spark plug replacement Warsaw",
    line1: "Smoother petrol engine running",
    line2: "Plugs matched to engine / VIN",
    metaTitle: "Spark plug replacement Warsaw",
    metaDescription:
      "Spark plug replacement in Warsaw — better starting and economy. BESS MOTORS Włochy.",
  },
  "wymiana-alternatora-warszawa": {
    title: "Alternator replacement Warsaw",
    line1: "Battery charging and electrics",
    line2: "Diagnose before replacement",
    metaTitle: "Alternator replacement Warsaw",
    metaDescription:
      "Alternator replacement in Warsaw — charging diagnostics and fitting. BESS MOTORS Włochy.",
  },
  "wymiana-rozrusznika-warszawa": {
    title: "Starter motor replacement Warsaw",
    line1: "Hard starting, clicks, no crank",
    line2: "Battery and wiring checked first",
    metaTitle: "Starter replacement Warsaw",
    metaDescription:
      "Starter replacement in Warsaw — cranking diagnostics and fitting. BESS MOTORS Włochy.",
  },
  "naprawa-wydechu-warszawa": {
    title: "Exhaust system repair Warsaw",
    line1: "Welding, leaks, noise",
    line2: "Catalyst and silencer — quote after inspection",
    metaTitle: "Exhaust system repair Warsaw",
    metaDescription:
      "Exhaust repair in Warsaw — welding, silencer, leaks. BESS MOTORS Włochy. Quote or book.",
  },
  "diagnostyka-silnika-warszawa": {
    title: "Engine diagnostics Warsaw",
    line1: "Power loss, smoke, knocks, Check Engine",
    line2: "Computer + mechanical assessment",
    metaTitle: "Engine diagnostics Warsaw",
    metaDescription:
      "Engine diagnostics in Warsaw — Check Engine, live data, repair quote. BESS MOTORS Włochy.",
  },
  "test-kompresji-warszawa": {
    title: "Engine compression test Warsaw",
    line1: "Cylinder condition assessment",
    line2: "When the engine lacks power or runs unevenly",
    metaTitle: "Engine compression test Warsaw",
    metaDescription:
      "Engine compression test in Warsaw — assess engine health. BESS MOTORS Włochy. Ask for a quote.",
  },
  "diagnostyka-dymem-warszawa": {
    title: "Smoke test intake diagnostics Warsaw",
    line1: "Find intake vacuum leaks",
    line2: "For mixture faults and rough running",
    metaTitle: "Smoke test diagnostics Warsaw",
    metaDescription:
      "Smoke test diagnostics in Warsaw — intake leaks. BESS MOTORS Włochy. Ask for a quote.",
  },
  "diagnostyka-przed-zakupem-warszawa": {
    title: "Pre-purchase car inspection Warsaw",
    line1: "Inspection + diagnostics before you buy",
    line2: "Report with recommendations",
    metaTitle: "Pre-purchase inspection Warsaw",
    metaDescription:
      "Pre-purchase car inspection in Warsaw — diagnostics and checks. BESS MOTORS Włochy. Book before viewing.",
  },
  "wymiana-pompy-wody-warszawa": {
    title: "Water pump replacement Warsaw",
    line1: "Often with timing belt or when leaking",
    line2: "Cooling check after fitting",
    metaTitle: "Water pump replacement Warsaw",
    metaDescription:
      "Water pump replacement in Warsaw — leak, noise, overheating. BESS MOTORS Włochy.",
  },
  "wymiana-uszczelki-pokrywy-zaworow-warszawa": {
    title: "Valve cover gasket replacement Warsaw",
    line1: "Oil leak on the engine",
    line2: "Cleaner engine, less burning smell",
    metaTitle: "Valve cover gasket replacement Warsaw",
    metaDescription:
      "Valve cover gasket replacement in Warsaw — stop oil leaks. BESS MOTORS Włochy.",
  },
  "wymiana-poduszki-silnika-warszawa": {
    title: "Engine mount replacement Warsaw",
    line1: "Idle vibration",
    line2: "Engine mounting diagnostics",
    metaTitle: "Engine mount replacement Warsaw",
    metaDescription:
      "Engine mount replacement in Warsaw — vibration and knocks when moving off. BESS MOTORS Włochy.",
  },
  "wymiana-lozyska-kola-warszawa": {
    title: "Wheel bearing replacement Warsaw",
    line1: "Hum while driving, wheel play",
    line2: "Diagnose and replace hub / bearing",
    metaTitle: "Wheel bearing replacement Warsaw",
    metaDescription:
      "Wheel bearing replacement in Warsaw — noise and play. BESS MOTORS Włochy. Book online.",
  },
  "serwis-skrzyni-automatycznej-warszawa": {
    title: "Automatic gearbox service Warsaw",
    line1: "ATF, filter, gearbox diagnostics",
    line2: "Oil and procedure by VIN",
    metaTitle: "Automatic gearbox service Warsaw",
    metaDescription:
      "Automatic gearbox service in Warsaw — ATF, filter, diagnostics. BESS MOTORS Włochy.",
  },
  "wymiana-oleju-dsg-warszawa": {
    title: "DSG oil change Warsaw",
    line1: "DSG oil by procedure",
    line2: "Filter when required by the manufacturer",
    metaTitle: "DSG oil change Warsaw",
    metaDescription:
      "DSG oil change in Warsaw — correct procedure, filter, oil by VIN. BESS MOTORS Włochy.",
  },
  "serwis-haldex-warszawa": {
    title: "Haldex service Warsaw",
    line1: "4×4 coupling — Haldex oil and filter",
    line2: "Common on VAG and selected models",
    metaTitle: "Haldex service Warsaw",
    metaDescription:
      "Haldex service in Warsaw — oil/filters for the Haldex coupling. BESS MOTORS Włochy. Quote by model / VIN.",
  },
  "mechanik-warszawa-okecie": {
    title: "Car mechanic Warsaw Okęcie",
    line1: "Near the airport — Aleja Krakowska 48/52",
    line2: "About 5 min from Okęcie · parking at the workshop",
    metaTitle: "Car mechanic Warsaw Okęcie",
    metaDescription:
      "Car mechanic near Warsaw Okęcie — BESS MOTORS at Aleja Krakowska 48/52 (Włochy), ~5 min from Okęcie. Diagnostics, oil, brakes, tyres.",
  },
};

export const EXTRA_SEO_UK: Partial<Record<string, SeoText>> = {
  "wymiana-rozrzadu-warszawa": {
    title: "Заміна ГРМ Варшава – BESS MOTORS",
    line1: "Ремінь або ланцюг ГРМ",
    line2: "Діагностика, кошторис і заміна у Włochy",
    metaTitle: "Заміна ГРМ Варшава",
    metaDescription:
      "Заміна ГРМ у Варшаві Włochy — ремінь, ланцюг, помпа. Діагностика і кошторис до робіт. BESS MOTORS, Aleja Krakowska 48/52.",
  },
  "wymiana-sprzegla-warszawa": {
    title: "Заміна зчеплення Варшава – BESS MOTORS",
    line1: "Комплект зчеплення та діагностика",
    line2: "Пробуксовка, ривки, важке перемикання",
    metaTitle: "Заміна зчеплення Варшава",
    metaDescription:
      "Заміна зчеплення у Варшаві — діагностика, комплект, двомасовий маховик за потреби. BESS MOTORS Włochy.",
  },
  "mechanik-warszawa-wlochy": {
    title: "Автомеханік Варшава Włochy",
    line1: "Сервіс на Aleja Krakowska 48/52",
    line2: "Олива, гальма, діагностика, кондиціонер, підвіска",
    metaTitle: "Механік Варшава Włochy",
    metaDescription:
      "Автомеханік Варшава Włochy — BESS MOTORS, Aleja Krakowska 48/52. Діагностика, олива, гальма. Запис онлайн.",
  },
  "diagnostyka-komputerowa-warszawa": {
    title: "Комп’ютерна діагностика авто Варшава",
    line1: "Check Engine та помилки OBD",
    line2: "Звіт з кодами і кошторисом",
    metaTitle: "Комп’ютерна діагностика Варшава",
    metaDescription:
      "Комп’ютерна діагностика авто у Варшаві — Check Engine, OBD. BESS MOTORS Włochy. Запис онлайн.",
  },
  "wymiana-oleju-warszawa": {
    title: "Заміна оливи Варшава",
    line1: "Робота 80 zł — код BessMotors",
    line2: "Підвіска безкоштовно з оливою · олива й фільтр окремо",
    metaTitle: "Заміна оливи Варшава | робота 80 zł",
    metaDescription:
      "Заміна оливи Варшава Włochy — робота 80 zł, перевірка підвіски безкоштовно. Олива й фільтр за VIN. BESS MOTORS.",
  },
  "serwis-klimatyzacji-warszawa": {
    title: "Сервіс автокондиціонера Варшава",
    line1: "Заправка від прайсу",
    line2: "R134a і R1234yf · вакуум і герметичність",
    metaTitle: "Сервіс кондиціонера Варшава",
    metaDescription:
      "Сервіс автокондиціонера Варшава — заправка R134a/R1234yf. BESS MOTORS Włochy, Aleja Krakowska 48/52.",
  },
  "hamulce-warszawa": {
    title: "Заміна колодок і дисків Варшава",
    line1: "Колодки від 100 zł робота — код BessMotors",
    line2: "Перед і зад · диски + колодки",
    metaTitle: "Гальма Варшава — колодки і диски",
    metaDescription:
      "Заміна колодок і дисків Варшава — робота від 100 zł (код BessMotors). BESS MOTORS Włochy.",
  },
  "naprawa-zawieszenia-warszawa": {
    title: "Ремонт підвіски Варшава",
    line1: "Амортизатори, важелі, кульові",
    line2: "Стуки, люфт, нерівномірний знос шин",
    metaTitle: "Ремонт підвіски Варшава",
    metaDescription:
      "Ремонт підвіски Варшава — діагностика, амортизатори, важелі. BESS MOTORS Włochy.",
  },
  "wymiana-oleju-skrzynia-automatyczna-warszawa": {
    title: "Заміна оливи АКПП Варшава",
    line1: "ATF / DSG — підбір за VIN",
    line2: "Діагностика КПП і заміна за процедурою",
    metaTitle: "Заміна оливи АКПП Варшава",
    metaDescription:
      "Заміна оливи в АКПП Варшава — ATF, DSG, фільтр за потреби. BESS MOTORS Włochy.",
  },
  "wulkanizacja-warszawa": {
    title: "Шиномонтаж і заміна шин Варшава",
    line1: "Заміна, балансування та ремонт шин",
    line2: "Варшава Włochy — Aleja Krakowska 48/52",
    metaTitle: "Шиномонтаж Варшава | Заміна шин",
    metaDescription:
      "Шиномонтаж Варшава Włochy — заміна й балансування шин, ремонт проколу. BESS MOTORS. Запис або +48 791 257 229.",
  },
  "wymiana-opon-warszawa": {
    title: "Заміна шин Варшава",
    line1: "Комплект 4 коліс із балансуванням",
    line2: "Швидкий запис у Włochy",
    metaTitle: "Заміна шин Варшава",
    metaDescription:
      "Заміна шин Варшава Włochy з балансуванням — комплект 4 коліс. BESS MOTORS. Запис онлайн.",
  },
  "wywazanie-kol-warszawa": {
    title: "Балансування коліс Варшава",
    line1: "Приберіть вібрації керма",
    line2: "Балансування шин на станку",
    metaTitle: "Балансування коліс Варшава",
    metaDescription:
      "Балансування коліс Варшава Włochy — менше вібрацій, рівномірний знос. BESS MOTORS.",
  },
  "naprawa-opon-warszawa": {
    title: "Ремонт шин Варшава",
    line1: "Ремонт проколотої шини",
    line2: "Демонтаж, ремонт, монтаж і балансування",
    metaTitle: "Ремонт шин Варшава",
    metaDescription:
      "Ремонт шин Варшава — прокол, шиномонтаж. BESS MOTORS Włochy. Запитайте час або запишіться.",
  },
  "wymiana-klockow-hamulcowych-warszawa": {
    title: "Заміна гальмівних колодок Варшава",
    line1: "Перед і зад — кошторис до монтажу",
    line2: "Код BessMotors на роботу по колодках",
    metaTitle: "Заміна гальмівних колодок Варшава",
    metaDescription:
      "Заміна гальмівних колодок Варшава — робота від 100 zł (код BessMotors). BESS MOTORS Włochy.",
  },
  "wymiana-tarcz-hamulcowych-warszawa": {
    title: "Заміна гальмівних дисків Варшава",
    line1: "Диски з колодками або окремо",
    line2: "Замір товщини та биття до рішення",
    metaTitle: "Заміна гальмівних дисків Варшава",
    metaDescription:
      "Заміна гальмівних дисків Варшава — замір, кошторис, монтаж. BESS MOTORS Włochy.",
  },
  "wymiana-plynu-hamulcowego-warszawa": {
    title: "Заміна гальмівної рідини Варшава",
    line1: "Свіжа рідина і прокачування",
    line2: "Впевнена педаль гальма",
    metaTitle: "Заміна гальмівної рідини Варшава",
    metaDescription:
      "Заміна гальмівної рідини Варшава — заміна й прокачування. BESS MOTORS Włochy.",
  },
  "wymiana-amortyzatorow-warszawa": {
    title: "Заміна амортизаторів Варшава",
    line1: "Перед / зад — діагностика до заміни",
    line2: "Менше розгойдування, краще зчеплення",
    metaTitle: "Заміна амортизаторів Варшава",
    metaDescription:
      "Заміна амортизаторів Варшава — діагностика підвіски й монтаж. BESS MOTORS Włochy.",
  },
  "wymiana-wahaczy-warszawa": {
    title: "Заміна важелів Варшава",
    line1: "Люфти, стуки, нерівномірний знос шин",
    line2: "Кошторис після діагностики на підйомнику",
    metaTitle: "Заміна важелів підвіски Варшава",
    metaDescription:
      "Заміна важелів Варшава — стуки й люфти. BESS MOTORS Włochy. Після заміни радимо геометрію.",
  },
  "naprawa-ukladu-kierowniczego-warszawa": {
    title: "Ремонт кермового керування Варшава",
    line1: "Люфти, стуки, увід авто",
    line2: "Рейка, наконечники, діагностика",
    metaTitle: "Ремонт кермового керування Варшава",
    metaDescription:
      "Ремонт кермового керування Варшава — рейка, тяги, наконечники. BESS MOTORS Włochy.",
  },
  "wymiana-przekladni-kierowniczej-warszawa": {
    title: "Заміна кермової рейки Варшава",
    line1: "Рейка — індивідуальний кошторис",
    line2: "Діагностика до демонтажу",
    metaTitle: "Заміна кермової рейки Варшава",
    metaDescription:
      "Заміна кермової рейки Варшава. BESS MOTORS Włochy — діагностика, кошторис, монтаж.",
  },
  "wymiana-drazkow-kierowniczych-warszawa": {
    title: "Заміна кермових тяг Варшава",
    line1: "Наконечники й тяги — менше люфту на кермі",
    line2: "Після заміни радимо геометрію",
    metaTitle: "Заміна кермових тяг Варшава",
    metaDescription:
      "Заміна кермових тяг і наконечників Варшава. BESS MOTORS Włochy.",
  },
  "wymiana-filtrow-warszawa": {
    title: "Заміна автомобільних фільтрів Варшава",
    line1: "Оливний, повітряний, салонний, паливний",
    line2: "Підбір фільтрів за VIN",
    metaTitle: "Заміна фільтрів Варшава",
    metaDescription:
      "Заміна фільтрів Варшава — повітря, салон, паливо, олива. BESS MOTORS Włochy.",
  },
  "wymiana-plynu-chlodniczego-warszawa": {
    title: "Заміна охолоджувальної рідини Варшава",
    line1: "Свіжий антифриз і контроль системи",
    line2: "Менший ризик перегріву двигуна",
    metaTitle: "Заміна охолоджувальної рідини Варшава",
    metaDescription:
      "Заміна ОЖ Варшава — злив, заправка, контроль. BESS MOTORS Włochy.",
  },
  "wymiana-swiec-zaplonowych-warszawa": {
    title: "Заміна свічок запалювання Варшава",
    line1: "Рівна робота бензинового мотора",
    line2: "Підбір свічок під двигун / VIN",
    metaTitle: "Заміна свічок запалювання Варшава",
    metaDescription:
      "Заміна свічок запалювання Варшава — кращий пуск і витрата. BESS MOTORS Włochy.",
  },
  "wymiana-alternatora-warszawa": {
    title: "Заміна генератора Варшава",
    line1: "Заряджання АКБ та електрика",
    line2: "Діагностика до заміни",
    metaTitle: "Заміна генератора Варшава",
    metaDescription:
      "Заміна генератора Варшава — діагностика зарядки, монтаж. BESS MOTORS Włochy.",
  },
  "wymiana-rozrusznika-warszawa": {
    title: "Заміна стартера Варшава",
    line1: "Важкий пуск, клацання, немає обертів",
    line2: "Перевірка АКБ і проводки",
    metaTitle: "Заміна стартера Варшава",
    metaDescription:
      "Заміна стартера Варшава — діагностика пуску й монтаж. BESS MOTORS Włochy.",
  },
  "naprawa-wydechu-warszawa": {
    title: "Ремонт вихлопної системи Варшава",
    line1: "Зварювання, негерметичність, шум",
    line2: "Каталізатор і глушник — кошторис після огляду",
    metaTitle: "Ремонт вихлопної системи Варшава",
    metaDescription:
      "Ремонт вихлопу Варшава — зварювання, глушник. BESS MOTORS Włochy.",
  },
  "diagnostyka-silnika-warszawa": {
    title: "Діагностика двигуна Варшава",
    line1: "Потужність, дим, стуки, Check Engine",
    line2: "Комп’ютер + механічна оцінка",
    metaTitle: "Діагностика двигуна Варшава",
    metaDescription:
      "Діагностика двигуна Варшава — Check Engine, параметри, кошторис. BESS MOTORS Włochy.",
  },
  "test-kompresji-warszawa": {
    title: "Замір компресії двигуна Варшава",
    line1: "Оцінка стану циліндрів",
    line2: "Коли мотор слабко тягне або працює нерівно",
    metaTitle: "Замір компресії двигуна Варшава",
    metaDescription:
      "Замір компресії двигуна Варшава — діагностика стану мотора. BESS MOTORS Włochy.",
  },
  "diagnostyka-dymem-warszawa": {
    title: "Діагностика димом впускного тракту Варшава",
    line1: "Пошук підсмоктування повітря",
    line2: "При помилках суміші й нерівній роботі",
    metaTitle: "Діагностика димом Варшава",
    metaDescription:
      "Діагностика димом Варшава — негерметичність впуску. BESS MOTORS Włochy.",
  },
  "diagnostyka-przed-zakupem-warszawa": {
    title: "Перевірка авто перед купівлею Варшава",
    line1: "Огляд + діагностика до угоди",
    line2: "Звіт з рекомендаціями",
    metaTitle: "Перевірка авто перед купівлею Варшава",
    metaDescription:
      "Перевірка авто перед купівлею Варшава — діагностика й огляд. BESS MOTORS Włochy.",
  },
  "wymiana-pompy-wody-warszawa": {
    title: "Заміна помпи Варшава",
    line1: "Часто з ГРМ або при течі",
    line2: "Контроль охолодження після монтажу",
    metaTitle: "Заміна помпи води Варшава",
    metaDescription:
      "Заміна помпи Варшава — теча, шум, перегрів. BESS MOTORS Włochy.",
  },
  "wymiana-uszczelki-pokrywy-zaworow-warszawa": {
    title: "Заміна прокладки клапанного покриття Варшава",
    line1: "Теча оливи на двигуні",
    line2: "Чистий мотор, менше запаху гарі",
    metaTitle: "Заміна прокладки клапанного покриття Варшава",
    metaDescription:
      "Заміна прокладки клапанного покриття Варшава — усунення течі оливи. BESS MOTORS Włochy.",
  },
  "wymiana-poduszki-silnika-warszawa": {
    title: "Заміна подушки двигуна Варшава",
    line1: "Вібрації на холостих",
    line2: "Діагностика опор двигуна",
    metaTitle: "Заміна подушки двигуна Варшава",
    metaDescription:
      "Заміна подушки двигуна Варшава — вібрації й удари при старті. BESS MOTORS Włochy.",
  },
  "wymiana-lozyska-kola-warszawa": {
    title: "Заміна підшипника колеса Варшава",
    line1: "Гул під час їзди, люфт на колесі",
    line2: "Діагностика й заміна маточини / підшипника",
    metaTitle: "Заміна підшипника колеса Варшава",
    metaDescription:
      "Заміна підшипника колеса Варшава — шум і люфт. BESS MOTORS Włochy.",
  },
  "serwis-skrzyni-automatycznej-warszawa": {
    title: "Сервіс АКПП Варшава",
    line1: "ATF, фільтр, діагностика автомата",
    line2: "Підбір оливи й процедури за VIN",
    metaTitle: "Сервіс автоматичної КПП Варшава",
    metaDescription:
      "Сервіс АКПП Варшава — олива ATF, фільтр, діагностика. BESS MOTORS Włochy.",
  },
  "wymiana-oleju-dsg-warszawa": {
    title: "Заміна оливи в DSG Варшава",
    line1: "Олива DSG за процедурою",
    line2: "Фільтр, якщо передбачено виробником",
    metaTitle: "Заміна оливи DSG Варшава",
    metaDescription:
      "Заміна оливи DSG Варшава — процедура, фільтр, підбір оливи. BESS MOTORS Włochy.",
  },
  "serwis-haldex-warszawa": {
    title: "Сервіс Haldex Варшава",
    line1: "Повний привід — олива й фільтр Haldex",
    line2: "Типово для VAG і обраних моделей",
    metaTitle: "Сервіс Haldex Варшава",
    metaDescription:
      "Сервіс Haldex Варшава — олива/фільтри муфти Haldex. BESS MOTORS Włochy. Кошторис за VIN.",
  },
  "mechanik-warszawa-okecie": {
    title: "Автомеханік Варшава Okęcie",
    line1: "Поруч з аеропортом — Aleja Krakowska 48/52",
    line2: "Бл. 5 хв від Okęcie · парковка біля сервісу",
    metaTitle: "Механік Варшава Okęcie",
    metaDescription:
      "Механік Варшава Okęcie — BESS MOTORS, Aleja Krakowska 48/52 (Włochy), ~5 хв від Okęcie. Діагностика, олива, гальма, шини.",
  },
};
