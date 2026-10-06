import type { ServiceId } from "@/lib/services-catalog";
import { getPriceItem } from "@/lib/price-list";
import { serviceBasePriceId } from "@/lib/service-price-map";
import { getSlugLandingProfile } from "@/lib/seo-landing-slug-profiles";

export type LocalizedText = { pl: string; ru: string; en?: string; uk?: string };

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
  /** Promo “was” price — shown crossed out in price table */
  compareAtZl?: number;
};

export type ServiceLandingPrice = {
  fromZl: number;
  priceFrom: boolean;
  /** Promo “was” price for main heading */
  compareAtZl?: number;
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
      en: "Can I stay and wait during service?",
      uk: "Чи можу я залишитися і чекати під час обслуговування?",
    },
    a: {
      pl: "Tak — mamy strefę oczekiwania z kawą i Wi-Fi. Wymiana oleju trwa ok. godziny, większość klientów zostaje na miejscu.",
      ru: "Да — есть зона ожидания с кофе и Wi-Fi. Замена масла ~1 час, большинство клиентов остаются на месте.",
      en: "Yes — we have a waiting area with coffee and Wi-Fi. The oil change takes about an hour, most customers stay in place.",
      uk: "Так, є зона очікування з кавою та Wi-Fi. Заміна масла ~1 година, більшість клієнтів залишаються на місці.",
    },
  },
  {
    q: {
      pl: "Jak długo trwa usługa?",
      ru: "Сколько времени занимает услуга?",
      en: "How long does the service last?",
      uk: "Скільки часу займає обслуговування?",
    },
    a: {
      pl: "Zależy od usługi — przy rezerwacji podajemy orientacyjny czas. Na stronie widzisz szacunek dla wybranej usługi.",
      ru: "Зависит от услуги — при записи называем ориентир. На странице есть оценка для выбранной услуги.",
      en: "It depends on the service — we provide an approximate time when booking. On the page you can see the respect for the selected service.",
      uk: "Залежить від сервісу — під час запису ми називаємо орієнтир. На сторінці є оцінка обраної послуги.",
    },
  },
];

export const SERVICE_LANDING_STEPS: Partial<Record<ServiceId, ServiceLandingStep[]>> = {
  oil: [
    {
      title: { pl: "Rezerwacja i dobór oleju", ru: "Запись и подбор масла", en: "Reservation and selection of oil", uk: "Реєстрація та вибір масла" },
      description: {
        pl: "Umawiasz się online lub dzwonisz. Podajesz markę, model i przebieg — dobieramy olej zgodnie ze specyfikacją producenta.",
        ru: "Запись онлайн или по телефону. Марка, модель, пробег — подбираем масло по спецификации производителя.",
        en: "You're dating online or calling. You specify the make, model and mileage — we select the oil according to the manufacturer's specification.",
        uk: "Записуйте онлайн або за телефоном. Марка, модель, пробіг — підбираємо масло за специфікацією виробника.",
      },
    },
    {
      title: { pl: "Spust starego oleju i wymiana filtra", ru: "Слив старого масла и замена фильтра", en: "Drainage of old oil and replacement of filter", uk: "Злив старого масла та заміна фільтра" },
      description: {
        pl: "Podnosimy auto, spuszczamy stary olej i wymieniamy filtr oleju. Sprawdzamy korek spustowy i uszczelkę.",
        ru: "Поднимаем авто, сливаем масло, меняем масляный фильтр. Проверяем пробку и прокладку.",
        en: "We pick up the car, drain the old oil and replace the oil filter. Check the drain plug and gasket.",
        uk: "Підніміть машину, злийте масло, замініть масляний фільтр. Перевірте пробку та прокладку.",
      },
    },
    {
      title: { pl: "Zalanie nowego oleju i kontrola", ru: "Залив нового масла и проверка", en: "Flooding new oil and checking", uk: "Заправка нової оливи та перевірка" },
      description: {
        pl: "Zalewamy świeży olej, uruchamiamy silnik, sprawdzamy szczelność i poziom oleju na zimno i na ciepło.",
        ru: "Заливаем масло, запускаем двигатель, проверяем утечки и уровень на холодном и горячем.",
        en: "We pour in fresh oil, start the engine, check the tightness and oil level cold and hot.",
        uk: "Заповніть мастило, запустіть двигун, перевірте витоки та рівень холодної та гарячої оливи.",
      },
    },
    {
      title: { pl: "Raport i naklejka przypomnienia", ru: "Отчёт и наклейка напоминания", en: "Report and Reminder Sticker", uk: "Звіт із нагадуванням та наклейка" },
      description: {
        pl: "Raport z materiałów i terminu następnej wymiany. Naklejka na szybie z datą i przebiegiem — gotowe.",
        ru: "Отчёт по материалам и сроку следующей замены. Наклейка на стекло с датой и пробегом.",
        en: "Report on materials and the date of the next replacement. Date and mileage sticker on the glass — ready.",
        uk: "Звіт про матеріали та дату наступної заміни. Наклейка на склі з датою та пробігом.",
      },
    },
  ],
  chip: [
    {
      title: { pl: "Konsultacja i dobór mapy", ru: "Консультация и выбор карты", en: "Consultation and selection of the map", uk: "Консультація та вибір картки" },
      description: {
        pl: "Omawiasz cel — więcej mocy, dynamika lub oszczędność. Dobieramy Stage 1 lub Stage 2 do Twojego silnika.",
        ru: "Обсуждаем цель — мощность, динамика или экономия. Подбираем Stage 1 или 2 под ваш мотор.",
        en: "You discuss the goal — more power, dynamics or savings. We select Stage 1 or Stage 2 for your engine.",
        uk: "Обговорюємо мету — влада, динаміка чи економія. Ми вибираємо етап 1 або 2 для вашого двигуна.",
      },
    },
    {
      title: { pl: "Diagnostyka ECU przed tuningiem", ru: "Диагностика ECU перед тюнингом", en: "ECU diagnostics before tuning", uk: "Діагностика ECU перед налаштуванням" },
      description: {
        pl: "Odczytujemy błędy i sprawdzamy stan silnika. Tuning tylko na sprawnym aucie — warunek bezpieczeństwa.",
        ru: "Считываем ошибки, проверяем двигатель. Тюнинг только на исправном авто.",
        en: "We read errors and check the condition of the motor. Tuning only on an efficient car — a safety condition.",
        uk: "Прочитайте помилки, перевірте двигун. Тюнінг тільки на справний автомобіль.",
      },
    },
    {
      title: { pl: "Akceptacja zakresu i wyceny", ru: "Согласование объёма и сметы", en: "Acceptance of scope and valuation", uk: "Затвердження обсягу та кошторису" },
      description: {
        pl: "Pokazujemy co zmieniamy w mapie i jaki będzie efekt. Podpisujesz zakres — dopiero potem zaczynamy.",
        ru: "Показываем изменения в карте и эффект. Подписываете объём работ — только потом начинаем.",
        en: "We show what we change in the map and what the effect will be. You sign the scope — only then do we start.",
        uk: "Показуємо зміни на карті та ефект. Ви підписуєте обсяг робіт — тільки тоді ми починаємо.",
      },
    },
    {
      title: { pl: "Zapis mapy i jazda testowa", ru: "Запись карты и тест-драйв", en: "Map Saving and Test Drive", uk: "Запис картки та тест-драйв" },
      description: {
        pl: "Wgrywamy mapę ECU, jazda testowa — moc, moment, temperatura silnika.",
        ru: "Прошиваем ECU, тест-драйв — мощность, момент, температура.",
        en: "Upload the ECU map, test drive — power, torque, engine temperature.",
        uk: "Пожежний ECU, тест-драйв — потужність, крутний момент, температура.",
      },
    },
  ],
  stage1: [
    {
      title: { pl: "Konsultacja Stage 1", ru: "Консультация Stage 1", en: "Consultation Stage 1", uk: "Етап консультації 1" },
      description: {
        pl: "Sprawdzamy możliwości silnika i oczekiwania. Dobieramy bezpieczną mapę pod Twój silnik.",
        ru: "Оцениваем возможности мотора и ожидания. Подбираем безопасную карту.",
        en: "We check the engine's capabilities and expectations. We choose a safe map for your engine.",
        uk: "Оцініть можливості двигуна та очікування. Вибираємо безпечну картку.",
      },
    },
    {
      title: { pl: "Diagnostyka przed tuningiem", ru: "Диагностика перед тюнингом", en: "Pre-Tuning Diagnostics", uk: "Діагностика перед налаштуванням" },
      description: {
        pl: "Skan ECU, kontrola błędów i parametrów — tuning tylko na zdrowym silniku.",
        ru: "Скан ECU, проверка ошибок — тюнинг только на исправном двигателе.",
        en: "ECU scan, error and parameter control — tuning only on a healthy engine.",
        uk: "Сканування ECU, перевірка помилок — налаштування тільки на справний двигун.",
      },
    },
    {
      title: { pl: "Akceptacja zakresu i wyceny", ru: "Согласование сметы", en: "Acceptance of scope and valuation", uk: "Затвердження кошторису" },
      description: {
        pl: "Przedstawiamy zakres i efekt. Po akceptacji wgrywamy mapę Stage 1.",
        ru: "Показываем объём и эффект. После согласования — прошивка Stage 1.",
        en: "We present the scope and effect. After acceptance, we upload the Stage 1 map.",
        uk: "Показуємо об 'єм і ефект. Після затвердження — прошивка етапу 1.",
      },
    },
    {
      title: { pl: "Mapa i jazda testowa", ru: "Карта и тест-драйв", en: "Map and test drive", uk: "Карта та тест-драйв" },
      description: {
        pl: "Zapis mapy, kontrola parametrów na jeździe testowej.",
        ru: "Запись карты, проверка параметров на тест-драйве.",
        en: "Map recording, control of parameters on a test drive.",
        uk: "Запис карти, перевірка параметрів на тест-драйві.",
      },
    },
  ],
  diagnostic: [
    {
      title: { pl: "Rezerwacja i opis objawów", ru: "Запись и описание симптомов", en: "Reservation and description of symptoms", uk: "Реєстрація та опис симптомів" },
      description: {
        pl: "Opisujesz problem: lampka, dźwięk, zachowanie auta — przygotowujemy odpowiedni sprzęt.",
        ru: "Описываете симптомы — готовим нужное оборудование.",
        en: "You describe the problem: lamp, sound, car behavior — we prepare the right equipment.",
        uk: "Опишіть симптоми — підготуйте необхідне обладнання.",
      },
    },
    {
      title: { pl: "Podłączenie komputera diagnostycznego", ru: "Подключение сканера", en: "Connecting the diagnostic computer", uk: "Підключення сканера" },
      description: {
        pl: "Skaner OBD — kody błędów ze wszystkich układów: silnik, skrzynia, ABS, airbag.",
        ru: "OBD-сканер — коды ошибок всех систем: двигатель, КПП, ABS, подушки.",
        en: "OBD scanner — error codes from all systems: engine, box, ABS, airbag.",
        uk: "OBD сканер — коди помилок всіх систем: двигун, коробка передач, ABS, подушки безпеки.",
      },
    },
    {
      title: { pl: "Analiza i wyjaśnienie wyników", ru: "Разбор результатов", en: "Analysis and explanation of results", uk: "Аналіз результатів" },
      description: {
        pl: "Tłumaczymy błędy — co pilne, co można odłożyć. Bez żargonu, konkretne priorytety.",
        ru: "Объясняем ошибки — что срочно, что можно отложить. Без жаргона.",
        en: "We explain errors — what is urgent, what can be postponed. No jargon, specific priorities.",
        uk: "Пояснення помилок — що терміново, що можна відкласти. Жодного жаргону.",
      },
    },
    {
      title: { pl: "Raport i rekomendacje", ru: "Отчёт и рекомендации", en: "Report and recommendations", uk: "Звіт та рекомендації" },
      description: {
        pl: "Pisemny raport z błędami i naprawami. Decydujesz co robimy od razu, a co później.",
        ru: "Письменный отчёт. Решаете, что делаем сейчас, что позже.",
        en: "Written error and repair report. You decide what we do right away and what we do next.",
        uk: "Письмовий звіт. Вирішіть, що ми робимо зараз, що пізніше.",
      },
    },
  ],
  brakePads: [
    {
      title: { pl: "Rezerwacja i wstępna ocena", ru: "Запись и первичная оценка", en: "Booking and pre-assessment", uk: "Запис та первинна оцінка" },
      description: {
        pl: "Opisujesz objawy (pisk, droga hamowania). Rezerwujemy czas na oś.",
        ru: "Описываете симптомы. Бронируем время на подъёмник.",
        en: "You describe the symptoms (squeak, braking distance). We reserve time for the axis.",
        uk: "Опишіть симптоми. Забронюйте час для підйому.",
      },
    },
    {
      title: { pl: "Demontaż kół i kontrola układu", ru: "Снятие колёс и осмотр", en: "Wheel disassembly and system inspection", uk: "Зняття та огляд коліс" },
      description: {
        pl: "Sprawdzamy klocki, tarcze, zaciski i przewody — mierzymy grubość i stan.",
        ru: "Проверяем колодки, диски, суппорты и шланги.",
        en: "We check the blocks, discs, terminals and wires — we measure the thickness and condition.",
        uk: "Перевіряємо колодки, диски, штангенциркулі та шланги.",
      },
    },
    {
      title: { pl: "Wymiana klocków / tarcz", ru: "Замена колодок / дисков", en: "Replacing pads / discs", uk: "Заміна колодок / дисків" },
      description: {
        pl: "Montujemy nowe elementy, smarujemy prowadnice, sprawdzamy szczelność.",
        ru: "Устанавливаем новые детали, обслуживаем направляющие.",
        en: "We install new elements, lubricate the guides, check for leaks.",
        uk: "Встановлюємо нові деталі, обслуговуємо напрямні.",
      },
    },
    {
      title: { pl: "Jazda testowa i odbiór", ru: "Тест и выдача", en: "Test drive and acceptance", uk: "Тестування та отримання" },
      description: {
        pl: "Hamujemy na placu, sprawdzamy szczelność. Odbiór z raportem wymienionych części.",
        ru: "Проверка торможения. Выдача с отчётом по деталям.",
        en: "We brake on the square, check for leaks. Acceptance with the report of the replaced parts.",
        uk: "Перевірка гальмування - видача звіту про деталі.",
      },
    },
  ],
  acRefill: [
    {
      title: { pl: "Rezerwacja i opis objawów", ru: "Запись и симптомы", en: "Reservation and description of symptoms", uk: "Запис і симптоми" },
      description: {
        pl: "Słaba chłodziwość, zapach, hałas — ustalamy zakres serwisu klimy.",
        ru: "Слабое охлаждение, запах — определяем объём работ.",
        en: "Poor coolness, smell, noise — we determine the scope of climate service.",
        uk: "Слабке охолодження, запах — визначити обсяг робіт.",
      },
    },
    {
      title: { pl: "Diagnostyka układu klimatyzacji", ru: "Диагностика кондиционера", en: "Air Conditioning System Diagnostics", uk: "Діагностика кондиціонерів" },
      description: {
        pl: "Pomiar ciśnienia, szczelność obiegu, stan czynnika.",
        ru: "Давление, герметичность, состояние фреона.",
        en: "Pressure measurement, tightness of the circuit, condition of the medium.",
        uk: "Тиск, герметичність, стан фреону.",
      },
    },
    {
      title: { pl: "Nabicie / odgrzybianie", ru: "Заправка / антибактериальная обработка", en: "Charging / defunging", uk: "Заправка / антибактеріальна обробка" },
      description: {
        pl: "Uzupełniamy czynnik, czyścimy parownik i kanały — przywracamy chłodzenie.",
        ru: "Дозаправка, очистка испарителя и каналов.",
        en: "We replenish the refrigerant, clean the evaporator and the ducts — we restore cooling.",
        uk: "Заправка, очищення випарника та каналів.",
      },
    },
    {
      title: { pl: "Kontrola i odbiór", ru: "Проверка и выдача", en: "Inspection and Acceptance:", uk: "Перевірка та видача" },
      description: {
        pl: "Sprawdzamy temperaturę nawiewu. Odbiór z informacją o kolejnym serwisie.",
        ru: "Проверка температуры воздуха. Рекомендация по следующему сервису.",
        en: "We check the air temperature. Receipt with information about the next service.",
        uk: "Перевірка температури повітря Рекомендації для наступного обслуговування.",
      },
    },
  ],
  acRepair: [
    {
      title: { pl: "Rezerwacja i opis usterki", ru: "Запись и описание неисправности", en: "Reservation and fault description", uk: "Запис та опис несправності" },
      description: {
        pl: "Brak chłodzenia, syczenie, zapach, wyciek — opisujesz objawy, ustalamy termin diagnostyki.",
        ru: "Нет холода, шипение, запах, утечка — описываете симптомы, назначаем диагностику.",
        en: "Lack of cooling, hissing, smell, leakage – you describe the symptoms, we schedule a diagnostics.",
        uk: "Відсутність застуди, шипіння, запаху, протікання — опишіть симптоми, призначте діагноз.",
      },
    },
    {
      title: { pl: "Diagnostyka i lokalizacja usterki", ru: "Диагностика и поиск неисправности", en: "Diagnosis and fault location", uk: "Діагностика та усунення несправностей" },
      description: {
        pl: "Test szczelności obiegu, pomiar ciśnienia, oględziny przewodów, chłodnicy i sprężarki.",
        ru: "Проверка герметичности, давление, осмотр трубок, радиатора и компрессора.",
        en: "Circuit leak test, pressure measurement, visual inspection of hoses, cooler and compressor.",
        uk: "Випробування на герметичність, тиск, огляд труб, радіатора та компресора.",
      },
    },
    {
      title: { pl: "Naprawa lub wymiana elementów", ru: "Ремонт или замена узлов", en: "Repair or replacement of components", uk: "Ремонт або заміна агрегатів" },
      description: {
        pl: "Spawanie przewodów, wymiana uszczelek, chłodnicy, osuszacza lub sprężarki — według wyceny.",
        ru: "Сварка трубок, замена уплотнений, радиатора, осушителя или компрессора — по смете.",
        en: "Welding of pipes, replacement of gaskets, cooler, dryer or compressor — according to the valuation.",
        uk: "Зварювання труб, заміна ущільнень, радіатора, сушарки або компресора — згідно кошторису.",
      },
    },
    {
      title: { pl: "Próżnia, nabijanie i test", ru: "Вакуум, заправка и проверка", en: "Vacuum, ramming and test", uk: "Вакуум, заправка та перевірка" },
      description: {
        pl: "Po naprawie odpowietrzamy układ, napełniamy R134a lub R1234yf i sprawdzamy chłodzenie.",
        ru: "После ремонта — вакуум, заправка R134a или R1234yf и проверка охлаждения.",
        en: "After repair, bleed the system, fill R134a or R1234yf and check cooling.",
        uk: "Після ремонту — вакуумуйте, долийте R134a або R1234yf і перевірте охолодження.",
      },
    },
  ],
  suspension: [
    {
      title: { pl: "Rezerwacja i opis objawów", ru: "Запись и симптомы", en: "Reservation and description of symptoms", uk: "Запис і симптоми" },
      description: {
        pl: "Stuki, luz, ściąganie — opisujesz objawy, rezerwujemy czas na podnośnik.",
        ru: "Стуки, люфт, увод — описываете симптомы, бронируем подъёмник.",
        en: "Taps, play, pulling — you describe the symptoms, we reserve time for a lift.",
        uk: "Стукіт, люфт, канава — опишіть симптоми, забронюйте ліфт.",
      },
    },
    {
      title: { pl: "Kontrola zawieszenia na podnośniku", ru: "Осмотр подвески", en: "Lift Suspension Check", uk: "Перевірка підвіски" },
      description: {
        pl: "Sprawdzamy amortyzatory, wahacze, tuleje, sworznie — mierzymy luz.",
        ru: "Амортизаторы, рычаги, сайлентблоки — замер люфта.",
        en: "We check shock absorbers, rocker arms, bushings, pins — we measure the clearance.",
        uk: "Амортизатори, важелі, сайлентблоки — вимірювання люфту.",
      },
    },
    {
      title: { pl: "Wymiana zużytych elementów", ru: "Замена деталей", en: "- Replacement of worn parts;", uk: "Заміна деталей" },
      description: {
        pl: "Montujemy nowe części, dokręcamy momentem, smarujemy punkty ruchome.",
        ru: "Монтаж, момент затяжки, смазка.",
        en: "We assemble new parts, tighten with torque, lubricate moving points.",
        uk: "Монтаж, момент затягування, змащування.",
      },
    },
    {
      title: { pl: "Jazda testowa i odbiór", ru: "Тест и выдача", en: "Test drive and acceptance", uk: "Тестування та отримання" },
      description: {
        pl: "Sprawdzamy ciszę i prowadzenie — auto nie stuka, nie ściąga.",
        ru: "Без стуков, без увода.",
        en: "We check the silence and driving — the car does not knock, it does not pull.",
        uk: "Без стуку, без видалення.",
      },
    },
  ],
  alignment: [
    {
      title: { pl: "Rezerwacja geometrii", ru: "Запись на развал", en: "Reservation of geometry", uk: "Запис для згортання" },
      description: {
        pl: "Umawiasz się — podaj rozmiar felg i czy auto ściąga.",
        ru: "Запись — размер дисков, увод.",
        en: "You are dating — specify the size of the rims and whether the car is pulling.",
        uk: "Запис — розмір диска, пошук.",
      },
    },
    {
      title: { pl: "Pomiar zbieżności 3D", ru: "Замер 3D", en: "Taper Measurement", uk: "Вимірювання 3D" },
      description: {
        pl: "Mierzymy kąty kół przed korektą — wydruk parametrów.",
        ru: "Замер углов — распечатка.",
        en: "We measure the angles of the wheels before the correction — print the parameters.",
        uk: "Вимірювання кута — роздруківка.",
      },
    },
    {
      title: { pl: "Regulacja zbieżności", ru: "Регулировка", en: "Toe adjustment", uk: "Корекція" },
      description: {
        pl: "Ustawiamy kąty wg danych producenta dla Twojego modelu.",
        ru: "Углы по данным производителя.",
        en: "We set the angles according to the manufacturer's data for your model.",
        uk: "Кути згідно з виробником.",
      },
    },
    {
      title: { pl: "Kontrola i odbiór", ru: "Проверка", en: "Inspection and Acceptance:", uk: "Перевірка" },
      description: {
        pl: "Ponowny pomiar — auto jedzie prosto.",
        ru: "Повторный замер — едет прямо.",
        en: "Re-measurement — the car goes straight.",
        uk: "Повторне вимірювання - йде прямо.",
      },
    },
  ],
  engine: [
    {
      title: { pl: "Rezerwacja i opis problemu", ru: "Запись", en: "Reservation and problem description", uk: "ЗАПИС" },
      description: {
        pl: "Objawy silnika — dźwięki, moc, dym, zużycie oleju.",
        ru: "Симптомы — звуки, мощность, дым.",
        en: "Engine symptoms — sounds, power, smoke, oil consumption.",
        uk: "Симптоми — звуки, сила, дим.",
      },
    },
    {
      title: { pl: "Diagnostyka silnika", ru: "Диагностика", en: "Engine diagnostics", uk: "Діагностика " },
      description: {
        pl: "Komputer, kompresja, wycieki — ustalamy przyczynę.",
        ru: "Сканер, компрессия, утечки.",
        en: "Computer, compression, leaks — we determine the cause.",
        uk: "Сканер, стиснення, протікання.",
      },
    },
    {
      title: { pl: "Akceptacja zakresu i wyceny", ru: "Смета", en: "Acceptance of scope and valuation", uk: "кошторис" },
      description: {
        pl: "Plan naprawy i koszt — po akceptacji zaczynamy.",
        ru: "План и стоимость — после согласования.",
        en: "Repair plan and cost — once accepted, we start.",
        uk: "План та вартість — після затвердження.",
      },
    },
    {
      title: { pl: "Naprawa i test silnika", ru: "Ремонт", en: "Engine repair and test", uk: "Ремонт" },
      description: {
        pl: "Uzgodnione prace, test na postoju i jazda.",
        ru: "Работы и тест.",
        en: "Agreed work, standstill test and driving.",
        uk: "Роботи та випробування.",
      },
    },
  ],
  electric: [
    {
      title: { pl: "Opis usterki elektrycznej", ru: "Описание", en: "Electrical Fault Description", uk: "Опис" },
      description: {
        pl: "Który układ — oświetlenie, rozrusznik, klima, czujniki.",
        ru: "Какая система не работает.",
        en: "Which system — lighting, starter, climate, sensors.",
        uk: "Яка система не працює.",
      },
    },
    {
      title: { pl: "Diagnostyka obwodów", ru: "Диагностика", en: "Circuit Diagnostics", uk: "Діагностика " },
      description: {
        pl: "Napięcia, przerwy, błędy modułów.",
        ru: "Напряжение, обрывы, коды.",
        en: "Voltages, interruptions, module errors.",
        uk: "Напруга, переривання, коди.",
      },
    },
    {
      title: { pl: "Akceptacja zakresu", ru: "Согласование", en: "Scope acceptance", uk: "Узгодження" },
      description: {
        pl: "Wycena przed montażem części.",
        ru: "Смета до монтажа.",
        en: "Pricing before installing the part.",
        uk: "Оцінка перед установкою.",
      },
    },
    {
      title: { pl: "Naprawa i weryfikacja", ru: "Ремонт", en: "Repair and verification", uk: "Ремонт" },
      description: {
        pl: "Montaż i sprawdzenie — błędy zgaszone.",
        ru: "Монтаж и проверка.",
        en: "Installation and checking — extinguished errors.",
        uk: "Монтаж та огляд.",
      },
    },
  ],
  otherReason: [
    {
      title: { pl: "Kontakt i zakres", ru: "Контакт", en: "Contact and scope", uk: "Контакт" },
      description: {
        pl: "Ustalamy, co trzeba zrobić w Twoim aucie.",
        ru: "Согласуем объём работ.",
        en: "We determine what needs to be done in your car.",
        uk: "Узгоджуємо обсяг робіт.",
      },
    },
    {
      title: { pl: "Przegląd stanu auta", ru: "Осмотр", en: "Overview of the condition of the car", uk: "ОГЛЯД" },
      description: {
        pl: "Hamulce, płyny, zawieszenie, światła.",
        ru: "Тормоза, жидкости, подвеска, свет.",
        en: "Brakes, fluids, suspension, lights.",
        uk: "Гальма, рідини, підвіска, легкі.",
      },
    },
    {
      title: { pl: "Wykonanie prac", ru: "Работы", en: "Installation", uk: "Роботи" },
      description: {
        pl: "Wymiany lub przygotowanie do przeglądu technicznego.",
        ru: "Замены или подготовка к техосмотру.",
        en: "Replacement or preparation for technical inspection.",
        uk: "Заміна або підготовка до перевірки.",
      },
    },
    {
      title: { pl: "Raport i odbiór", ru: "Выдача", en: "Report & Receipt", uk: "Выдача" },
      description: {
        pl: "Lista wykonanych punktów — gotowe do jazdy.",
        ru: "Список работ — можно ехать.",
        en: "List of completed points — ready to ride.",
        uk: "Перелік робіт — можна йти.",
      },
    },
  ],
  tires: [
    {
      title: { pl: "Rezerwacja terminu", ru: "Запись на время", en: "Book Appointment", uk: "Запис часу" },
      description: {
        pl: "Wybierasz wymianę, wyważanie lub sezonową zmianę — rezerwujemy slot bez kolejki.",
        ru: "Шиномонтаж, балансировка или сезонная смена — без очереди.",
        en: "You choose exchange, balancing or seasonal change — we reserve the slot without a queue.",
        uk: "Шиномонтаж, балансування або сезонна зміна — без черги.",
      },
    },
    {
      title: { pl: "Demontaż i kontrola felg", ru: "Демонтаж и осмотр дисков", en: "Removing and inspecting rims", uk: "Розбирання та огляд дисків" },
      description: {
        pl: "Zdejmujemy koła, sprawdzamy stan opon i felg, oznaczamy oś.",
        ru: "Снимаем колёса, проверяем шины и диски.",
        en: "We remove the wheels, check the condition of the tires and rims, mark the axle.",
        uk: "Зніміть колеса, перевірте шини та диски.",
      },
    },
    {
      title: { pl: "Montaż i wyważanie", ru: "Монтаж и балансировка", en: "Assembly and balancing", uk: "Монтаж і балансування" },
      description: {
        pl: "Montujemy opony, wyważamy na maszynie, prawidłowy moment dokręcenia.",
        ru: "Монтаж, балансировка, правильный момент затяжки.",
        en: "We install tires, balance on the machine, correct tightening torque.",
        uk: "Встановлення, балансування, правильний момент затягування.",
      },
    },
    {
      title: { pl: "Kontrola ciśnienia i odbiór", ru: "Давление и выдача", en: "Pressure control and acceptance", uk: "Тиск і нагнітання" },
      description: {
        pl: "Ustawiamy ciśnienie wg producenta. Auto gotowe do jazdy.",
        ru: "Давление по норме производителя. Можно ехать.",
        en: "Set the pressure according to the manufacturer. Your car is ready to go.",
        uk: "Тиск відповідно до стандарту виробника. Ви можете йти.",
      },
    },
  ],
};

export const SERVICE_LANDING_EDUCATION: Partial<
  Record<ServiceId, ServiceLandingEducationItem[]>
> = {
  oil: [
    {
      title: { pl: "Kiedy wymieniać olej?", ru: "Когда менять масло?", en: "When to change the oil?", uk: "Коли замінювати масло?" },
      body: {
        pl: "Co 10 000–15 000 km przy oleju syntetycznym lub co rok. W mieście i na krótkich trasach częściej (co 8 000–10 000 km). Objawy: czarny, gęsty olej na bagnetcie, głośniejszy silnik po zimnym starcie, większe spalanie, kontrolka ciśnienia oleju.",
        ru: "Каждые 10–15 тыс. км или раз в год. В городе чаще (8–10 тыс. км). Симптомы: тёмное густое масло, шум при пуске, расход, лампа давления.",
        en: "Every 10,000-15,000 km with synthetic oil or every year. In the city and on short routes more often (every 8,000-10,000 km). Symptoms: black, dense oil on the bayonet, louder engine after a cold start, greater combustion, oil pressure indicator light.",
        uk: "Кожні 10–15 тис. км або раз на рік. У місті частіше (8–10 тис. км). Симптоми: темна густа олива, шум при запуску, швидкість потоку, лампа тиску.",
      },
    },
    {
      title: { pl: "Co wymieniamy", ru: "Что меняем", en: "What we exchange", uk: "Що ми змінюємо" },
      body: {
        pl: "Olej silnikowy, filtr oleju (standard). Na życzenie: filtr powietrza, kabinowy, paliwa — sprawdzamy stan przy wizycie.",
        ru: "Моторное масло и масляный фильтр. По запросу: воздушный, салонный, топливный.",
        en: "Engine oil, oil filter (standard). On request: air filter, cabin filter, fuel filter — we check the condition during the visit.",
        uk: "Моторне масло та масляний фільтр. За запитом: повітря, кабіна, паливо.",
      },
    },
    {
      title: { pl: "Jakie oleje stosujemy", ru: "Какие масла используем", en: "What oils do we use", uk: "Які олії ми використовуємо" },
      body: {
        pl: "Castrol, Mobil, Shell, Motul — specyfikacja pod VIN (np. VW 504.00, BMW LL-04, MB 229.5). Bez oleju uniwersalnego.",
        ru: "Castrol, Mobil, Shell, Motul — спецификация по VIN (VW 504.00, BMW LL-04 и т.д.).",
        en: "Castrol, Mobil, Shell, Motul — Vin specification (e.g. VW 504.00, BMW LL-04, MB 229.5). Without universal oil.",
        uk: "Castrol, Mobil, Shell, Motul — специфікація VIN (VW 504.00, BMW LL-04 тощо).",
      },
    },
    {
      title: { pl: "Co dzieje się na podnośniku", ru: "Что происходит на подъёмнике", en: "What happens on the lift", uk: "Що відбувається в ліфті" },
      body: {
        pl: "Podnosimy auto, spuszczamy olej, wymieniamy filtr, wlewamy nowy olej zgodny z VIN. Kontrola poziomu, szczelności i reset interwału serwisowego jeśli wymagany.",
        ru: "Поднимаем авто, сливаем масло, меняем фильтр, заливаем по VIN. Проверка уровня, герметичности и сброс интервала ТО при необходимости.",
        en: "We pick up the car, drain the oil, replace the filter, pour new oil according to the Vin. Level check, tightness check and service interval reset if required.",
        uk: "Піднімаємо машину, зливаємо масло, міняємо фільтр, заправляємо VIN. Перевірка рівня, герметичності та скидання інтервалу технічного обслуговування, якщо це необхідно.",
      },
    },
  ],
  diagnostic: [
    {
      title: { pl: "Kiedy potrzebna diagnostyka?", ru: "Когда нужна диагностика?", en: "When do you need diagnostics?", uk: "Коли потрібна діагностика?" },
      body: {
        pl: "Kontrolka silnika, nietypowe dźwięki, spadek mocy, problemy ze skrzynią lub elektroniką.",
        ru: "Check engine, странные звуки, потеря мощности, проблемы с КПП или электрикой.",
        en: "Engine indicator light, unusual sounds, power drop, transmission or electronics problems.",
        uk: "Перевірте двигун, дивні звуки, втрату потужності, проблеми з коробкою передач або електрикою.",
      },
    },
    {
      title: { pl: "Czy odczyt OBD jest bezpłatny?", ru: "OBD бесплатно?", en: "Is the OBD reading free?", uk: "Без OBD?" },
      body: {
        pl: "Krótki odczyt kodów przy wizycie — często w ramach konsultacji. Pełna diagnostyka z raportem to osobna usługa.",
        ru: "Краткое считывание при визите часто бесплатно. Полная диагностика с отчётом — отдельная услуга.",
        en: "Short reading of codes during the visit — often as part of consultations. Full diagnostics with a report is a separate service.",
        uk: "Коротке читання під час візиту часто є безкоштовним. Повна діагностика з звітом — окрема послуга.",
      },
    },
    {
      title: { pl: "Sprzęt diagnostyczny", ru: "Диагностическое оборудование", en: "DIAG EQUIPMENT", uk: "Діагностичне обладнання" },
      body: {
        pl: "Profesjonalne skanery OBD, testy podzespołów na żywo, pomiary parametrów silnika i skrzyni. Raport z kodami i rekomendacjami napraw.",
        ru: "Профессиональные OBD-сканеры, тесты узлов, замеры параметров двигателя и КПП. Отчёт с кодами и рекомендациями.",
        en: "Professional OBD scanners, live component testing, engine and case measurements. Report with codes and recommendations for repairs.",
        uk: "Професійні OBD сканери, випробування агрегатів, вимірювання параметрів двигуна та коробки передач. Звіт з кодами та рекомендаціями.",
      },
    },
  ],
  suspension: [
    {
      title: { pl: "Objawy zużytego zawieszenia", ru: "Симптомы износа", en: "Suspension symptoms worn out", uk: "Симптоми носіння" },
      body: {
        pl: "Stuki na nierównościach, luz na kierownicy, nierówne zużycie opon, auto ściąga.",
        ru: "Стуки, люфт руля, неравномерный износ шин, увод.",
        en: "The knocks on the unevenness, the play on the steering wheel, the uneven wear of the tires, the car pulls down.",
        uk: "Стук, люфт керма, нерівномірний знос шин, втягування.",
      },
    },
    {
      title: { pl: "Co wymieniamy", ru: "Что меняем", en: "What we exchange", uk: "Що ми змінюємо" },
      body: {
        pl: "Amortyzatory, tuleje, sworznie, łączniki stabilizatora, wahacze — po diagnostyce.",
        ru: "Амортизаторы, сайлентблоки, шаровые, стойки стабилизатора, рычаги.",
        en: "Shock absorbers, bushings, pins, stabilizer connectors, rocker arms — after diagnostics.",
        uk: "Амортизатори, сайлентблоки, м 'яч, стійки стабілізатора, важелі.",
      },
    },
    {
      title: { pl: "Jazda po naprawie", ru: "После ремонта", en: "Driving after repair", uk: "Після ремонту" },
      body: {
        pl: "Sprawdzamy luz i prowadzenie — bez stuków i ściągania.",
        ru: "Проверяем люфт и увод — без стуков.",
        en: "We check the clearance and handling — without knocking and pulling.",
        uk: "Перевіряємо гру і відступаємо — без стуку.",
      },
    },
  ],
  alignment: [
    {
      title: { pl: "Kiedy robić geometrię?", ru: "Когда делать развал?", en: "When to do geometry?", uk: "Коли робити обвал?" },
      body: {
        pl: "Po wymianie elementów zawieszenia, uderzeniu w dziurę, gdy auto ściąga lub opony zużywają się bokiem.",
        ru: "После ремонта подвески, удара, увода или бокового износа шин.",
        en: "After replacing the suspension components, hitting the hole when the car pulls down or the tires wear sideways.",
        uk: "Після ремонту підвіски, удару, втягування або бічного зносу шин.",
      },
    },
    {
      title: { pl: "Stanowisko 3D", ru: "Стенд 3D", en: "3D Station", uk: "Стенд 3D" },
      body: {
        pl: "Pomiar przed i po regulacji — dostajesz wydruk kątów kół.",
        ru: "Замер до и после — распечатка углов.",
        en: "Measurement before and after adjustment — you get a printout of the wheel angles.",
        uk: "Вимірювання до і після — друк кутів.",
      },
    },
  ],
  tires: [
    {
      title: { pl: "Sezonowa wymiana opon", ru: "Сезонная смена", en: "Seasonal tyre changes", uk: "Сезонна зміна" },
      body: {
        pl: "Montaż, wyważanie, prawidłowe ciśnienie — komplet 4 kół bez kolejki po rezerwacji.",
        ru: "Монтаж, балансировка, давление — 4 колеса без очереди.",
        en: "Assembly, balancing, correct pressure — a set of 4 wheels without a queue after booking.",
        uk: "Встановлення, балансування, тиск — 4 колеса без черги.",
      },
    },
  ],
  engine: [
    {
      title: { pl: "Typowe usterki silnika", ru: "Типичные неисправности", en: "Typical motor faults", uk: "Типові несправності" },
      body: {
        pl: "Wycieki oleju, spadki mocy, dym, Check Engine — zaczynamy od diagnostyki, nie od zgadywania.",
        ru: "Утечки, потеря мощности, дым, Check Engine — с диагностики.",
        en: "Oil leaks, power drops, smoke, Check Engine — we start with diagnostics, not guessing.",
        uk: "Витоки, втрати потужності, дим, перевірка двигуна — з діагностики.",
      },
    },
  ],
  electric: [
    {
      title: { pl: "Co naprawiamy w elektryce?", ru: "Что ремонтируем?", en: "What do we repair in electrics?", uk: "Що ми ремонтуємо?" },
      body: {
        pl: "Oświetlenie, rozrusznik/alternator, wiązki, czujniki, błędy modułów komfortu.",
        ru: "Свет, стартер/генератор, проводка, датчики, блоки комфорта.",
        en: "Lighting, starter/alternator, beams, sensors, comfort module errors.",
        uk: "Світло, стартер/генератор, проводка, датчики, блоки комфорту.",
      },
    },
  ],
  acRefill: [
    {
      title: { pl: "Objawy słabej klimy", ru: "Симптомы слабого кондиционера", en: "Symptoms of a weak climate", uk: "Симптоми слабкого кондиціонера" },
      body: {
        pl: "Słabe chłodzenie, zapach pleśni, szumy sprężarki — często wystarczy serwis i napełnienie czynnikiem.",
        ru: "Слабое охлаждение, запах, шум компрессора.",
        en: "Poor cooling, the smell of mold, the noise of the compressor — service and refrigerant filling are often enough.",
        uk: "Слабке охолодження, запах, шум компресора.",
      },
    },
  ],
  brakePads: [
    {
      title: { pl: "Kiedy wymieniać klocki?", ru: "Когда менять колодки?", en: "When to replace the blocks?", uk: "Коли міняти прокладки?" },
      body: {
        pl: "Pisk, wibracje, wydłużona droga hamowania — nie czekaj do metalu na metalu.",
        ru: "Скрип, вибрация, длинный тормозной путь.",
        en: "Squeak, vibration, extended braking distance — don't wait for metal on metal.",
        uk: "Скрип, вібрація, довгий гальмівний шлях.",
      },
    },
    {
      title: { pl: "Tarcze hamulcowe — kiedy wymiana?", ru: "Когда менять тормозные диски?", en: "Brake discs — when to replace?", uk: "Коли замінювати гальмівні диски?" },
      body: {
        pl: "Tarcze wymieniamy gdy grubość poniżej minimum producenta, są rowki lub krzywizna. Przy wymianie tarcz zawsze nowe klocki — zestaw na jedną oś od 220 zł.",
        ru: "Диски меняем при износе ниже минимума, бороздках или перекосе. С дисками — всегда новые колодки, комплект на ось от 220 zł.",
        en: "Discs are replaced when the thickness is below the manufacturer's minimum, there are grooves or curvature. When replacing discs, always new blocks — a set for one axle from PLN 220.",
        uk: "Диски змінюються, коли знос нижче мінімального, канавки або перекос. З дисками — завжди нові колодки, комплект для осі від 220 злотих.",
      },
    },
    {
      title: { pl: "Co sprawdzamy przy hamulcach", ru: "Что проверяем", en: "What we check for brakes", uk: "Що ми перевіряємо" },
      body: {
        pl: "Klocki, tarcze, zaciski, przewody, płyn hamulcowy i czujniki ABS. Po montażu jazda testowa i raport ze zdjęciami zużytych części.",
        ru: "Колодки, диски, суппорты, шланги, жидкость и датчики ABS. После работ — тест-драйв и фото изношенных деталей.",
        en: "Pads, discs, calipers, hoses, brake fluid and ABS sensors. After assembly, test drive and report with photos of worn parts.",
        uk: "Колодки, диски, штангенциркулі, шланги, датчики рідини та абс. Після роботи — тест-драйв та фото зношених деталей.",
      },
    },
  ],
  chip: [
    {
      title: { pl: "Czy chip tuning jest bezpieczny?", ru: "Чип-тюнинг безопасен?", en: "Is chip tuning safe?", uk: "Чи безпечний чіп-тюнінг?" },
      body: {
        pl: "Tak — po diagnostyce i w granicach tolerancji silnika. Nie tuningujemy aut z poważnymi usterkami.",
        ru: "Да — после диагностики и в пределах допусков. Не тюним авто с серьёзными неисправностями.",
        en: "Yes — after diagnosis and within engine tolerances. We do not tune cars with serious faults.",
        uk: "Так — після постановки діагнозу та в межах допустимих відхилень. Не налаштовуйте автомобілі з серйозними несправностями.",
      },
    },
    {
      title: { pl: "Stage 1 vs Stage 2", ru: "Stage 1 и Stage 2", en: "Stage 1 vs Stage 2", uk: "Етап 1 та Етап 2" },
      body: {
        pl: "Stage 1 — optymalizacja fabrycznej mapy. Stage 2 — często wymaga modyfikacji układu dolotowego/wydechowego.",
        ru: "Stage 1 — оптимизация штатной карты. Stage 2 — часто нужны доработки впуска/выпуска.",
        en: "Stage 1 — optimization of the factory map. Stage 2 — often requires modification of the intake/exhaust system.",
        uk: "Етап 1 — оптимізація карти персоналу. Етап 2 — часто потрібні модифікації входу/виходу.",
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
        pl: "Ile kosztuje wymiana oleju?",
        ru: "Сколько стоит замена масла?",
        en: "How much does the oil change cost?",
        uk: "Скільки коштує заміна масла?",
      },
      a: {
        pl: "Robocizna 80 zł zamiast 150 zł (kod BessMotors). Przy wymianie oleju diagnostyka zawieszenia gratis. Olej i filtr — osobno pod VIN.",
        ru: "Работа 80 zł вместо 150 zł (код BessMotors). При замене масла диагностика подвески бесплатно. Масло и фильтр — отдельно по VIN.",
        en: "Labour PLN 80 instead of PLN 150 (BessMotors code). When changing the oil, the suspension diagnosis is free of charge. Oil and filter — separately under Vin.",
        uk: "Робота 80 злотих замість 150 злотих (код BessMotors). При заміні масла діагностика підвіски проводиться безкоштовно. Масло та фільтр — окремо по VIN.",
      },
    },
    {
      q: {
        pl: "Skąd wiecie, jaki olej pasuje do mojego auta?",
        ru: "Откуда вы знаете, какое масло подходит?",
        en: "How do you know which oil fits my car?",
        uk: "Як дізнатися, яка олія підходить?",
      },
      a: {
        pl: "Dobieramy na podstawie VIN lub dowodu — norma producenta (VW 504.00, BMW LL-04, MB 229.5). Każdy silnik dostaje właściwą specyfikację.",
        ru: "По VIN или СТС — норма производителя. Без «универсального» масла.",
        en: "We select on the basis of Vin or proof — manufacturer's standard (VW 504.00, BMW LL-04, MB 229.5). Each motor gets the right specification.",
        uk: "Відповідно до VIN або STS — стандарту виробника. Без «універсальної» олії.",
      },
    },
    {
      q: {
        pl: "Czy wymieniacie tylko olej, czy też filtry?",
        ru: "Меняете только масло или и фильтры?",
        en: "Are you just changing the oil or the filters?",
        uk: "Ви замінюєте лише масло або фільтри?",
      },
      a: {
        pl: "Standard: olej + filtr oleju. Na życzenie filtry powietrza, kabinowy, paliwa — wycena przy wizycie.",
        ru: "Стандарт: масло + масляный фильтр. По запросу — остальные фильтры.",
        en: "Standard: oil + oil filter. Upon request, air filters, cabin filters, fuel filters — quotation at the visit.",
        uk: "Стандарт: масло + масляний фільтр. За запитом — решта фільтрів.",
      },
    },
    {
      q: {
        pl: "Po ilu km następna wymiana?",
        ru: "Через сколько км следующая замена?",
        en: "After how many km next exchange?",
        uk: "Скільки кілометрів займає наступна заміна?",
      },
      a: {
        pl: "Zwykle 10 000–15 000 km lub co rok. Naklejka na szybie z datą i przebiegiem.",
        ru: "Обычно 10–15 тыс. км или раз в год. Наклейка на стекло.",
        en: "Usually 10,000-15,000 km or every year. Sticker on the glass with date and mileage.",
        uk: "Зазвичай 10–15 тис. км або раз на рік. Наклейка на склі.",
      },
    },
    {
      q: {
        pl: "Skąd wiem, że olej został wymieniony?",
        ru: "Как убедиться, что масло заменили?",
        en: "How do I know if the oil has been changed?",
        uk: "Як переконатися, що масло замінено?",
      },
      a: {
        pl: "Pokazujemy stary filtr i spuszczony olej. Paragon z nazwą oleju i numerem filtra + naklejka serwisowa.",
        ru: "Показываем старый фильтр и слив. Чек и сервисная наклейка.",
        en: "We show the old filter and the drained oil. Receipt with oil name and filter number + service sticker.",
        uk: "Показуємо старий фільтр і злив. Квитанція та сервісна наклейка.",
      },
    },
  ],
  diagnostic: [
    {
      q: {
        pl: "Czy odczyt błędów OBD jest bezpłatny?",
        ru: "Считывание OBD бесплатно?",
        en: "Is the reading of OBD errors free of charge?",
        uk: "Читаєте OBD безкоштовно?",
      },
      a: {
        pl: "Krótki odczyt przy wizycie często bez opłaty. Pełny raport diagnostyczny — według cennika.",
        ru: "Краткое считывание часто бесплатно. Полный отчёт — по прайсу.",
        en: "A short reading at the visit often free of charge. Full diagnostic report — according to the price list.",
        uk: "Короткі читання часто безкоштовні. Повний звіт — згідно прайс-листу.",
      },
    },
    {
      q: {
        pl: "Ile trwa pełna diagnostyka?",
        ru: "Сколько длится полная диагностика?",
        en: "How long does a full diagnosis take?",
        uk: "Скільки часу займає повна діагностика?",
      },
      a: {
        pl: "Zwykle 30–60 minut, zależnie od objawów i liczby układów.",
        ru: "Обычно 30–60 минут в зависимости от симптомов.",
        en: "Usually 30–60 minutes, depending on symptoms and number of circuits.",
        uk: "Зазвичай 30–60 хвилин залежно від симптомів.",
      },
    },
    {
      q: {
        pl: "Czy po diagnostyce muszę od razu naprawiać?",
        ru: "Нужно ли сразу ремонтировать?",
        en: "Do I need to repair immediately after diagnosis?",
        uk: "Чи потрібно його негайно ремонтувати?",
      },
      a: {
        pl: "Nie — dostajesz priorytety: co pilne, co można zaplanować. Ty decydujesz o zakresie.",
        ru: "Нет — приоритеты: что срочно, что отложить. Объём решаете вы.",
        en: "No — you get priorities: what is urgent, what can be planned. You decide the scope.",
        uk: "Ні — пріоритети: що терміново, що відкласти. Ви вирішуєте об 'єм.",
      },
    },
  ],
  chip: [
    {
      q: {
        pl: "Czy chip tuning jest bezpieczny dla silnika?",
        ru: "Чип-тюнинг безопасен для двигателя?",
        en: "Is chip tuning safe for the engine?",
        uk: "Чи безпечний двигун для чип-тюнінгу?",
      },
      a: {
        pl: "Po diagnostyce i w bezpiecznych granicach mapy. Nie zaczynamy przy aktywnych usterkach silnika.",
        ru: "После диагностики и в безопасных пределах. Не начинаем при серьёзных ошибках.",
        en: "After diagnosis and within safe limits of the map. We do not start with active engine faults.",
        uk: "Після діагностики та в безпечних межах. Ми не починаємо з серйозних помилок.",
      },
    },
    {
      q: {
        pl: "Ile trwa chip tuning?",
        ru: "Сколько времени занимает чип-тюнинг?",
        en: "How long does chip tuning take?",
        uk: "Скільки часу займає чип-тюнінг?",
      },
      a: {
        pl: "Stage 1 zwykle 1 dzień — diagnostyka, mapa, jazda testowa.",
        ru: "Stage 1 обычно 1 день — диагностика, карта, тест-драйв.",
        en: "Stage 1 usually 1 day — diagnostics, map, test drive.",
        uk: "1 етап зазвичай 1 день — діагностика, карта, тест-драйв.",
      },
    },
  ],
  brakePads: [
    {
      q: {
        pl: "Skąd wiem, że klocki są zużyte?",
        ru: "Как понять, что колодки изношены?",
        en: "How do I know the pads are worn?",
        uk: "Як дізнатися, чи зношені мої прокладки?",
      },
      a: {
        pl: "Pisk, dłuższa droga hamowania, wibracje kierownicy, kontrolka ABS.",
        ru: "Скрип, удлинённый тормозной путь, вибрация руля.",
        en: "Squeak, longer braking distance, steering wheel vibration, ABS indicator light.",
        uk: "Скрип, розширений гальмівний шлях, вібрація керма.",
      },
    },
    {
      q: {
        pl: "Czy wymieniacie też tarcze?",
        ru: "Меняете и диски?",
        en: "Do you also replace the discs?",
        uk: "Ви також міняєте диски?",
      },
      a: {
        pl: "Tak — oceniamy grubość tarcz. Wymiana tarcz gdy poniżej minimum lub rowki.",
        ru: "Да — оцениваем толщину дисков, меняем при износе.",
        en: "Yes — we assess the thickness of the discs. Replacing discs when below minimum or grooves.",
        uk: "Так — ми оцінюємо товщину дисків, міняємо їх, коли вони зношуються.",
      },
    },
  ],
  acRefill: [
    {
      q: {
        pl: "Jak często serwisować klimatyzację?",
        ru: "Как часто обслуживать кондиционер?",
        en: "How often should I service my air conditioner?",
        uk: "Як часто потрібно обслуговувати кондиціонер?",
      },
      a: {
        pl: "Co 1–2 lata lub gdy słaba chłodziwość / nieprzyjemny zapach.",
        ru: "Раз в 1–2 года или при слабом охлаждении / запахе.",
        en: "Every 1–2 years or when there is a faint coolness/ unpleasant odor.",
        uk: "Раз на 1–2 роки або зі слабким охолодженням / запахом.",
      },
    },
    {
      q: {
        pl: "Czy robicie odgrzybianie?",
        ru: "Делаете антибактериальную обработку?",
        en: "Do you do fungicide removal?",
        uk: "Ви проводите антибактеріальне лікування?",
      },
      a: {
        pl: "Tak — ozonowanie i czyszczenie parownika na życzenie.",
        ru: "Да — озонирование и очистка испарителя.",
        en: "Yes — ozonation and evaporator cleaning on request.",
        uk: "Так — озонування та очищення випарника.",
      },
    },
  ],
  acRepair: [
    {
      q: {
        pl: "Jak rozpoznać awarię klimatyzacji?",
        ru: "Как понять, что кондиционер неисправен?",
        en: "How to recognize an air conditioning malfunction?",
        uk: "Як дізнатися, що кондиціонер несправний?",
      },
      a: {
        pl: "Słabe lub brak chłodzenia, syczenie pod maską, zapach pleśni, wyciek pod autem, kontrolka klimatyzacji — warto zrobić diagnostykę i test szczelności.",
        ru: "Слабое охлаждение, шипение, запах плесени, подтек под машиной — нужна диагностика и проверка герметичности.",
        en: "Poor or lack of cooling, hissing under the hood, smell of mold, leakage under the car, air conditioning indicator light — it is worth doing diagnostics and a leak test.",
        uk: "Слабке охолодження, шипіння, запах цвілі, протікання під машиною — потрібна діагностика та перевірка герметичності.",
      },
    },
    {
      q: {
        pl: "Ile kosztuje naprawa nieszczelności klimatyzacji?",
        ru: "Сколько стоит устранение утечки?",
        en: "How much does it cost to repair an air conditioning leak?",
        uk: "Скільки коштує усунення витоку?",
      },
      a: {
        pl: "Test szczelności od 150 zł. Koszt naprawy zależy od miejsca wycieku — uszczelka, przewód (spawanie od ok. 250 zł) lub wymiana chłodnicy/osuszacza. Wycena po diagnostyce.",
        ru: "Проверка герметичности от 150 zł. Стоимость зависит от места утечки — смета после диагностики.",
        en: "Leak test from PLN 150. The cost of repair depends on the place of leakage — gasket, hose (welding from approx. PLN 250) or replacement of the cooler/dryer. Pricing after diagnosis.",
        uk: "Перевірка герметичності від 150 злотих. Вартість залежить від місця витоку — кошторис після діагностики.",
      },
    },
    {
      q: {
        pl: "Czy wymieniacie sprężarkę i chłodnicę klimatyzacji?",
        ru: "Меняете компрессор и радиатор кондиционера?",
        en: "Do you replace the compressor and air conditioning cooler?",
        uk: "Чи змінюєте ви компресор і радіатор кондиціонера?",
      },
      a: {
        pl: "Tak — wymiana sprężarki od ok. 400 zł robocizny, chłodnicy od ok. 350 zł plus części. Po wymianie — próżnia i nabijanie R134a lub R1234yf.",
        ru: "Да — замена компрессора от ~400 zł, радиатора от ~350 zł плюс запчасти. После — вакуум и заправка.",
        en: "Yes — compressor replacement from approx. PLN 400 of labor, cooler from approx. PLN 350 plus parts. After replacement — vacuum and charging R134a or R1234yf.",
        uk: "Так — заміна компресора від ~400 злотих, заміна радіатора від ~350 злотих плюс запасні частини. Після — вакуум і заправка.",
      },
    },
    {
      q: {
        pl: "Czy po naprawie robicie nabijanie klimatyzacji?",
        ru: "Делаете заправку после ремонта?",
        en: "Do you do air conditioning charging after repair?",
        uk: "Ви робите заправку після ремонту?",
      },
      a: {
        pl: "Tak — po każdej naprawie obiegu odpowietrzamy układ, robimy próżnię i uzupełniamy czynnik według cennika.",
        ru: "Да — после ремонта вакуум и заправка по прайсу.",
        en: "Yes — after each repair of the circuit, we bleed the system, make a vacuum and replenish the factor according to the price list.",
        uk: "Так — після ремонту вакуум та заправка по прайсу.",
      },
    },
  ],
  suspension: [
    {
      q: { pl: "Skąd stuki w zawieszeniu?", ru: "Откуда стуки?", en: "Where did the knocks in the suspension come from?", uk: "Звідки прийшли стуки?" },
      a: {
        pl: "Często tuleje, stabilizatory lub łączniki — diagnozujemy na podnośniku.",
        ru: "Часто сайлентблоки или стойки стабилизатора.",
        en: "Often, bushings, stabilizers or fasteners — are diagnosed on a lift.",
        uk: "Часто безшумні блоки або стійки стабілізатора.",
      },
    },
  ],
  alignment: [
    {
      q: { pl: "Czy geometria jest potrzebna co roku?", ru: "Развал каждый год?", en: "Do you need geometry every year?", uk: "Згортати щороку?" },
      a: {
        pl: "Przy wymianie opon lub po uderzeniu w krawężnik — warto sprawdzić.",
        ru: "После удара о бордюр или смены шин — стоит проверить.",
        en: "When replacing tires or after hitting the curb — it is worth checking.",
        uk: "Після наїзду на бордюр або заміни шин варто перевірити.",
      },
    },
  ],
  engine: [
    {
      q: { pl: "Czy naprawiacie silniki diesel?", ru: "Ремонт дизелей?", en: "Do you repair diesel engines?", uk: "Ремонт дизельного палива?" },
      a: { pl: "Tak — benzyna i diesel.", ru: "Да — бензин и дизель.", en: "Yes — petrol and diesel.", uk: "Так — бензин і дизельне паливо." },
    },
  ],
  electric: [
    {
      q: { pl: "Czy naprawiacie instalacje dodatkowe?", ru: "Доп. оборудование?", en: "Do you repair additional installations?", uk: "Дод. обладнання" },
      a: {
        pl: "Tak — kamery, audio, Webasto po wycenie.",
        ru: "Да — камеры, аудио, Webasto по смете.",
        en: "Yes — cameras, audio, Webasto after pricing.",
        uk: "Так — камери, аудіо, Webasto за кошторисом.",
      },
    },
  ],
  otherReason: [
    {
      q: { pl: "Czy przygotowujecie do przeglądu?", ru: "Подготовка к техосмотру?", en: "Are you preparing for the review?", uk: "Підготовка до перевірки?" },
      a: {
        pl: "Tak — checklist świateł, hamulców, emisji i płynów.",
        ru: "Да — чек-лист света, тормозов, выхлопа.",
        en: "Yes — checklist of lights, brakes, emissions and fluids.",
        uk: "Так — чек-лист світла, гальм, вихлопних газів.",
      },
    },
  ],
  tires: [
    {
      q: { pl: "Czy przechowujecie opony?", ru: "Хранение шин?", en: "Do you store tires?", uk: "Зберігання шин?" },
      a: {
        pl: "Tak — sezonowe przechowanie opon, zapytaj przy rezerwacji.",
        ru: "Да — сезонное хранение, уточните при записи.",
        en: "Yes — seasonal tyre storage, please ask when booking.",
        uk: "Так — сезонне зберігання, вказуйте при записі.",
      },
    },
  ],
};

const DEFAULT_STEPS: ServiceLandingStep[] = [
  {
    title: { pl: "Rezerwacja online lub telefon", ru: "Запись онлайн или по телефону", en: "Booking online or by phone", uk: "Запис онлайн або по телефону" },
    description: {
      pl: "Podajesz markę, model i zakres prac — rezerwujemy termin.",
      ru: "Указываете марку, модель и работы — бронируем время.",
      en: "You specify the brand, model and scope of work — we reserve the date.",
      uk: "Вкажіть бренд, модель та роботу — бронюємо час.",
    },
  },
  {
    title: { pl: "Przyjęcie auta na warsztat", ru: "Приём авто в сервис", en: "Acceptance of the car to the workshop", uk: "Прийом автомобіля на сервіс" },
    description: {
      pl: "Sprawdzamy stan auta i potwierdzamy zakres usługi na Twoim pojeździe.",
      ru: "Проверяем состояние и подтверждаем объём работ.",
      en: "We check the condition of the car and confirm the scope of service on your vehicle.",
      uk: "Перевіряємо стан та підтверджуємо обсяг робіт.",
    },
  },
  {
    title: { pl: "Wykonanie usługi", ru: "Выполнение работ", en: "Performance of the service", uk: "Виконання робіт" },
    description: {
      pl: "Mechanicy pracują na Twoim aucie według uzgodnionego zakresu.",
      ru: "Механики выполняют работы на вашем авто.",
      en: "The mechanics work on your car according to the agreed range.",
      uk: "Механіки виконують роботу на вашому автомобілі.",
    },
  },
  {
    title: { pl: "Kontrola jakości i odbiór", ru: "Контроль и выдача", en: "Quality control and acceptance", uk: "Контроль та видача" },
    description: {
      pl: "Sprawdzamy efekt, przekazujemy raport i fakturę — auto gotowe.",
      ru: "Проверяем результат, отчёт и документы — авто готово.",
      en: "We check the effect, provide a report and an invoice — the car is ready.",
      uk: "Перевіряємо результат, звіт і документи — машина готова.",
    },
  },
];

const ESTIMATE_STEP: ServiceLandingStep = {
  title: { pl: "Akceptacja zakresu i wyceny", ru: "Согласование объёма и сметы", en: "Acceptance of scope and valuation", uk: "Затвердження обсягу та кошторису" },
  description: {
    pl: "Przedstawiamy wycenę i zakres. Po akceptacji (podpis) przystępujemy do naprawy.",
    ru: "Показываем смету и объём. После согласования (подпись) начинаем работы.",
    en: "We present the valuation and scope. After approval (signature), we proceed with the repair.",
    uk: "Показуємо кошторис та обсяг. Після затвердження (підпису) приступаємо до роботи.",
  },
};

export function getServiceLandingSteps(
  serviceId: ServiceId,
  slug?: string
): ServiceLandingStep[] {
  const slugProfile = slug ? getSlugLandingProfile(slug) : undefined;
  if (slugProfile?.steps?.length) return slugProfile.steps;

  const custom = SERVICE_LANDING_STEPS[serviceId];
  if (custom) return custom;

  if (SERVICES_WITH_ESTIMATE_STEP.has(serviceId)) {
    return [DEFAULT_STEPS[0]!, DEFAULT_STEPS[1]!, ESTIMATE_STEP, DEFAULT_STEPS[3]!];
  }
  return DEFAULT_STEPS;
}

export function getServiceLandingPrice(
  serviceId: ServiceId,
  slug?: string
): ServiceLandingPrice | null {
  const slugProfile = slug ? getSlugLandingProfile(slug) : undefined;
  if (slugProfile && "price" in slugProfile) {
    return slugProfile.price ?? null;
  }

  if (serviceId === "chip") {
    const stage1 = getPriceItem("stage1");
    const stage2 = getPriceItem("stage2");
    return {
      fromZl: stage1?.basePrice ?? 1020,
      compareAtZl: stage1?.listPrice,
      priceFrom: true,
      materialsExtra: false,
      includes: getDefaultIncludes("chip"),
      priceTable: [
        {
          label: { pl: "Stage 1", ru: "Stage 1", en: "Stage 1", uk: "Stage 1" },
          priceZl: stage1?.basePrice ?? 1020,
          compareAtZl: stage1?.listPrice,
          priceFrom: true,
        },
        {
          label: { pl: "Stage 2", ru: "Stage 2", en: "Stage 2", uk: "Stage 2" },
          priceZl: stage2?.basePrice ?? 2125,
          compareAtZl: stage2?.listPrice,
          priceFrom: true,
        },
      ],
    };
  }

  const priceId = serviceBasePriceId[serviceId];
  if (!priceId) {
    if (serviceId === "brakePads") {
      const pads = getPriceItem("brake_pads_front");
      const discs = getPriceItem("brake_disc_front");
      return {
        fromZl: pads?.basePrice ?? 102,
        compareAtZl: pads?.listPrice,
        priceFrom: false,
        materialsExtra: true,
        includes: [
          {
            pl: "Demontaż kół i kontrola układu hamulcowego",
            ru: "Снятие колёс и осмотр тормозов",
            en: "Removing the wheels and checking the brake system",
            uk: "Зняття коліс та перевірка гальм",
          },
          { pl: "Wymiana klocków i tarcz hamulcowych", ru: "Замена колодок и дисков", en: "Replacing brake pads and discs", uk: "Заміна колодок і дисків" },
          { pl: "Kontrola zacisków, przewodów i płynu hamulcowego", ru: "Проверка суппортов и шлангов", en: "Inspection of calipers, hoses and brake fluid", uk: "Перевірка штангенциркулів та шлангів" },
          { pl: "Jazda testowa po naprawie", ru: "Тест-драйв после ремонта", en: "Test drive after repair", uk: "Тест-драйв після ремонту" },
        ],
        priceTable: [
          {
            label: { pl: "Wymiana klocków (jedna oś)", ru: "Замена колодок (одна ось)", en: "Replacing pads (one axle)", uk: "Заміна колодок (одна вісь)" },
            priceZl: pads?.basePrice ?? 102,
            compareAtZl: pads?.listPrice,
          },
          {
            label: { pl: "Tarcze + klocki (jedna oś)", ru: "Диски + колодки (одна ось)", en: "Discs + pads (one axle)", uk: "Диски + колодки (одновісні)" },
            priceZl: discs?.basePrice ?? 187,
            compareAtZl: discs?.listPrice,
          },
        ],
        note: {
          pl: "Materiały (klocki, tarcze) według wyboru — wycena przed montażem.",
          ru: "Материалы (колодки, диски) по выбору — смета до монтажа.",
          en: "Materials (blocks, discs) of your choice — pricing before assembly.",
          uk: "Матеріали (колодки, диски) на вибір — оцінка перед установкою.",
        },
      };
    }
    if (serviceId === "tires") {
      const sizes = [
        "r13",
        "r14",
        "r15",
        "r16",
        "r17",
        "r18",
        "r19",
        "r20",
        "r21",
        "r22",
        "r23",
        "r24",
      ] as const;
      const rows = sizes.map((size) => {
        const item = getPriceItem(`tire_change_${size}`);
        const label = size.toUpperCase();
        return {
          label: {
            pl: `Wymiana opon komplet — ${label}`,
            ru: `Замена шин комплект — ${label}`,
            en: `Tyre change set — ${label}`,
            uk: `Заміна шин комплект — ${label}`,
          },
          priceZl: item?.basePrice ?? 150,
          priceFrom: false,
        };
      });
      const fromItem = getPriceItem("tire_change_r13");
      return {
        fromZl: fromItem?.basePrice ?? 150,
        priceFrom: true,
        materialsExtra: false,
        includes: [
          {
            pl: "Demontaż i montaż opon + wyważanie",
            ru: "Демонтаж и монтаж шин + балансировка",
            en: "Tyre demount/mount + balancing",
            uk: "Демонтаж і монтаж шин + балансування",
          },
          {
            pl: "Czyszczenie piast, ciśnienie, klucz dynamometryczny",
            ru: "Очистка ступиц, давление, динамометрический ключ",
            en: "Hub cleaning, pressure, torque wrench",
            uk: "Очищення маточин, тиск, динамометричний ключ",
          },
          {
            pl: "Dopłata RunFlat / niski profil: +20 zł / koło",
            ru: "Доплата RunFlat / низкий профиль: +20 zł / колесо",
            en: "RunFlat / low-profile surcharge: +20 zł / wheel",
            uk: "Доплата RunFlat / низький профіль: +20 zł / колесо",
          },
        ],
        priceTable: rows,
        note: {
          pl: "Cena za komplet 4 kół. Przestawienie w komplecie, wyważanie bez wymiany i naprawa przebicia — w cenniku.",
          ru: "Цена за комплект 4 колёс. Перестановка в сборе, балансировка без замены и ремонт прокола — в прайсе.",
          en: "Price for a set of 4. Wheel rotation, balance-only and puncture repair — see the price list.",
          uk: "Ціна за комплект 4 коліс. Перестановка у зборі, балансування без заміни та ремонт проколу — у прайсі.",
        },
      };
    }
    return null;
  }

  const item = getPriceItem(priceId);
  if (!item) return null;

  return {
    fromZl: item.basePrice,
    compareAtZl: item.listPrice,
    priceFrom: item.priceFrom ?? true,
    materialsExtra: serviceId === "oil" || serviceId === "acRefill",
    includes: getDefaultIncludes(serviceId),
    priceTable:
      serviceId === "oil"
        ? [
            {
              label: { pl: "Wymiana oleju + filtr oleju", ru: "Масло + масляный фильтр", en: "Oil change + oil filter", uk: "Мастило + масляний фільтр" },
              priceZl: getPriceItem("oil_filter")?.basePrice ?? 128,
              compareAtZl: getPriceItem("oil_filter")?.listPrice,
              priceFrom: true,
            },
            {
              label: { pl: "Filtr powietrza", ru: "Воздушный фильтр", en: "Air cleaner", uk: "Повітряний фільтр" },
              priceZl: getPriceItem("air_filter")?.basePrice ?? 26,
              compareAtZl: getPriceItem("air_filter")?.listPrice,
              priceFrom: true,
            },
            {
              label: { pl: "Filtr kabinowy", ru: "Салонный фильтр", en: "Cabin filter", uk: "Фільтр салону" },
              priceZl: getPriceItem("cabin_filter")?.basePrice ?? 43,
              compareAtZl: getPriceItem("cabin_filter")?.listPrice,
              priceFrom: true,
            },
          ]
        : serviceId === "diagnostic"
          ? [
              {
                label: { pl: "Diagnostyka komputerowa", ru: "Компьютерная диагностика", en: "CAD", uk: "Комп 'ютерна діагностика" },
                priceZl: getPriceItem("computer_diag")?.basePrice ?? 128,
                compareAtZl: getPriceItem("computer_diag")?.listPrice,
                priceFrom: true,
              },
              {
                label: { pl: "Diagnostyka premium", ru: "Премиум диагностика", en: "Premium diagnostics", uk: "Преміум-діагностика" },
                priceZl: getPriceItem("premium_diag")?.basePrice ?? 213,
                compareAtZl: getPriceItem("premium_diag")?.listPrice,
                priceFrom: true,
              },
              {
                label: { pl: "Odczyt błędów OBD", ru: "Считывание OBD", en: "OBD error reading", uk: "Зчитування OBD" },
                priceZl: 0,
              },
            ]
          : undefined,
      note:
      serviceId === "oil"
        ? {
            pl: "Promocja kod BessMotors: 80 zł zamiast 150 zł (robocizna) + diagnostyka zawieszenia gratis przy wymianie oleju. Olej i filtr pod VIN.",
            ru: "Акция код BessMotors: 80 zł вместо 150 zł (работа) + диагностика подвески бесплатно при замене масла. Масло и фильтр по VIN.",
            en: "Promotion code BessMotors: PLN 80 instead of PLN 150 (labor) + free suspension diagnostics when changing oil. Oil and Vin filter.",
            uk: "Промокод BessMotors: 80 злотих замість 150 злотих (робота) + безкоштовна діагностика підвіски при заміні масла. Масло та фільтр за VIN.",
          }
        : undefined,
  };
}

function getDefaultIncludes(serviceId: ServiceId): LocalizedText[] {
  const map: Partial<Record<ServiceId, LocalizedText[]>> = {
    oil: [
      { pl: "Wymiana oleju silnikowego", ru: "Замена моторного масла", en: "Replacement of engine oil", uk: "Заміна моторного мастила" },
      { pl: "Wymiana filtra oleju", ru: "Замена масляного фильтра", en: "Oil filter replacement", uk: "Заміна масляного фільтра" },
      { pl: "Kontrola poziomu i szczelności", ru: "Проверка уровня и утечек", en: "Level and leakage check", uk: "Перевірте рівень та витоки" },
      { pl: "Naklejka serwisowa z terminem", ru: "Сервисная наклейка", en: "Service Sticker Due Date", uk: "Сервісна наклейка" },
    ],
    diagnostic: [
      { pl: "Podłączenie skanera OBD", ru: "Подключение OBD", en: "Connecting the OBD scanner", uk: "Підключення OBD" },
      { pl: "Odczyt kodów błędów", ru: "Считывание кодов", en: "Reading error codes", uk: "Зчитування кодів" },
      { pl: "Omówienie wyników z mechanikiem", ru: "Разбор с механиком", en: "Discussion of results with mechanic", uk: "Обговорення з механіком" },
    ],
    chip: [
      { pl: "Diagnostyka ECU przed tuningiem", ru: "Диагностика ECU", en: "ECU diagnostics before tuning", uk: "Діагностика ECU" },
      { pl: "Dobór i zapis mapy", ru: "Подбор и запись карты", en: "Selection and saving of the map", uk: "Вибір та запис картки" },
      { pl: "Jazda testowa", ru: "Тест-драйв", en: "Test Drive ", uk: "Тест-драйв" },
    ],
  };
  return (
    map[serviceId] ?? [
      { pl: "Profesjonalna obsługa w warsztacie", ru: "Профессиональное обслуживание", en: "Professional service in the workshop", uk: "Професійне обслуговування" },
      { pl: "Raport z wykonanych prac", ru: "Отчёт о выполненных работах", en: "Report on the work performed", uk: "Звіт про виконані роботи" },
    ]
  );
}

const GENERIC_EDUCATION: ServiceLandingEducationItem[] = [
  {
    title: { pl: "Dlaczego BESS MOTORS?", ru: "Почему BESS MOTORS?", en: "Why BESS MOTORS?", uk: "Чому BESS MOTORS?" },
    body: {
      pl: "Aleja Krakowska 48/52 — dogodny dojazd S2 i lotniska. Strefa oczekiwania z kawą i Wi-Fi.",
      ru: "Aleja Krakowska 48/52 — удобно с S2 и аэропорта. Зона ожидания с кофе и Wi-Fi.",
      en: "Aleja Krakowska 48/52 — convenient access to S2 and the airport. Waiting area with coffee and Wi-Fi.",
      uk: "Aleja Krakowska 48/52 — зручно від S2 та аеропорту. Зона очікування з кавою та Wi-Fi.",
    },
  },
  {
    title: { pl: "Przejrzysta wycena", ru: "Прозрачная смета", en: "Transparent pricing", uk: "Прозорий кошторис" },
    body: {
      pl: "Przed naprawą omawiamy zakres i koszt. Materiały i robocizna na fakturze — bez niespodzianek.",
      ru: "Перед ремонтом согласуем объём и цену. Всё в чеке — без сюрпризов.",
      en: "Before repairing, we discuss the scope and cost. Materials and labor on the invoice — no surprises.",
      uk: "Перед ремонтом ми узгодимо обсяг та ціну. Все в чекі — ніяких сюрпризів.",
    },
  },
  {
    title: { pl: "Rezerwacja online 24/7", ru: "Онлайн-запись 24/7", en: "Online booking 24/7", uk: "Онлайн-запис 24/7" },
    body: {
      pl: "Wybierz usługę i termin w kalendarzu — potwierdzenie SMS lub Telegram.",
      ru: "Услуга и время в календаре — подтверждение SMS или Telegram.",
      en: "Select the service and date in the calendar — SMS or Telegram confirmation.",
      uk: "Сервіс і час в календарі — підтвердження SMS або Telegram.",
    },
  },
];

const FAQ_PAD: Partial<Record<ServiceId, { q: LocalizedText; a: LocalizedText }>> = {
  diagnostic: {
    q: { pl: "Czy muszę umawiać się wcześniej?", ru: "Нужна ли запись?", en: "Do I need to make an appointment in advance?", uk: "Чи потрібно записувати?" },
    a: {
      pl: "Tak — rezerwacja skraca czas oczekiwania. W nagłych przypadkach zadzwoń.",
      ru: "Да — запись сокращает ожидание. Срочно — звоните.",
      en: "Yes — booking shortens the wait time. In case of emergency, call.",
      uk: "Так — запис зменшує час очікування. Терміново — дзвоніть.",
    },
  },
  suspension: {
    q: { pl: "Czy wymieniacie amortyzatory?", ru: "Меняете амортизаторы?", en: "Do you replace the shock absorbers?", uk: "Заміна амортизаторів?" },
    a: { pl: "Tak — po diagnostyce i wycenie.", ru: "Да — после диагностики и сметы.", en: "Yes — after diagnosis and valuation.", uk: "Так — після діагностики та оцінки." },
  },
  alignment: {
    q: { pl: "Czy geometria jest na stanowisku 3D?", ru: "Развал на 3D?", en: "Is the geometry on a 3D workstation?", uk: "Згорнути в 3D?" },
    a: { pl: "Tak — pomiar i regulacja z wydrukiem parametrów.", ru: "Да — замер и регулировка с распечаткой.", en: "Yes — measurement and adjustment with printout of parameters.", uk: "Так — вимірювання та налаштування з роздруківкою." },
  },
  otherReason: {
    q: { pl: "Jak umówić wizytę?", ru: "Как записаться?", en: "How to make an appointment?", uk: "Як зареєструватися?" },
    a: {
      pl: "Online na stronie, telefon +48 791 257 229 lub Telegram.",
      ru: "Онлайн, телефон или Telegram.",
      en: "Online on the website, phone +48 791 257 229 or Telegram.",
      uk: "Онлайн, телефон або телеграм.",
    },
  },
};

export function getServiceLandingEducation(
  serviceId: ServiceId,
  slug?: string
): ServiceLandingEducationItem[] {
  const slugProfile = slug ? getSlugLandingProfile(slug) : undefined;
  const slugEdu = slugProfile?.education ?? [];
  const serviceEdu = SERVICE_LANDING_EDUCATION[serviceId] ?? [];
  const merged = [...slugEdu, ...serviceEdu, ...GENERIC_EDUCATION];
  const unique = merged.filter(
    (item, i, arr) => arr.findIndex((x) => x.title.pl === item.title.pl) === i
  );
  return unique.slice(0, 6);
}

export function getServiceLandingFaq(
  serviceId: ServiceId,
  slug?: string
): { q: LocalizedText; a: LocalizedText }[] {
  const slugProfile = slug ? getSlugLandingProfile(slug) : undefined;
  const general = [...GENERAL_FAQ];
  if (slugProfile?.faqDuration) {
    general[1] = { q: general[1]!.q, a: slugProfile.faqDuration };
  }
  const extra = [
    ...(SERVICE_LANDING_FAQ_EXTRA[serviceId] ?? []),
    ...(slugProfile?.faqExtra ?? []),
  ];
  const pad = FAQ_PAD[serviceId];
  const items = [...general, ...extra];
  if (pad && !items.some((i) => i.q.pl === pad.q.pl)) {
    items.push(pad);
  }
  while (items.length < 4) {
    items.push({
      q: {
        pl: "Jak umówić wizytę w BESS MOTORS?",
        ru: "Как записаться в BESS MOTORS?",
        en: "How to make an appointment at BESS MOTORS?",
        uk: "Як зареєструватися в BESS MOTORS?",
      },
      a: {
        pl: "Rezerwacja online, telefon lub WhatsApp — Aleja Krakowska 48/52, Warszawa.",
        ru: "Онлайн, телефон или WhatsApp — Warszawa.",
        en: "Online booking, phone or WhatsApp — Aleja Krakowska 48/52, Warsaw.",
        uk: "Онлайн, телефон або WhatsApp — Варшава.",
      },
    });
  }
  return items.slice(0, slug === "klimatyzacja" || slug === "naprawa-klimatyzacji" ? 8 : 5);
}

/** Gallery filter hints for landing photo strip */
export const SERVICE_LANDING_GALLERY_TAGS: Partial<Record<ServiceId, string[]>> = {
  oil: ["olej", "oil", "serwis"],
  diagnostic: ["diagnost", "scan"],
  brakePads: ["hamulc", "brake"],
  chip: ["tuning", "chip"],
  tires: ["opon", "tire"],
  suspension: ["zawies", "susp"],
  alignment: ["geomet", "zbież"],
  engine: ["silnik", "engine"],
  acRefill: ["klim", "ac", "chłodnic", "radiator", "радиатор"],
  acRepair: ["klim", "ac", "chłodnic", "radiator", "радиатор"],
  radiators: ["chłodnic", "radiator", "klim", "радиатор"],
  starterGen: ["alternator", "rozrusznik", "generat", "генератор"],
  electric: ["elektr", "alternator", "rozrusznik", "генератор"],
};

export function getServiceLandingGalleryTags(
  serviceId: ServiceId,
  slug?: string
): string[] | undefined {
  const slugTags = slug ? getSlugLandingProfile(slug)?.galleryTags : undefined;
  if (slugTags?.length) return slugTags;
  return SERVICE_LANDING_GALLERY_TAGS[serviceId];
}
