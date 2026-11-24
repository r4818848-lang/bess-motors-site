import type { Locale } from "@/lib/i18n/types";
import type { EnhancementCategory, EnhancementService } from "@/lib/enhancement-services";
import { enhancedRuMain } from "./enhancement-ru-main";
import { enhancedRuOther } from "./enhancement-ru-other";

export function localizedEnhancementService(service: EnhancementService, locale: Locale): EnhancementService {
  if (locale !== "ru") return service;
  const translated = enhancedRuMain[service.slug] || enhancedRuOther[service.slug];
  return translated ? { ...service, ...translated, title: service.titleRu } : { ...service, title: service.titleRu };
}

export const russianEnhancementSlugs = [...Object.keys(enhancedRuMain), ...Object.keys(enhancedRuOther)];

type Ui = {
  categories: Record<EnhancementCategory, string>;
  nav: { home: string; services: string; hub: string; breadcrumbs: string };
  hub: {
    tagline: string; title: string; intro: string; note: string; how: string; steps: [string,string][];
    ask: string; choose: string; compareTitle: string; compareIntro: string;
    cards: { title: string; intro: string; link: string }[];
    compareNote: string; locationTitle: string; locationIntro: string; directions: string;
  };
  service: {
    quote: string; phone: string; quoteTitle: string; quoteNote: string;
    scope: string; scopeNote: string; faq: string; contactTitle: string; contactIntro: string;
    contactSend: string; related: string; all: string; starExample: string;
    waGreeting: string; waDetails: string;
  };
  gallery: {
    kicker: string; title: string; count: (n:number)=>string; more: (n:number)=>string;
    enlarge: string; dialog: string; close: string; previous: string; next: string;
  };
};
const pl: Ui = {
  categories:{lighting:"Oświetlenie wnętrza",upholstery:"Tapicerstwo samochodowe",exterior:"Stylizacja nadwozia",comfort:"Komfort we wnętrzu",multimedia:"Multimedia",detailing:"Pielęgnacja wnętrza"},
  nav:{home:"Strona główna",services:"Usługi",hub:"Personalizacja auta",breadcrumbs:"Ścieżka nawigacji"},
  hub:{
    tagline:"STYLIZACJA I DOPOSAŻENIE",title:"Personalizacja samochodu Warszawa",
    intro:"Chcesz zmienić wygląd auta, odświeżyć jego wnętrze lub dodać nowe wyposażenie? W BESS MOTORS możesz zapytać o uniwersalne oświetlenie LED i ambient light, wygłuszenie drzwi i kabiny, gwiezdne niebo w podsufitce, Apple CarPlay lub Android Auto, obszywanie tapicerki, stylizację nadwozia, folie i czyszczenie wnętrza.",
    note:"Każdy projekt omawiamy indywidualnie. Dopasowanie części, materiał i zakres prac zależą od konkretnego samochodu. Na tym etapie nie publikujemy stałego cennika — wycenę przygotowujemy po ustaleniu szczegółów.",
    how:"Jak zacząć?",steps:[["Opisz swój pomysł","Wybierz usługę lub napisz, jak chcesz zmienić auto."],["Prześlij zdjęcia i dane auta","Podaj markę, model, rok i zakres planowanych zmian."],["Uzgodnij zakres","Najpierw oceniamy zgodność i przygotowujemy indywidualną wycenę."]],
    ask:"Zapytaj o projekt",choose:"Wybierz rodzaj personalizacji",compareTitle:"Jaką zmianę we wnętrzu auta wybrać?",
    compareIntro:"Podświetlenie, izolacja akustyczna i multimedia rozwiązują różne potrzeby. Zobacz, co warto sprawdzić przed doborem zestawu do konkretnego samochodu.",
    cards:[
      {title:"Ambient light i uniwersalne LED",intro:"Chcesz podświetlić deskę, boczki drzwi, konsolę lub przestrzeń na nogi? Przed montażem sprawdzamy prowadzenie przewodów, zasilanie i możliwy sposób sterowania. Efekt i dostępne kolory zależą od zestawu oraz wnętrza auta.",link:"Montaż podświetlenia LED"},
      {title:"Gwiezdne niebo w podsufitce",intro:"Światłowodowy efekt starlight w suficie auta: liczba punktów, ich rozmieszczenie i sterowanie zależą od wybranego zestawu oraz konstrukcji podsufitki. Przed montażem sprawdzamy bezpieczeństwo prowadzenia włókien i przewodów.",link:"Zobacz zdjęcia i możliwości"},
      {title:"Wygłuszenie i wyciszenie auta",intro:"Dokucza Ci szum lub rezonans elementów wnętrza? Można rozważyć wygłuszenie drzwi, bagażnika, nadkoli lub podłogi. Strefy i materiały dobieramy po sprawdzeniu źródła hałasu, bez obiecywania konkretnej redukcji dB.",link:"Sprawdź opcje wygłuszenia"},
      {title:"Apple CarPlay i Android Auto",intro:"Chcesz nawigację i aplikacje telefonu na ekranie samochodu? Możliwość doposażenia zależy od radia, wersji systemu oraz wyposażenia pojazdu. Prześlij VIN i zdjęcie menu; w galerii pokazujemy Android Auto w BMW.",link:"Sprawdź zgodność multimediów"},
    ],
    compareNote:"BESS MOTORS, Warszawa Włochy: dopasowujemy zakres prac i części do konkretnego modelu. Przed realizacją uzgadniamy indywidualną wycenę. Nie publikujemy stałych cen tych usług.",
    locationTitle:"Personalizacja auta — Warszawa Włochy",locationIntro:"BESS MOTORS znajduje się przy Aleja Krakowska 48/52. Możesz skonsultować plan zmian i uzgodnić termin. Pokaż zdjęcia inspiracji i wybranego zestawu, jeśli go masz.",directions:"Kontakt i dojazd",
  },
  service:{
    quote:"Zapytaj o wycenę",phone:"Zadzwoń",quoteTitle:"Co wysłać do wyceny?",
    quoteNote:"Cena zależy od samochodu, materiałów i zakresu. Nie pokazujemy orientacyjnej kwoty bez ustalenia szczegółów.",
    scope:"Co obejmuje usługa?",scopeNote:"Rzeczywisty zakres ustalamy po weryfikacji auta i wybranego rozwiązania.",
    faq:"Pytania i odpowiedzi",contactTitle:"Masz zdjęcia pomysłu lub zestawu?",
    contactIntro:"Wyślij nam markę i model auta, kilka zdjęć oraz opis oczekiwanego efektu. Ustalimy, czy wybrany wariant można dopasować i jak przygotować wycenę.",
    contactSend:"Wyślij zapytanie",related:"Powiązane usługi",all:"Wszystkie usługi personalizacji",
    starExample:"Przykładowy efekt gwiezdnego nieba w podsufitce samochodu",
    waGreeting:"Dzień dobry, proszę o indywidualną wycenę usługi:",waDetails:"Marka, model i rok auta: ... . Opis zakresu: ... . Mogę przesłać zdjęcia.",
  },
  gallery:{kicker:"GALERIA ZDJĘĆ",title:"Zobacz przykładowe efekty i etapy prac",count:n=>n+" zdjęć · kliknij, aby powiększyć",more:n=>"Pokaż wszystkie "+n+" zdjęć",enlarge:"Powiększ zdjęcie",dialog:"Powiększone zdjęcie usługi",close:"Zamknij zdjęcie",previous:"Poprzednie zdjęcie",next:"Następne zdjęcie"},
};
const ru: Ui = {
  categories:{lighting:"Подсветка автомобиля",upholstery:"Перетяжка салона",exterior:"Стайлинг кузова",comfort:"Комфорт в салоне",multimedia:"Мультимедиа",detailing:"Уход за салоном"},
  nav:{home:"Главная",services:"Услуги",hub:"Персонализация автомобиля",breadcrumbs:"Навигация по странице"},
  hub:{
    tagline:"СТАЙЛИНГ И ДООСНАЩЕНИЕ",title:"Персонализация автомобиля в Варшаве",
    intro:"Хотите изменить внешний вид автомобиля, обновить салон или установить дополнительное оборудование? В BESS MOTORS можно заказать амбиентную LED-подсветку, шумоизоляцию, звёздное небо в потолке, Apple CarPlay и Android Auto, перетяжку салона, обвесы, оклейку плёнкой и химчистку.",
    note:"Каждый проект рассчитывается индивидуально. Подбор деталей, материалов и объём работ зависят от автомобиля. Стоимость согласуем после уточнения деталей.",
    how:"С чего начать?",steps:[["Опишите идею","Выберите услугу или расскажите, что хотите изменить."],["Пришлите фото и данные","Укажите марку, модель, год и планируемые изменения."],["Согласуйте детали","Проверим совместимость и подготовим индивидуальную смету."]],
    ask:"Обсудить проект",choose:"Выберите услугу",compareTitle:"Какое улучшение салона выбрать?",
    compareIntro:"Подсветка, шумоизоляция и мультимедиа решают разные задачи. Вот что стоит проверить перед установкой в конкретный автомобиль.",
    cards:[
      {title:"Амбиентная и универсальная LED-подсветка",intro:"Хотите подсветить панель, двери, консоль или пространство для ног? Проверим прокладку проводов, питание и управление. Цвета и эффекты зависят от комплекта.",link:"Установка LED-подсветки"},
      {title:"Звёздное небо в потолке",intro:"Оптоволоконные светящиеся точки на потолке: их количество, расположение и управление зависят от комплекта и конструкции. Проверяем безопасность проводки и шторок безопасности.",link:"Фотографии и варианты"},
      {title:"Шумоизоляция автомобиля",intro:"Мешают шум шин или вибрации обшивки? Возможна обработка дверей, багажника, арок и пола. Зоны и материалы подбираем после выяснения источника шума.",link:"Варианты шумоизоляции"},
      {title:"Apple CarPlay и Android Auto",intro:"Хотите навигацию и приложения телефона на экране машины? Совместимость зависит от системы и комплектации. Пришлите VIN и фото меню. В галерее есть Android Auto в BMW.",link:"Проверить мультимедиа"},
    ],
    compareNote:"BESS MOTORS, Варшава, район Włochy. Подбираем объём работ и детали под автомобиль. Стоимость согласуем до начала работ.",
    locationTitle:"Персонализация автомобиля — Варшава Włochy",locationIntro:"BESS MOTORS находится по адресу Aleja Krakowska 48/52. Можно обсудить желаемые изменения и согласовать визит. Пришлите примеры и фото оборудования.",directions:"Контакты и маршрут",
  },
  service:{
    quote:"Узнать стоимость",phone:"Позвонить",quoteTitle:"Что нужно для расчёта?",
    quoteNote:"Стоимость зависит от автомобиля, материалов и объёма работ. Точную цену сообщим после уточнения деталей.",
    scope:"Что входит в услугу?",scopeNote:"Окончательный объём работ согласуем после проверки автомобиля и выбранного решения.",
    faq:"Вопросы и ответы",contactTitle:"Есть фото идеи или выбранного комплекта?",
    contactIntro:"Отправьте марку и модель автомобиля, несколько фотографий и описание желаемого результата. Мы проверим совместимость и подготовим расчёт.",
    contactSend:"Отправить запрос",related:"Похожие услуги",all:"Все услуги персонализации",
    starExample:"Пример готового звёздного неба в потолке автомобиля",
    waGreeting:"Здравствуйте! Хочу узнать стоимость услуги:",waDetails:"Марка, модель и год автомобиля: ... . Описание работ: ... . Могу прислать фото.",
  },
  gallery:{kicker:"ФОТОГАЛЕРЕЯ",title:"Примеры результата и этапы установки",count:n=>n+" фото · нажмите для увеличения",more:n=>"Показать все "+n+" фото",enlarge:"Увеличить фото",dialog:"Увеличенная фотография услуги",close:"Закрыть фото",previous:"Предыдущее фото",next:"Следующее фото"},
};
export function enhancementUi(locale: Locale): Ui { return locale === "ru" ? ru : pl; }
