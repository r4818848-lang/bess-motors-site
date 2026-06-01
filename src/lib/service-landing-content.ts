import type { ServiceId } from "@/lib/services-catalog";
import { getPriceItem } from "@/lib/price-list";
import { serviceBasePriceId } from "@/lib/service-price-map";

export type LocalizedText = { pl: string; ru: string };

export type ServiceLandingStep = {
  title: LocalizedText;
  description: LocalizedText;
};

export type ServiceLandingEducationItem = {
  title: LocalizedText;
  body: LocalizedText;
};

export type ServiceLandingPriceRow = {
  label: LocalizedText;
  priceZl: number;
  priceFrom?: boolean;
};

export type ServiceLandingPrice = {
  fromZl: number;
  priceFrom: boolean;
  includes: LocalizedText[];
  note?: LocalizedText;
  materialsExtra?: boolean;
  priceTable?: ServiceLandingPriceRow[];
};

/** Usługi z krokiem akceptacji wyceny (podpis) */
export const SERVICES_WITH_ESTIMATE_STEP = new Set<ServiceId>([
  "chip",
  "stage1",
  "engine",
  "timingBelt",
  "transmission",
  "turbo",
  "clutch",
  "brakesFull",
  "acRepair",
  "electric",
]);

const GENERAL_FAQ: { q: LocalizedText; a: LocalizedText }[] = [
  {
    q: {
      pl: "Czy mogę zostać i poczekać podczas serwisu?",
      ru: "Можно ли остаться и подождать во время обслуживания?",
    },
    a: {
      pl: "Tak — mamy strefę oczekiwania z kawą i Wi-Fi. Wymiana oleju trwa ok. godziny, większość klientów zostaje na miejscu.",
      ru: "Да — есть зона ожидания с кофе и Wi-Fi. Замена масла ~1 час, большинство клиентов остаются на месте.",
    },
  },
  {
    q: {
      pl: "Jak długo trwa usługa?",
      ru: "Сколько времени занимает услуга?",
    },
    a: {
      pl: "Zależy od usługi — przy rezerwacji podajemy orientacyjny czas. Na stronie widzisz szacunek dla wybranej usługi.",
      ru: "Зависит от услуги — при записи называем ориентир. На странице есть оценка для выбранной услуги.",
    },
  },
];

export const SERVICE_LANDING_STEPS: Partial<Record<ServiceId, ServiceLandingStep[]>> = {
  oil: [
    {
      title: { pl: "Rezerwacja i dobór oleju", ru: "Запись и подбор масла" },
      description: {
        pl: "Umawiasz się online lub dzwonisz. Podajesz markę, model i przebieg — dobieramy olej zgodnie ze specyfikacją producenta.",
        ru: "Запись онлайн или по телефону. Марка, модель, пробег — подбираем масло по спецификации производителя.",
      },
    },
    {
      title: { pl: "Spust starego oleju i wymiana filtra", ru: "Слив старого масла и замена фильтра" },
      description: {
        pl: "Podnosimy auto, spuszczamy stary olej i wymieniamy filtr oleju. Sprawdzamy korek spustowy i uszczelkę.",
        ru: "Поднимаем авто, сливаем масло, меняем масляный фильтр. Проверяем пробку и прокладку.",
      },
    },
    {
      title: { pl: "Zalanie nowego oleju i kontrola", ru: "Залив нового масла и проверка" },
      description: {
        pl: "Zalewamy świeży olej, uruchamiamy silnik, sprawdzamy szczelność i poziom oleju na zimno i na ciepło.",
        ru: "Заливаем масло, запускаем двигатель, проверяем утечки и уровень на холодном и горячем.",
      },
    },
    {
      title: { pl: "Raport i naklejka przypomnienia", ru: "Отчёт и наклейка напоминания" },
      description: {
        pl: "Raport z materiałów i terminu następnej wymiany. Naklejka na szybie z datą i przebiegiem — gotowe.",
        ru: "Отчёт по материалам и сроку следующей замены. Наклейка на стекло с датой и пробегом.",
      },
    },
  ],
  chip: [
    {
      title: { pl: "Konsultacja i dobór mapy", ru: "Консультация и выбор карты" },
      description: {
        pl: "Omawiasz cel — więcej mocy, dynamika lub oszczędność. Dobieramy Stage 1 lub Stage 2 do Twojego silnika.",
        ru: "Обсуждаем цель — мощность, динамика или экономия. Подбираем Stage 1 или 2 под ваш мотор.",
      },
    },
    {
      title: { pl: "Diagnostyka ECU przed tuningiem", ru: "Диагностика ECU перед тuning" },
      description: {
        pl: "Odczytujemy błędy i sprawdzamy stan silnika. Tuning tylko na sprawnym aucie — warunek bezpieczeństwa.",
        ru: "Считываем ошибки, проверяем двигатель. Тюнинг только на исправном авто.",
      },
    },
    {
      title: { pl: "Akceptacja zakresu i wyceny", ru: "Согласование объёма и сметы" },
      description: {
        pl: "Pokazujemy co zmieniamy w mapie i jaki będzie efekt. Podpisujesz zakres — dopiero potem zaczynamy.",
        ru: "Показываем изменения в карте и эффект. Подписываете объём работ — только потом начинаем.",
      },
    },
    {
      title: { pl: "Zapis mapy i jazda testowa", ru: "Запись карты и тест-драйв" },
      description: {
        pl: "Wgrywamy mapę ECU, jazda testowa — moc, moment, temperatura silnika.",
        ru: "Прошиваем ECU, тест-драйв — мощность, момент, температура.",
      },
    },
  ],
  stage1: [
    {
      title: { pl: "Konsultacja Stage 1", ru: "Консультация Stage 1" },
      description: {
        pl: "Sprawdzamy możliwości silnika i oczekiwania. Dobieramy bezpieczną mapę pod Twój silnik.",
        ru: "Оцениваем возможности мотора и ожидания. Подбираем безопасную карту.",
      },
    },
    {
      title: { pl: "Diagnostyka przed tuningiem", ru: "Диагностика перед тюнингом" },
      description: {
        pl: "Skan ECU, kontrola błędów i parametrów — tuning tylko na zdrowym silniku.",
        ru: "Скан ECU, проверка ошибок — тюнинг только на исправном двигателе.",
      },
    },
    {
      title: { pl: "Akceptacja zakresu i wyceny", ru: "Согласование сметы" },
      description: {
        pl: "Przedstawiamy zakres i efekt. Po akceptacji wgrywamy mapę Stage 1.",
        ru: "Показываем объём и эффект. После согласования — прошивка Stage 1.",
      },
    },
    {
      title: { pl: "Mapa i jazda testowa", ru: "Карта и тест-драйв" },
      description: {
        pl: "Zapis mapy, kontrola parametrów na jeździe testowej.",
        ru: "Запись карты, проверка параметров на тест-драйве.",
      },
    },
  ],
  diagnostic: [
    {
      title: { pl: "Rezerwacja i opis objawów", ru: "Запись и описание симптомов" },
      description: {
        pl: "Opisujesz problem: lampka, dźwięk, zachowanie auta — przygotowujemy odpowiedni sprzęt.",
        ru: "Описываете симптомы — готовим нужное оборудование.",
      },
    },
    {
      title: { pl: "Podłączenie komputera diagnostycznego", ru: "Подключение сканера" },
      description: {
        pl: "Skaner OBD — kody błędów ze wszystkich układów: silnik, skrzynia, ABS, airbag.",
        ru: "OBD-сканер — коды ошибок всех систем: двигатель, КПП, ABS, подушки.",
      },
    },
    {
      title: { pl: "Analiza i wyjaśnienie wyników", ru: "Разбор результатов" },
      description: {
        pl: "Tłumaczymy błędy — co pilne, co można odłożyć. Bez żargonu, konkretne priorytety.",
        ru: "Объясняем ошибки — что срочно, что можно отложить. Без жаргона.",
      },
    },
    {
      title: { pl: "Raport i rekomendacje", ru: "Отчёт и рекомендации" },
      description: {
        pl: "Pisemny raport z błędami i naprawami. Decydujesz co robimy od razu, a co później.",
        ru: "Письменный отчёт. Решаете, что делаем сейчас, что позже.",
      },
    },
  ],
  brakePads: [
    {
      title: { pl: "Rezerwacja i wstępna ocena", ru: "Запись и первичная оценка" },
      description: {
        pl: "Opisujesz objawy (pisk, droga hamowania). Rezerwujemy czas na oś.",
        ru: "Описываете симптомы. Бронируем время на подъёмник.",
      },
    },
    {
      title: { pl: "Demontaż kół i kontrola układu", ru: "Снятие колёс и осмотр" },
      description: {
        pl: "Sprawdzamy klocki, tarcze, zaciski i przewody — mierzymy grubość i stan.",
        ru: "Проверяем колодки, диски, суппорты и шланги.",
      },
    },
    {
      title: { pl: "Wymiana klocków / tarcz", ru: "Замена колодок / дисков" },
      description: {
        pl: "Montujemy nowe elementy, smarujemy prowadnice, sprawdzamy szczelność.",
        ru: "Устанавливаем новые детали, обслуживаем направляющие.",
      },
    },
    {
      title: { pl: "Jazda testowa i odbiór", ru: "Тест и выдача" },
      description: {
        pl: "Hamujemy na placu, sprawdzamy szczelność. Odbiór z raportem wymienionych części.",
        ru: "Проверка торможения. Выдача с отчётом по деталям.",
      },
    },
  ],
  acRefill: [
    {
      title: { pl: "Rezerwacja i opis objawów", ru: "Запись и симптомы" },
      description: {
        pl: "Słaba chłodziwość, zapach, hałas — ustalamy zakres serwisu klimy.",
        ru: "Слабое охлаждение, запах — определяем объём работ.",
      },
    },
    {
      title: { pl: "Diagnostyka układu klimatyzacji", ru: "Диагностика кондиционера" },
      description: {
        pl: "Pomiar ciśnienia, szczelność obiegu, stan czynnika.",
        ru: "Давление, герметичность, состояние фреона.",
      },
    },
    {
      title: { pl: "Nabicie / odgrzybianie", ru: "Заправка / антибактериальная обработка" },
      description: {
        pl: "Uzupełniamy czynnik, czyścimy parownik i kanały — przywracamy chłodzenie.",
        ru: "Дозаправка, очистка испарителя и каналов.",
      },
    },
    {
      title: { pl: "Kontrola i odbiór", ru: "Проверка и выдача" },
      description: {
        pl: "Sprawdzamy temperaturę nawiewu. Odbiór z informacją o kolejnym serwisie.",
        ru: "Проверка температуры воздуха. Рекомендация по следующему сервису.",
      },
    },
  ],
  tires: [
    {
      title: { pl: "Rezerwacja terminu", ru: "Запись на время" },
      description: {
        pl: "Wybierasz wymianę, wyważanie lub sezonową zmianę — rezerwujemy slot bez kolejki.",
        ru: "Шиномонтаж, балансировка или сезонная смена — без очереди.",
      },
    },
    {
      title: { pl: "Demontaż i kontrola felg", ru: "Демонтаж и осмотр дисков" },
      description: {
        pl: "Zdejmujemy koła, sprawdzamy stan opon i felg, oznaczamy oś.",
        ru: "Снимаем колёса, проверяем шины и диски.",
      },
    },
    {
      title: { pl: "Montaż i wyważanie", ru: "Монтаж и балансировка" },
      description: {
        pl: "Montujemy opony, wyważamy na maszynie, prawidłowy moment dokręcenia.",
        ru: "Монтаж, балансировка, правильный момент затяжки.",
      },
    },
    {
      title: { pl: "Kontrola ciśnienia i odbiór", ru: "Давление и выдача" },
      description: {
        pl: "Ustawiamy ciśnienie wg producenta. Auto gotowe do jazdy.",
        ru: "Давление по норме производителя. Можно ехать.",
      },
    },
  ],
};

export const SERVICE_LANDING_EDUCATION: Partial<
  Record<ServiceId, ServiceLandingEducationItem[]>
> = {
  oil: [
    {
      title: { pl: "Kiedy wymieniać olej?", ru: "Когда менять масло?" },
      body: {
        pl: "Co 10 000–15 000 km przy oleju syntetycznym lub co rok. Objawy: czarny olej na bagnetcie, głośny silnik po zimnym starcie, większe spalanie, kontrolka ciśnienia.",
        ru: "Каждые 10–15 тыс. км или раз в год. Симптомы: тёмное масло, шум при холодном пуске, повышенный расход, лампа давления.",
      },
    },
    {
      title: { pl: "Co wymieniamy", ru: "Что меняем" },
      body: {
        pl: "Olej silnikowy, filtr oleju (standard). Na życzenie: filtr powietrza, kabinowy, paliwa — sprawdzamy stan przy wizycie.",
        ru: "Моторное масло и масляный фильтр. По запросу: воздушный, салонный, топливный.",
      },
    },
    {
      title: { pl: "Jakie oleje stosujemy", ru: "Какие масла используем" },
      body: {
        pl: "Castrol, Mobil, Shell, Motul — specyfikacja pod VIN (np. VW 504.00, BMW LL-04, MB 229.5). Bez oleju uniwersalnego.",
        ru: "Castrol, Mobil, Shell, Motul — спецификация по VIN (VW 504.00, BMW LL-04 и т.д.).",
      },
    },
  ],
  diagnostic: [
    {
      title: { pl: "Kiedy potrzebna diagnostyka?", ru: "Когда нужна диагностика?" },
      body: {
        pl: "Kontrolka silnika, nietypowe dźwięki, spadek mocy, problemy ze skrzynią lub elektroniką.",
        ru: "Check engine, странные звуки, потеря мощности, проблемы с КПП или электрикой.",
      },
    },
    {
      title: { pl: "Czy odczyt OBD jest bezpłatny?", ru: "OBD бесплатно?" },
      body: {
        pl: "Krótki odczyt kodów przy wizycie — często w ramach konsultacji. Pełna diagnostyka z raportem to osobna usługa.",
        ru: "Краткое считывание при визите часто бесплатно. Полная диагностика с отчётом — отдельная услуга.",
      },
    },
  ],
  chip: [
    {
      title: { pl: "Czy chip tuning jest bezpieczny?", ru: "Чип-тюнинг безопасен?" },
      body: {
        pl: "Tak — po diagnostyce i w granicach tolerancji silnika. Nie tuningujemy aut z poważnymi usterkami.",
        ru: "Да — после диагностики и в пределах допусков. Не тюним авто с серьёзными неисправностями.",
      },
    },
    {
      title: { pl: "Stage 1 vs Stage 2", ru: "Stage 1 и Stage 2" },
      body: {
        pl: "Stage 1 — optymalizacja fabrycznej mapy. Stage 2 — często wymaga modyfikacji układu dolotowego/wydechowego.",
        ru: "Stage 1 — оптимизация штатной карты. Stage 2 — часто нужны доработки впуска/выпуска.",
      },
    },
  ],
};

export const SERVICE_LANDING_FAQ_EXTRA: Partial<
  Record<ServiceId, { q: LocalizedText; a: LocalizedText }[]>
> = {
  oil: [
    {
      q: {
        pl: "Skąd wiecie, jaki olej pasuje do mojego auta?",
        ru: "Откуда вы знаете, какое масло подходит?",
      },
      a: {
        pl: "Dobieramy na podstawie VIN lub dowodu — norma producenta (VW 504.00, BMW LL-04, MB 229.5). Każdy silnik dostaje właściwą specyfikację.",
        ru: "По VIN или СТС — норма производителя. Без «универсального» масла.",
      },
    },
    {
      q: {
        pl: "Czy wymieniacie tylko olej, czy też filtry?",
        ru: "Меняете только масло или и фильтры?",
      },
      a: {
        pl: "Standard: olej + filtr oleju. Na życzenie filtry powietrza, kabinowy, paliwa — wycena przy wizycie.",
        ru: "Стандарт: масло + масляный фильтр. По запросу — остальные фильтры.",
      },
    },
    {
      q: {
        pl: "Po ilu km następna wymiana?",
        ru: "Через сколько км следующая замена?",
      },
      a: {
        pl: "Zwykle 10 000–15 000 km lub co rok. Naklejka na szybie z datą i przebiegiem.",
        ru: "Обычно 10–15 тыс. км или раз в год. Наклейка на стекло.",
      },
    },
    {
      q: {
        pl: "Skąd wiem, że olej został wymieniony?",
        ru: "Как убедиться, что масло заменили?",
      },
      a: {
        pl: "Pokazujemy stary filtr i spuszczony olej. Paragon z nazwą oleju i numerem filtra + naklejka serwisowa.",
        ru: "Показываем старый фильтр и слив. Чек и сервисная наклейка.",
      },
    },
  ],
  diagnostic: [
    {
      q: {
        pl: "Czy odczyt błędów OBD jest bezpłatny?",
        ru: "Считывание OBD бесплатно?",
      },
      a: {
        pl: "Krótki odczyt przy wizycie często bez opłaty. Pełny raport diagnostyczny — według cennika.",
        ru: "Краткое считывание часто бесплатно. Полный отчёт — по прайсу.",
      },
    },
    {
      q: {
        pl: "Ile trwa pełna diagnostyka?",
        ru: "Сколько длится полная диагностика?",
      },
      a: {
        pl: "Zwykle 30–60 minut, zależnie od objawów i liczby układów.",
        ru: "Обычно 30–60 минут в зависимости от симптомов.",
      },
    },
  ],
  chip: [
    {
      q: {
        pl: "Czy chip tuning jest bezpieczny dla silnika?",
        ru: "Чип-тюнинг безопасен для двигателя?",
      },
      a: {
        pl: "Po diagnostyce i w bezpiecznych granicach mapy. Nie zaczynamy przy aktywnych usterkach silnika.",
        ru: "После диагностики и в безопасных пределах. Не начинаем при серьёзных ошибках.",
      },
    },
    {
      q: {
        pl: "Ile trwa chip tuning?",
        ru: "Сколько времени занимает чип-тюнинг?",
      },
      a: {
        pl: "Stage 1 zwykle 1 dzień — diagnostyka, mapa, jazda testowa.",
        ru: "Stage 1 обычно 1 день — диагностика, карта, тест-драйв.",
      },
    },
  ],
  brakePads: [
    {
      q: {
        pl: "Skąd wiem, że klocki są zużyte?",
        ru: "Как понять, что колодки изношены?",
      },
      a: {
        pl: "Pisk, dłuższa droga hamowania, wibracje kierownicy, kontrolka ABS.",
        ru: "Скрип, удлинённый тормозной путь, вибрация руля.",
      },
    },
    {
      q: {
        pl: "Czy wymieniacie też tarcze?",
        ru: "Меняете и диски?",
      },
      a: {
        pl: "Tak — oceniamy grubość tarcz. Wymiana tarcz gdy poniżej minimum lub rowki.",
        ru: "Да — оцениваем толщину дисков, меняем при износе.",
      },
    },
  ],
  acRefill: [
    {
      q: {
        pl: "Jak często serwisować klimatyzację?",
        ru: "Как часто обслуживать кондиционер?",
      },
      a: {
        pl: "Co 1–2 lata lub gdy słaba chłodziwość / nieprzyjemny zapach.",
        ru: "Раз в 1–2 года или при слабом охлаждении / запахе.",
      },
    },
  ],
};

const DEFAULT_STEPS: ServiceLandingStep[] = [
  {
    title: { pl: "Rezerwacja online lub telefon", ru: "Запись онлайн или по телефону" },
    description: {
      pl: "Podajesz markę, model i zakres prac — rezerwujemy termin.",
      ru: "Указываете марку, модель и работы — бронируем время.",
    },
  },
  {
    title: { pl: "Przyjęcie auta na warsztat", ru: "Приём авто в сервис" },
    description: {
      pl: "Sprawdzamy stan auta i potwierdzamy zakres usługi na Twoim pojeździe.",
      ru: "Проверяем состояние и подтверждаем объём работ.",
    },
  },
  {
    title: { pl: "Wykonanie usługi", ru: "Выполнение работ" },
    description: {
      pl: "Mechanicy pracują na Twoim aucie według uzgodnionego zakresu.",
      ru: "Механики выполняют работы на вашем авто.",
    },
  },
  {
    title: { pl: "Kontrola jakości i odbiór", ru: "Контроль и выдача" },
    description: {
      pl: "Sprawdzamy efekt, przekazujemy raport i fakturę — auto gotowe.",
      ru: "Проверяем результат, отчёт и документы — авто готово.",
    },
  },
];

const ESTIMATE_STEP: ServiceLandingStep = {
  title: { pl: "Akceptacja zakresu i wyceny", ru: "Согласование объёма и сметы" },
  description: {
    pl: "Przedstawiamy wycenę i zakres. Po akceptacji (podpis) przystępujemy do naprawy.",
    ru: "Показываем смету и объём. После согласования (подпись) начинаем работы.",
  },
};

export function getServiceLandingSteps(serviceId: ServiceId): ServiceLandingStep[] {
  const custom = SERVICE_LANDING_STEPS[serviceId];
  if (custom) return custom;

  if (SERVICES_WITH_ESTIMATE_STEP.has(serviceId)) {
    return [DEFAULT_STEPS[0]!, DEFAULT_STEPS[1]!, ESTIMATE_STEP, DEFAULT_STEPS[3]!];
  }
  return DEFAULT_STEPS;
}

export function getServiceLandingPrice(serviceId: ServiceId): ServiceLandingPrice | null {
  const priceId = serviceBasePriceId[serviceId];
  if (!priceId) {
    if (serviceId === "brakePads") {
      return {
        fromZl: 200,
        priceFrom: true,
        materialsExtra: true,
        includes: [
          {
            pl: "Demontaż kół i kontrola układu hamulcowego",
            ru: "Снятие колёс и осмотр тормозов",
          },
          { pl: "Wymiana klocków hamulcowych", ru: "Замена тормозных колодок" },
          { pl: "Kontrola szczelności i jazda testowa", ru: "Проверка и тест" },
        ],
        note: {
          pl: "Cena zależy od osi i modelu — materiały według wyboru.",
          ru: "Цена зависит от оси и модели — материалы отдельно.",
        },
      };
    }
    if (serviceId === "tires") {
      return {
        fromZl: 160,
        priceFrom: true,
        materialsExtra: false,
        includes: [
          { pl: "Demontaż i montaż opon", ru: "Демонтаж и монтаж" },
          { pl: "Wyważanie kół", ru: "Балансировка" },
          { pl: "Kontrola ciśnienia", ru: "Проверка давления" },
        ],
        priceTable: [
          {
            label: { pl: "Felgi stalowe R15–R17", ru: "Сталь R15–R17" },
            priceZl: getPriceItem("tire_change_steel_15_17")?.basePrice ?? 160,
            priceFrom: true,
          },
          {
            label: { pl: "Felgi stalowe R18–R20", ru: "Сталь R18–R20" },
            priceZl: getPriceItem("tire_change_steel_18_20")?.basePrice ?? 200,
            priceFrom: true,
          },
          {
            label: { pl: "Felgi aluminiowe R15–R17", ru: "Литые R15–R17" },
            priceZl: getPriceItem("tire_change_cast_15_17")?.basePrice ?? 200,
            priceFrom: true,
          },
          {
            label: { pl: "Felgi aluminiowe R18–R20", ru: "Литые R18–R20" },
            priceZl: getPriceItem("tire_change_cast_18_20")?.basePrice ?? 250,
            priceFrom: true,
          },
        ],
        note: {
          pl: "Ceny za kompleksową wymianę 4 kół — szczegóły na stronie Cennik.",
          ru: "Цены за комплексную замену 4 колёс — подробности в прайсе.",
        },
      };
    }
    return null;
  }

  const item = getPriceItem(priceId);
  if (!item) return null;

  return {
    fromZl: item.basePrice,
    priceFrom: item.priceFrom ?? true,
    materialsExtra: serviceId === "oil" || serviceId === "acRefill",
    includes: getDefaultIncludes(serviceId),
    note:
      serviceId === "oil"
        ? {
            pl: "od 150 zł robocizna + koszt oleju i filtrów dobrane pod VIN.",
            ru: "от 150 zł работа + стоимость масла и фильтров по VIN.",
          }
        : undefined,
  };
}

function getDefaultIncludes(serviceId: ServiceId): LocalizedText[] {
  const map: Partial<Record<ServiceId, LocalizedText[]>> = {
    oil: [
      { pl: "Wymiana oleju silnikowego", ru: "Замена моторного масла" },
      { pl: "Wymiana filtra oleju", ru: "Замена масляного фильтра" },
      { pl: "Kontrola poziomu i szczelności", ru: "Проверка уровня и утечек" },
      { pl: "Naklejka serwisowa z terminem", ru: "Сервисная наклейка" },
    ],
    diagnostic: [
      { pl: "Podłączenie skanera OBD", ru: "Подключение OBD" },
      { pl: "Odczyt kodów błędów", ru: "Считывание кодов" },
      { pl: "Omówienie wyników z mechanikiem", ru: "Разбор с механиком" },
    ],
    chip: [
      { pl: "Diagnostyka ECU przed tuningiem", ru: "Диагностика ECU" },
      { pl: "Dobór i zapis mapy", ru: "Подбор и запись карты" },
      { pl: "Jazda testowa", ru: "Тест-драйв" },
    ],
  };
  return (
    map[serviceId] ?? [
      { pl: "Profesjonalna obsługa w warsztacie", ru: "Профессиональное обслуживание" },
      { pl: "Raport z wykonanych prac", ru: "Отчёт о выполненных работах" },
    ]
  );
}

const GENERIC_EDUCATION: ServiceLandingEducationItem[] = [
  {
    title: { pl: "Dlaczego warto serwisować u nas?", ru: "Почему у нас?" },
    body: {
      pl: "Doświadczeni mechanicy, przejrzysta wycena i oryginalne części. Każde auto traktujemy indywidualnie.",
      ru: "Опытные механики, прозрачная смета и качественные запчасти. К каждому авто — индивидуальный подход.",
    },
  },
];

export function getServiceLandingEducation(
  serviceId: ServiceId
): ServiceLandingEducationItem[] {
  return SERVICE_LANDING_EDUCATION[serviceId] ?? GENERIC_EDUCATION;
}

export function getServiceLandingFaq(
  serviceId: ServiceId
): { q: LocalizedText; a: LocalizedText }[] {
  const extra = SERVICE_LANDING_FAQ_EXTRA[serviceId] ?? [];
  return [...GENERAL_FAQ, ...extra].slice(0, 5);
}

/** Gallery filter hints for landing photo strip */
export const SERVICE_LANDING_GALLERY_TAGS: Partial<Record<ServiceId, string[]>> = {
  oil: ["olej", "oil", "serwis"],
  diagnostic: ["diagnost", "scan"],
  brakePads: ["hamulc", "brake"],
  chip: ["tuning", "chip"],
  tires: ["opon", "tire"],
};
