import type { ServiceId } from "@/lib/services-catalog";
import { getPriceItem } from "@/lib/price-list";
import { serviceBasePriceId } from "@/lib/service-price-map";
import { getSlugLandingProfile } from "@/lib/seo-landing-slug-profiles";

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
  suspension: [
    {
      title: { pl: "Rezerwacja i opis objawów", ru: "Запись и симптомы" },
      description: {
        pl: "Stuki, luz, ściąganie — opisujesz objawy, rezerwujemy czas na podnośnik.",
        ru: "Стуки, люфт, увод — описываете симптомы, бронируем подъёмник.",
      },
    },
    {
      title: { pl: "Kontrola zawieszenia na podnośniku", ru: "Осмотр подвески" },
      description: {
        pl: "Sprawdzamy amortyzatory, wahacze, tuleje, sworznie — mierzymy luz.",
        ru: "Амортизаторы, рычаги, сайлентблоки — замер люфта.",
      },
    },
    {
      title: { pl: "Wymiana zużytych elementów", ru: "Замена деталей" },
      description: {
        pl: "Montujemy nowe części, dokręcamy momentem, smarujemy punkty ruchome.",
        ru: "Монтаж, момент затяжки, смазка.",
      },
    },
    {
      title: { pl: "Jazda testowa i odbiór", ru: "Тест и выдача" },
      description: {
        pl: "Sprawdzamy ciszę i prowadzenie — auto nie stuka, nie ściąga.",
        ru: "Без стуков, без увода.",
      },
    },
  ],
  alignment: [
    {
      title: { pl: "Rezerwacja geometrii", ru: "Запись на развал" },
      description: {
        pl: "Umawiasz się — podaj rozmiar felg i czy auto ściąga.",
        ru: "Запись — размер дисков, увод.",
      },
    },
    {
      title: { pl: "Pomiar zbieżności 3D", ru: "Замер 3D" },
      description: {
        pl: "Mierzymy kąty kół przed korektą — wydruk parametrów.",
        ru: "Замер углов — распечатка.",
      },
    },
    {
      title: { pl: "Regulacja zbieżności", ru: "Регулировка" },
      description: {
        pl: "Ustawiamy kąty wg danych producenta dla Twojego modelu.",
        ru: "Углы по данным производителя.",
      },
    },
    {
      title: { pl: "Kontrola i odbiór", ru: "Проверка" },
      description: {
        pl: "Ponowny pomiar — auto jedzie prosto.",
        ru: "Повторный замер — едет прямо.",
      },
    },
  ],
  engine: [
    {
      title: { pl: "Rezerwacja i opis problemu", ru: "Запись" },
      description: {
        pl: "Objawy silnika — dźwięki, moc, dym, zużycie oleju.",
        ru: "Симптомы — звуки, мощность, дым.",
      },
    },
    {
      title: { pl: "Diagnostyka silnika", ru: "Диагностика" },
      description: {
        pl: "Komputer, kompresja, wycieki — ustalamy przyczynę.",
        ru: "Сканер, компрессия, утечки.",
      },
    },
    {
      title: { pl: "Akceptacja zakresu i wyceny", ru: "Смета" },
      description: {
        pl: "Plan naprawy i koszt — po akceptacji zaczynamy.",
        ru: "План и стоимость — после согласования.",
      },
    },
    {
      title: { pl: "Naprawa i test silnika", ru: "Ремонт" },
      description: {
        pl: "Uzgodnione prace, test na postoju i jazda.",
        ru: "Работы и тест.",
      },
    },
  ],
  electric: [
    {
      title: { pl: "Opis usterki elektrycznej", ru: "Описание" },
      description: {
        pl: "Który układ — oświetlenie, rozrusznik, klima, czujniki.",
        ru: "Какая система не работает.",
      },
    },
    {
      title: { pl: "Diagnostyka obwodów", ru: "Диагностика" },
      description: {
        pl: "Napięcia, przerwy, błędy modułów.",
        ru: "Напряжение, обрывы, коды.",
      },
    },
    {
      title: { pl: "Akceptacja zakresu", ru: "Согласование" },
      description: {
        pl: "Wycena przed montażem części.",
        ru: "Смета до монтажа.",
      },
    },
    {
      title: { pl: "Naprawa i weryfikacja", ru: "Ремонт" },
      description: {
        pl: "Montaż i sprawdzenie — błędy zgaszone.",
        ru: "Монтаж и проверка.",
      },
    },
  ],
  otherReason: [
    {
      title: { pl: "Kontakt i zakres", ru: "Контакт" },
      description: {
        pl: "Ustalamy, co trzeba zrobić w Twoim aucie.",
        ru: "Согласуем объём работ.",
      },
    },
    {
      title: { pl: "Przegląd stanu auta", ru: "Осмотр" },
      description: {
        pl: "Hamulce, płyny, zawieszenie, światła.",
        ru: "Тормоза, жидкости, подвеска, свет.",
      },
    },
    {
      title: { pl: "Wykonanie prac", ru: "Работы" },
      description: {
        pl: "Wymiany lub przygotowanie do przeglądu technicznego.",
        ru: "Замены или подготовка к техосмотру.",
      },
    },
    {
      title: { pl: "Raport i odbiór", ru: "Выдача" },
      description: {
        pl: "Lista wykonanych punktów — gotowe do jazdy.",
        ru: "Список работ — можно ехать.",
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
        pl: "Co 10 000–15 000 km przy oleju syntetycznym lub co rok. W mieście i na krótkich trasach częściej (co 8 000–10 000 km). Objawy: czarny, gęsty olej na bagnetcie, głośniejszy silnik po zimnym starcie, większe spalanie, kontrolka ciśnienia oleju.",
        ru: "Каждые 10–15 тыс. км или раз в год. В городе чаще (8–10 тыс. км). Симптомы: тёмное густое масло, шум при пуске, расход, лампа давления.",
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
  suspension: [
    {
      title: { pl: "Objawy zużytego zawieszenia", ru: "Симптомы износа" },
      body: {
        pl: "Stuki na nierównościach, luz na kierownicy, nierówne zużycie opon, auto ściąga.",
        ru: "Стуки, люфт руля, неравномерный износ шин, увод.",
      },
    },
    {
      title: { pl: "Co wymieniamy", ru: "Что меняем" },
      body: {
        pl: "Amortyzatory, tuleje, sworznie, łączniki stabilizatora, wahacze — po diagnostyce.",
        ru: "Амортизаторы, сайлентблоки, шаровые, стойки стабилизатора, рычаги.",
      },
    },
    {
      title: { pl: "Jazda po naprawie", ru: "После ремонта" },
      body: {
        pl: "Sprawdzamy luz i prowadzenie — bez stuków i ściągania.",
        ru: "Проверяем люфт и увод — без стуков.",
      },
    },
  ],
  alignment: [
    {
      title: { pl: "Kiedy robić geometrię?", ru: "Когда делать развал?" },
      body: {
        pl: "Po wymianie elementów zawieszenia, uderzeniu w dziurę, gdy auto ściąga lub opony zużywają się bokiem.",
        ru: "После ремонта подвески, удара, увода или бокового износа шин.",
      },
    },
    {
      title: { pl: "Stanowisko 3D", ru: "Стенд 3D" },
      body: {
        pl: "Pomiar przed i po regulacji — dostajesz wydruk kątów kół.",
        ru: "Замер до и после — распечатка углов.",
      },
    },
  ],
  tires: [
    {
      title: { pl: "Sezonowa wymiana opon", ru: "Сезонная смена" },
      body: {
        pl: "Montaż, wyważanie, prawidłowe ciśnienie — komplet 4 kół bez kolejki po rezerwacji.",
        ru: "Монтаж, балансировка, давление — 4 колеса без очереди.",
      },
    },
  ],
  engine: [
    {
      title: { pl: "Typowe usterki silnika", ru: "Типичные неисправности" },
      body: {
        pl: "Wycieki oleju, spadki mocy, dym, Check Engine — zaczynamy od diagnostyki, nie od zgadywania.",
        ru: "Утечки, потеря мощности, дым, Check Engine — с диагностики.",
      },
    },
  ],
  electric: [
    {
      title: { pl: "Co naprawiamy w elektryce?", ru: "Что ремонтируем?" },
      body: {
        pl: "Oświetlenie, rozrusznik/alternator, wiązki, czujniki, błędy modułów komfortu.",
        ru: "Свет, стартер/генератор, проводка, датчики, блоки комфорта.",
      },
    },
  ],
  acRefill: [
    {
      title: { pl: "Objawy słabej klimy", ru: "Симптомы слабого кондиционера" },
      body: {
        pl: "Słabe chłodzenie, zapach pleśni, szumy sprężarki — często wystarczy serwis i napełnienie czynnikiem.",
        ru: "Слабое охлаждение, запах, шум компрессора.",
      },
    },
  ],
  brakePads: [
    {
      title: { pl: "Kiedy wymieniać klocki?", ru: "Когда менять колодки?" },
      body: {
        pl: "Pisk, wibracje, wydłużona droga hamowania — nie czekaj do metalu na metalu.",
        ru: "Скрип, вибрация, длинный тормозной путь.",
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
    {
      q: {
        pl: "Czy po diagnostyce muszę od razu naprawiać?",
        ru: "Нужно ли сразу ремонтировать?",
      },
      a: {
        pl: "Nie — dostajesz priorytety: co pilne, co można zaplanować. Ty decydujesz o zakresie.",
        ru: "Нет — приоритеты: что срочно, что отложить. Объём решаете вы.",
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
    {
      q: {
        pl: "Czy robicie odgrzybianie?",
        ru: "Делаете антибактериальную обработку?",
      },
      a: {
        pl: "Tak — ozonowanie i czyszczenie parownika na życzenie.",
        ru: "Да — озонирование и очистка испарителя.",
      },
    },
  ],
  suspension: [
    {
      q: { pl: "Skąd stuki w zawieszeniu?", ru: "Откуда стуки?" },
      a: {
        pl: "Często tuleje, stabilizatory lub łączniki — diagnozujemy na podnośniku.",
        ru: "Часто сайлентблоки или стойки стабилизатора.",
      },
    },
  ],
  alignment: [
    {
      q: { pl: "Czy geometria jest potrzebna co roku?", ru: "Развал каждый год?" },
      a: {
        pl: "Przy wymianie opon lub po uderzeniu w krawężnik — warto sprawdzić.",
        ru: "После удара о бордюр или смены шин — стоит проверить.",
      },
    },
  ],
  engine: [
    {
      q: { pl: "Czy naprawiacie silniki diesel?", ru: "Ремонт дизелей?" },
      a: { pl: "Tak — benzyna i diesel.", ru: "Да — бензин и дизель." },
    },
  ],
  electric: [
    {
      q: { pl: "Czy naprawiacie instalacje dodatkowe?", ru: "Доп. оборудование?" },
      a: {
        pl: "Tak — kamery, audio, Webasto po wycenie.",
        ru: "Да — камеры, аудио, Webasto по смете.",
      },
    },
  ],
  otherReason: [
    {
      q: { pl: "Czy przygotowujecie do przeglądu?", ru: "Подготовка к техосмотру?" },
      a: {
        pl: "Tak — checklist świateł, hamulców, emisji i płynów.",
        ru: "Да — чек-лист света, тормозов, выхлопа.",
      },
    },
  ],
  tires: [
    {
      q: { pl: "Czy przechowujecie opony?", ru: "Хранение шин?" },
      a: {
        pl: "Tak — sezonowe przechowanie opon, zapytaj przy rezerwacji.",
        ru: "Да — сезонное хранение, уточните при записи.",
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
    return {
      fromZl: getPriceItem("stage1")?.basePrice ?? 1200,
      priceFrom: true,
      materialsExtra: false,
      includes: getDefaultIncludes("chip"),
      priceTable: [
        {
          label: { pl: "Stage 1", ru: "Stage 1" },
          priceZl: getPriceItem("stage1")?.basePrice ?? 1200,
          priceFrom: true,
        },
        {
          label: { pl: "Stage 2", ru: "Stage 2" },
          priceZl: getPriceItem("stage2")?.basePrice ?? 2500,
          priceFrom: true,
        },
      ],
    };
  }

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
    title: { pl: "Dlaczego BESS MOTORS?", ru: "Почему BESS MOTORS?" },
    body: {
      pl: "Aleja Krakowska 48/52 — dogodny dojazd S2 i lotniska. Strefa oczekiwania z kawą i Wi-Fi.",
      ru: "Aleja Krakowska 48/52 — удобно с S2 и аэропорта. Зона ожидания с кофе и Wi-Fi.",
    },
  },
  {
    title: { pl: "Przejrzysta wycena", ru: "Прозрачная смета" },
    body: {
      pl: "Przed naprawą omawiamy zakres i koszt. Materiały i robocizna na fakturze — bez niespodzianek.",
      ru: "Перед ремонтом согласуем объём и цену. Всё в чеке — без сюрпризов.",
    },
  },
  {
    title: { pl: "Rezerwacja online 24/7", ru: "Онлайн-запись 24/7" },
    body: {
      pl: "Wybierz usługę i termin w kalendarzu — potwierdzenie SMS lub Telegram.",
      ru: "Услуга и время в календаре — подтверждение SMS или Telegram.",
    },
  },
];

const FAQ_PAD: Partial<Record<ServiceId, { q: LocalizedText; a: LocalizedText }>> = {
  diagnostic: {
    q: { pl: "Czy muszę umawiać się wcześniej?", ru: "Нужна ли запись?" },
    a: {
      pl: "Tak — rezerwacja skraca czas oczekiwania. W nagłych przypadkach zadzwoń.",
      ru: "Да — запись сокращает ожидание. Срочно — звоните.",
    },
  },
  suspension: {
    q: { pl: "Czy wymieniacie amortyzatory?", ru: "Меняете амортизаторы?" },
    a: { pl: "Tak — po diagnostyce i wycenie.", ru: "Да — после диагностики и сметы." },
  },
  alignment: {
    q: { pl: "Czy geometria jest na stanowisku 3D?", ru: "Развал на 3D?" },
    a: { pl: "Tak — pomiar i regulacja z wydrukiem parametrów.", ru: "Да — замер и регулировка с распечаткой." },
  },
  otherReason: {
    q: { pl: "Jak umówić wizytę?", ru: "Как записаться?" },
    a: {
      pl: "Online na stronie, telefon +48 791 257 229 lub Telegram.",
      ru: "Онлайн, телефон или Telegram.",
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
  return unique.slice(0, 4);
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
      },
      a: {
        pl: "Rezerwacja online, telefon lub WhatsApp — Aleja Krakowska 48/52, Warszawa.",
        ru: "Онлайн, телефон или WhatsApp — Warszawa.",
      },
    });
  }
  return items.slice(0, 5);
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
  acRefill: ["klim", "ac"],
};

export function getServiceLandingGalleryTags(
  serviceId: ServiceId,
  slug?: string
): string[] | undefined {
  const slugTags = slug ? getSlugLandingProfile(slug)?.galleryTags : undefined;
  if (slugTags?.length) return slugTags;
  return SERVICE_LANDING_GALLERY_TAGS[serviceId];
}
