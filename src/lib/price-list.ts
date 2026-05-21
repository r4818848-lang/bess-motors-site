/** BESS MOTORS — официальный прайс для онлайн-записи (только эти цены) */

export type PriceCategoryId =
  | "maintenance"
  | "ac"
  | "brakes"
  | "tires"
  | "diagnostic"
  | "suspension"
  | "engine"
  | "chip"
  | "extra";

export type PriceUnit =
  | "fixed"
  | "per_cylinder"
  | "per_wheel"
  | "per_100g"
  | "tire_change_cast"
  | "tire_change_steel"
  | "free";

export interface PriceListItem {
  id: string;
  categoryId: PriceCategoryId;
  namePl: string;
  nameRu: string;
  basePrice: number;
  unit: PriceUnit;
  /** Цена «от» — показать предупреждение */
  priceFrom?: boolean;
  /** Мин. кол-во для per_* (по умолчанию 1) */
  minQty?: number;
  maxQty?: number;
}

export const HOURLY_RATE_PLN = 250;

export const priceCategories: { id: PriceCategoryId; namePl: string; nameRu: string }[] = [
  { id: "maintenance", namePl: "Obsługa techniczna", nameRu: "Техническое обслуживание" },
  { id: "ac", namePl: "Klimatyzacja", nameRu: "Кондиционер" },
  { id: "brakes", namePl: "Układ hamulcowy", nameRu: "Тормозная система" },
  { id: "tires", namePl: "Wulkanizacja / opony", nameRu: "Шиномонтаж" },
  { id: "diagnostic", namePl: "Diagnostyka i elektryka", nameRu: "Диагностика и электрика" },
  { id: "suspension", namePl: "Zawieszenie", nameRu: "Подвеска" },
  { id: "engine", namePl: "Silnik", nameRu: "Двигатель" },
  { id: "chip", namePl: "Chip tuning / performance", nameRu: "Chip tuning" },
  { id: "extra", namePl: "Usługi dodatkowe", nameRu: "Дополнительные услуги" },
];

export const priceListItems: PriceListItem[] = [
  // Obsługa techniczna
  { id: "oil_filter", categoryId: "maintenance", namePl: "Wymiana oleju i filtra oleju", nameRu: "Замена масла и масляного фильтра", basePrice: 150, unit: "fixed", priceFrom: true },
  { id: "cabin_filter", categoryId: "maintenance", namePl: "Wymiana filtra kabinowego", nameRu: "Замена салонного фильтра", basePrice: 50, unit: "fixed", priceFrom: true },
  { id: "air_filter", categoryId: "maintenance", namePl: "Wymiana filtra powietrza", nameRu: "Замена воздушного фильтра", basePrice: 30, unit: "fixed", priceFrom: true },
  { id: "fuel_filter", categoryId: "maintenance", namePl: "Wymiana filtra paliwa", nameRu: "Замена топливного фильтра", basePrice: 120, unit: "fixed", priceFrom: true },
  { id: "spark_plugs", categoryId: "maintenance", namePl: "Wymiana świec zapłonowych", nameRu: "Замена свечей зажигания", basePrice: 50, unit: "per_cylinder", priceFrom: true, minQty: 3, maxQty: 12 },
  { id: "glow_plugs", categoryId: "maintenance", namePl: "Wymiana świec żarowych", nameRu: "Замена свечей накала", basePrice: 80, unit: "per_cylinder", priceFrom: true, minQty: 3, maxQty: 12 },
  { id: "coolant", categoryId: "maintenance", namePl: "Wymiana płynu chłodzącego", nameRu: "Замена охлаждающей жидкости", basePrice: 150, unit: "fixed", priceFrom: true },
  { id: "power_steering_fluid", categoryId: "maintenance", namePl: "Wymiana płynu wspomagania", nameRu: "Замена жидкости ГУР", basePrice: 120, unit: "fixed", priceFrom: true },

  // Klimatyzacja
  { id: "ac_r134a", categoryId: "ac", namePl: "Napełnianie klimatyzacji R134a", nameRu: "Заправка кондиционера R134a", basePrice: 80, unit: "per_100g", priceFrom: true, minQty: 1, maxQty: 30 },
  { id: "ac_r1234yf", categoryId: "ac", namePl: "Napełnianie klimatyzacji R1234yf", nameRu: "Заправка кондиционера R1234yf", basePrice: 100, unit: "per_100g", priceFrom: true, minQty: 1, maxQty: 30 },
  { id: "ac_diag", categoryId: "ac", namePl: "Diagnostyka klimatyzacji", nameRu: "Диагностика кондиционера", basePrice: 150, unit: "fixed", priceFrom: true },
  { id: "ac_leak", categoryId: "ac", namePl: "Sprawdzenie szczelności układu", nameRu: "Проверка герметичности системы", basePrice: 150, unit: "fixed", priceFrom: true },
  { id: "ac_ozone", categoryId: "ac", namePl: "Ozonyzacja salonu", nameRu: "Озонирование салона", basePrice: 100, unit: "fixed", priceFrom: true },
  { id: "ac_clean", categoryId: "ac", namePl: "Czyszczenie klimatyzacji", nameRu: "Чистка кондиционера", basePrice: 150, unit: "fixed", priceFrom: true },
  { id: "ac_compressor", categoryId: "ac", namePl: "Wymiana sprężarki klimatyzacji", nameRu: "Замена компрессора кондиционера", basePrice: 400, unit: "fixed", priceFrom: true },
  { id: "ac_radiator", categoryId: "ac", namePl: "Wymiana chłodnicy klimatyzacji", nameRu: "Замена радиатора кондиционера", basePrice: 350, unit: "fixed", priceFrom: true },
  { id: "ac_lines", categoryId: "ac", namePl: "Wymiana przewodów klimatyzacji", nameRu: "Замена трубок кондиционера", basePrice: 250, unit: "fixed", priceFrom: true },
  { id: "ac_dryer", categoryId: "ac", namePl: "Wymiana osuszacza klimatyzacji", nameRu: "Замена осушителя кондиционера", basePrice: 200, unit: "fixed", priceFrom: true },

  // Hamulce
  { id: "brake_pads_front", categoryId: "brakes", namePl: "Wymiana klocków przednich", nameRu: "Замена передних колодок", basePrice: 160, unit: "fixed", priceFrom: true },
  { id: "brake_pads_rear", categoryId: "brakes", namePl: "Wymiana klocków tylnych", nameRu: "Замена задних колодок", basePrice: 180, unit: "fixed", priceFrom: true },
  { id: "brake_disc_front", categoryId: "brakes", namePl: "Wymiana tarcz i klocków przednich", nameRu: "Замена передних дисков и колодок", basePrice: 220, unit: "fixed", priceFrom: true },
  { id: "brake_disc_rear", categoryId: "brakes", namePl: "Wymiana tarcz i klocków tylnych", nameRu: "Замена задних дисков и колодок", basePrice: 280, unit: "fixed", priceFrom: true },
  { id: "handbrake_pads", categoryId: "brakes", namePl: "Wymiana klocków ręcznego", nameRu: "Замена колодок ручника", basePrice: 120, unit: "fixed", priceFrom: true },
  { id: "handbrake_cables", categoryId: "brakes", namePl: "Wymiana linek ręcznego", nameRu: "Замена тросов ручника", basePrice: 150, unit: "fixed", priceFrom: true },
  { id: "brake_fluid", categoryId: "brakes", namePl: "Wymiana płynu hamulcowego", nameRu: "Замена тормозной жидкости", basePrice: 150, unit: "fixed", priceFrom: true },
  { id: "brake_diag", categoryId: "brakes", namePl: "Diagnostyka układu hamulcowego", nameRu: "Диагностика тормозной системы", basePrice: 100, unit: "fixed", priceFrom: true },
  { id: "caliper_service", categoryId: "brakes", namePl: "Serwis zacisków", nameRu: "Обслуживание суппортов", basePrice: 250, unit: "fixed", priceFrom: true },
  { id: "brake_hose", categoryId: "brakes", namePl: "Wymiana przewodu hamulcowego", nameRu: "Замена тормозного шланга", basePrice: 120, unit: "fixed", priceFrom: true },
  { id: "brake_cylinder", categoryId: "brakes", namePl: "Wymiana cylindra hamulcowego", nameRu: "Замена тормозного цилиндра", basePrice: 180, unit: "fixed", priceFrom: true },
  { id: "brake_booster", categoryId: "brakes", namePl: "Wymiana wzmacniacza hamulca", nameRu: "Замена вакуумного усилителя", basePrice: 300, unit: "fixed", priceFrom: true },
  { id: "brake_bleed", categoryId: "brakes", namePl: "Odpowietrzanie układu hamulcowego", nameRu: "Прокачка тормозной системы", basePrice: 120, unit: "fixed", priceFrom: true },

  // Opony
  { id: "tire_change_cast_15_17", categoryId: "tires", namePl: "Kompleksowa wymiana opon — felgi aluminiowe R15–R17", nameRu: "Комплексная замена шин — литые R15–R17", basePrice: 200, unit: "tire_change_cast", priceFrom: true },
  { id: "tire_change_cast_18_20", categoryId: "tires", namePl: "Kompleksowa wymiana opon — felgi aluminiowe R18–R20", nameRu: "Комплексная замена шин — литые R18–R20", basePrice: 250, unit: "tire_change_cast", priceFrom: true },
  { id: "tire_change_steel_15_17", categoryId: "tires", namePl: "Kompleksowa wymiana opon — felgi stalowe R15–R17", nameRu: "Комплексная замена шин — сталь R15–R17", basePrice: 160, unit: "tire_change_steel", priceFrom: true },
  { id: "tire_change_steel_18_20", categoryId: "tires", namePl: "Kompleksowa wymiana opon — felgi stalowe R18–R20", nameRu: "Комплексная замена шин — сталь R18–R20", basePrice: 200, unit: "tire_change_steel", priceFrom: true },
  { id: "wheel_balance", categoryId: "tires", namePl: "Wyważanie 1 koła", nameRu: "Балансировка 1 колеса", basePrice: 15, unit: "per_wheel", priceFrom: true, minQty: 1, maxQty: 4 },
  { id: "puncture_repair", categoryId: "tires", namePl: "Naprawa przebicia", nameRu: "Ремонт прокола", basePrice: 80, unit: "fixed", priceFrom: true },
  { id: "sidewall_repair", categoryId: "tires", namePl: "Naprawa bocznego nacięcia", nameRu: "Ремонт бокового пореза", basePrice: 120, unit: "fixed", priceFrom: true },
  { id: "runflat_mount", categoryId: "tires", namePl: "Montaż RunFlat", nameRu: "Монтаж RunFlat", basePrice: 300, unit: "fixed", priceFrom: true },
  { id: "valve_replace", categoryId: "tires", namePl: "Wymiana wentyla", nameRu: "Замена вентиля", basePrice: 15, unit: "fixed", priceFrom: true },
  { id: "tire_storage", categoryId: "tires", namePl: "Sezonowe przechowywanie opon", nameRu: "Сезонное хранение шин", basePrice: 400, unit: "fixed", priceFrom: true },
  { id: "alignment", categoryId: "tires", namePl: "Geometria / zbieżność", nameRu: "Развал-схождение", basePrice: 250, unit: "fixed", priceFrom: true },
  { id: "wheel_wash", categoryId: "tires", namePl: "Mycie kół", nameRu: "Мойка колёс", basePrice: 80, unit: "fixed", priceFrom: true },
  { id: "tire_packages", categoryId: "tires", namePl: "Pakiety do opon", nameRu: "Пакеты для шин", basePrice: 0, unit: "free" },

  // Diagnostyka
  { id: "computer_diag", categoryId: "diagnostic", namePl: "Diagnostyka komputerowa", nameRu: "Компьютерная диагностика", basePrice: 150, unit: "fixed", priceFrom: true },
  { id: "check_engine", categoryId: "diagnostic", namePl: "Diagnostyka Check Engine", nameRu: "Диагностика Check Engine", basePrice: 0, unit: "free" },
  { id: "read_codes", categoryId: "diagnostic", namePl: "Odczyt błędów", nameRu: "Считывание ошибок", basePrice: 0, unit: "free" },
  { id: "clear_codes", categoryId: "diagnostic", namePl: "Kasowanie błędów", nameRu: "Сброс ошибок", basePrice: 0, unit: "free" },
  { id: "battery_coding", categoryId: "diagnostic", namePl: "Kodowanie akumulatora", nameRu: "Кодирование АКБ", basePrice: 100, unit: "fixed", priceFrom: true },
  { id: "battery_check", categoryId: "diagnostic", namePl: "Sprawdzenie akumulatora", nameRu: "Проверка аккумулятора", basePrice: 50, unit: "fixed", priceFrom: true },
  { id: "battery_replace", categoryId: "diagnostic", namePl: "Wymiana akumulatora", nameRu: "Замена аккумулятора", basePrice: 100, unit: "fixed", priceFrom: true },
  { id: "starter_repair", categoryId: "diagnostic", namePl: "Naprawa rozrusznika", nameRu: "Ремонт стартера", basePrice: 350, unit: "fixed", priceFrom: true },
  { id: "alternator_repair", categoryId: "diagnostic", namePl: "Naprawa alternatora", nameRu: "Ремонт генератора", basePrice: 450, unit: "fixed", priceFrom: true },
  { id: "parasitic_drain", categoryId: "diagnostic", namePl: "Szukanie ubytku prądu", nameRu: "Поиск утечки тока", basePrice: 250, unit: "fixed", priceFrom: true },

  // Zawieszenie
  { id: "suspension_diag", categoryId: "suspension", namePl: "Diagnostyka zawieszenia", nameRu: "Диагностика подвески", basePrice: 150, unit: "fixed", priceFrom: true },
  { id: "shock_replace", categoryId: "suspension", namePl: "Wymiana amortyzatora", nameRu: "Замена амортизатора", basePrice: 300, unit: "fixed", priceFrom: true },
  { id: "arm_replace", categoryId: "suspension", namePl: "Wymiana wahaczy", nameRu: "Замена рычагов", basePrice: 250, unit: "fixed", priceFrom: true },
  { id: "bushing_replace", categoryId: "suspension", namePl: "Wymiana tulei", nameRu: "Замена сайлентблока", basePrice: 50, unit: "fixed", priceFrom: true },
  { id: "wheel_bearing", categoryId: "suspension", namePl: "Wymiana łożyska piasty", nameRu: "Замена ступичного подшипника", basePrice: 300, unit: "fixed", priceFrom: true },
  { id: "tie_rod", categoryId: "suspension", namePl: "Wymiana końcówek drążków", nameRu: "Замена рулевых наконечников", basePrice: 200, unit: "fixed", priceFrom: true },
  { id: "ball_joint", categoryId: "suspension", namePl: "Wymiana sworznia", nameRu: "Замена шаровой опоры", basePrice: 150, unit: "fixed", priceFrom: true },
  { id: "sway_bar_link", categoryId: "suspension", namePl: "Wymiana łącznika stabilizatora", nameRu: "Замена стойки стабилизатора", basePrice: 100, unit: "fixed", priceFrom: true },

  // Silnik
  { id: "timing_belt", categoryId: "engine", namePl: "Wymiana paska rozrządu", nameRu: "Замена ремня ГРМ", basePrice: 900, unit: "fixed", priceFrom: true },
  { id: "timing_chain", categoryId: "engine", namePl: "Wymiana łańcucha rozrządu", nameRu: "Замена цепи ГРМ", basePrice: 2000, unit: "fixed", priceFrom: true },
  { id: "water_pump", categoryId: "engine", namePl: "Wymiana pompy wody", nameRu: "Замена помпы", basePrice: 350, unit: "fixed", priceFrom: true },
  { id: "valve_cover_gasket", categoryId: "engine", namePl: "Wymiana uszczelki pokrywy zaworów", nameRu: "Замена прокладки клапанной крышки", basePrice: 250, unit: "fixed", priceFrom: true },
  { id: "turbo_replace", categoryId: "engine", namePl: "Wymiana turbosprężarki", nameRu: "Замена турбины", basePrice: 800, unit: "fixed", priceFrom: true },
  { id: "engine_diag", categoryId: "engine", namePl: "Diagnostyka silnika", nameRu: "Диагностика двигателя", basePrice: 200, unit: "fixed", priceFrom: true },
  { id: "engine_mount", categoryId: "engine", namePl: "Wymiana poduszki silnika", nameRu: "Замена подушек двигателя", basePrice: 250, unit: "fixed", priceFrom: true },
  { id: "coolant_radiator", categoryId: "engine", namePl: "Wymiana chłodnicy", nameRu: "Замена радиатора охлаждения", basePrice: 350, unit: "fixed", priceFrom: true },
  { id: "intercooler", categoryId: "engine", namePl: "Wymiana intercoolera", nameRu: "Замена интеркулера", basePrice: 300, unit: "fixed", priceFrom: true },
  { id: "thermostat", categoryId: "engine", namePl: "Wymiana termostatu", nameRu: "Замена термостата", basePrice: 250, unit: "fixed", priceFrom: true },

  // Chip
  { id: "stage1", categoryId: "chip", namePl: "Stage 1", nameRu: "Stage 1", basePrice: 1200, unit: "fixed", priceFrom: true },
  { id: "stage2", categoryId: "chip", namePl: "Stage 2", nameRu: "Stage 2", basePrice: 2500, unit: "fixed", priceFrom: true },
  { id: "pops_bangs", categoryId: "chip", namePl: "Pops & Bangs", nameRu: "Pops & Bangs", basePrice: 600, unit: "fixed", priceFrom: true },
  { id: "egr_off", categoryId: "chip", namePl: "EGR OFF", nameRu: "EGR OFF", basePrice: 700, unit: "fixed", priceFrom: true },
  { id: "dpf_off", categoryId: "chip", namePl: "DPF OFF", nameRu: "DPF OFF", basePrice: 900, unit: "fixed", priceFrom: true },
  { id: "adblue_off", categoryId: "chip", namePl: "AdBlue OFF", nameRu: "AdBlue OFF", basePrice: 900, unit: "fixed", priceFrom: true },
  { id: "ecu_tune", categoryId: "chip", namePl: "Konfiguracja ECU", nameRu: "Настройка ECU", basePrice: 1500, unit: "fixed", priceFrom: true },
  { id: "dyno", categoryId: "chip", namePl: "Pomiar mocy", nameRu: "Замер мощности", basePrice: 350, unit: "fixed", priceFrom: true },

  // Dodatkowe
  { id: "mobile_diag", categoryId: "extra", namePl: "Diagnostyka mobilna", nameRu: "Выездная диагностика", basePrice: 300, unit: "fixed", priceFrom: true },
  { id: "pre_sale", categoryId: "extra", namePl: "Kontrola przed sprzedażą", nameRu: "Предпродажная проверка", basePrice: 350, unit: "fixed", priceFrom: true },
  { id: "pre_buy", categoryId: "extra", namePl: "Kontrola przed zakupem", nameRu: "Проверка перед покупкой", basePrice: 400, unit: "fixed", priceFrom: true },
  { id: "tow", categoryId: "extra", namePl: "Laweta", nameRu: "Эвакуатор", basePrice: 250, unit: "fixed", priceFrom: true },
  { id: "parts_pick", categoryId: "extra", namePl: "Dobór części", nameRu: "Подбор запчастей", basePrice: 0, unit: "free" },
  { id: "photo_report", categoryId: "extra", namePl: "Raport foto naprawy", nameRu: "Фотоотчёт ремонта", basePrice: 0, unit: "free" },
  { id: "online_history", categoryId: "extra", namePl: "Historia serwisowa online", nameRu: "Онлайн история обслуживания", basePrice: 0, unit: "free" },
];

export function getPriceItem(id: string): PriceListItem | undefined {
  return priceListItems.find((i) => i.id === id);
}

export function itemsByCategory(categoryId: PriceCategoryId): PriceListItem[] {
  return priceListItems.filter((i) => i.categoryId === categoryId);
}
