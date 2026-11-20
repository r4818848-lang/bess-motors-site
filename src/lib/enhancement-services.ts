/**
 * New BESS MOTORS service areas confirmed by owner, November 2026.
 * Original owner-supplied ambient lighting photos are included in the
 * gallery. Other services stay without photos until original files arrive.
 * No invented client examples, fixed prices or performance guarantees.
 *
 * Polish content is the canonical SEO source. UI navigation remains localized.
 */
import { AMBIENT_LIGHTING_PHOTOS, SOUNDPROOFING_PHOTOS, type EnhancementPhoto } from "./enhancement-gallery";

export type EnhancementCategory = "lighting" | "upholstery" | "exterior" | "comfort" | "multimedia" | "detailing";
export type EnhancementFaq = { question: string; answer: string };
export type EnhancementService = {
  slug: string;
  title: string;
  titleRu: string;
  metaTitle: string;
  metaDescription: string;
  category: EnhancementCategory;
  intro: string;
  explanation: string;
  scope: string[];
  preparation: string[];
  faq: EnhancementFaq[];
  keywords: string[];
  /** Owner-supplied illustrative photos, with dimensions for accurate mobile layout. */
  photos?: readonly EnhancementPhoto[];
};

export const ENHANCEMENT_HUB_SLUG = "personalizacja-samochodu-warszawa";

export const enhancementCategoryLabels: Record<EnhancementCategory,string> = {
  lighting: "Oświetlenie wnętrza",
  upholstery: "Tapicerstwo samochodowe",
  exterior: "Stylizacja nadwozia",
  comfort: "Komfort we wnętrzu",
  multimedia: "Multimedia",
  detailing: "Pielęgnacja wnętrza",
};

export const enhancementServices: EnhancementService[] = [
  {
    slug: "oswietlenie-ambientowe-samochodu-warszawa",
    title: "Montaż uniwersalnego oświetlenia ambientowego LED",
    titleRu: "Установка амбиентной подсветки",
    metaTitle: "Oświetlenie ambientowe samochodu Warszawa – LED montaż",
    metaDescription: "Uniwersalne oświetlenie ambientowe LED w samochodzie: deska, drzwi, konsola i nogi. Zdjęcia efektów, dobór zestawu i indywidualna wycena. BESS MOTORS Warszawa.",
    category: "lighting",
    intro: "Uniwersalne oświetlenie ambientowe LED może całkowicie zmienić atmosferę wnętrza. W BESS MOTORS w Warszawie pomagamy dobrać i zamontować podświetlenie deski, drzwi, konsoli i przestrzeni na nogi. Zobacz galerię przykładowych efektów w różnych kolorach i konfiguracjach.",
    explanation: "Zestawy uniwersalne dobieramy do budowy konkretnego samochodu. Przed montażem sprawdzamy przestrzeń na listwy LED, przebieg przewodów i bezpieczny sposób zasilania. W zależności od zestawu można omówić zmianę kolorów i jasności, podświetlenie boczków drzwi, konsoli, podnóżków lub dekoracyjnych detali. Zakres uzgadniamy po ocenie wnętrza i wyposażenia.",
    scope: ["Podświetlenie dekoracyjne deski rozdzielczej i konsoli", "Oświetlenie boczków drzwiowych lub przestrzeni na nogi", "Dobór kolorystyki, jasności i sterowania do zestawu", "Montaż zestawów ambient LED po potwierdzeniu zgodności z autem"],
    preparation: ["Podaj markę, model, rocznik oraz zdjęcia kabiny.", "Napisz, które strefy chcesz podświetlić.", "Przed wykonaniem ustalimy sposób montażu, zakres i wycenę."],
    faq: [
      { question: "Czy można dodać ambient light do auta bez fabrycznej instalacji?", answer: "Możliwość montażu zestawu uniwersalnego zależy od wnętrza i sposobu poprowadzenia instalacji. Najpierw potrzebujemy danych samochodu oraz wybranych stref podświetlenia." },
      { question: "Czy światło będzie regulowane?", answer: "To zależy od wybranego zestawu i sterownika. Opcje kolorów i regulacji ustalamy przed zamówieniem elementów." },
      { question: "Czy trzeba demontować elementy tapicerki?", answer: "Zakres demontażu ustala się na podstawie konkretnego modelu i sposobu montażu. Unikamy obietnic montażu bez demontażu przed oględzinami." },
    ],
    keywords: ["ambient light Warszawa", "uniwersalne oświetlenie ambientowe", "montaż LED wnętrza samochodu", "podświetlenie drzwi Warszawa", "podświetlenie deski rozdzielczej", "подсветка салона"],
    photos: AMBIENT_LIGHTING_PHOTOS,
  },
  {
    slug: "wygluszenie-samochodu-warszawa",
    title: "Wygłuszenie i wyciszenie samochodu",
    titleRu: "Шумоизоляция автомобиля",
    metaTitle: "Wygłuszenie samochodu Warszawa – drzwi, podłoga i bagażnik",
    metaDescription: "Wygłuszenie i wyciszenie samochodu Warszawa: drzwi, boczki, bagażnik i maty akustyczne. Galeria etapów prac, indywidualna wycena BESS MOTORS Włochy.",
    category: "comfort",
    intro: "Chcesz ograniczyć hałas dobiegający do kabiny podczas jazdy, drgania elementów wnętrza lub poprawić komfort słuchania muzyki? W BESS MOTORS możesz zapytać o wygłuszenie wybranych stref samochodu albo zaplanować szerszą izolację akustyczną.",
    explanation: "Każdy model auta ma inne źródła hałasu i budowę tapicerki. Dobór materiałów tłumiących drgania oraz pochłaniających dźwięk zależy od konstrukcji drzwi, podłogi i bagażnika, dostępnego miejsca oraz bezpiecznego demontażu. Nie obiecujemy określonej redukcji hałasu bez pomiaru i sprawdzenia konkretnego pojazdu.",
    scope: [
      "Wyciszenie drzwi i boczków – zakres po ocenie konstrukcji",
      "Wygłuszenie bagażnika i nadkoli od wewnątrz – po weryfikacji auta",
      "Izolacja podłogi i wybranych elementów wnętrza, jeśli dostęp do nich jest możliwy",
      "Dobór mat tłumiących drgania i materiałów akustycznych do danej strefy",
      "Przygotowanie etapowej lub indywidualnej wyceny bez z góry narzuconych pakietów",
    ],
    preparation: [
      "Podaj markę, model, rocznik oraz wersję nadwozia.",
      "Opisz, czy przeszkadza Ci szum opon, dźwięk z zewnątrz, rezonans drzwi czy drgania wnętrza.",
      "Wskaż strefy, które chcesz wygłuszyć, i prześlij zdjęcia, jeśli masz konkretny projekt.",
    ],
    faq: [
      { question: "Czy można wygłuszyć tylko drzwi albo bagażnik?", answer: "Taką opcję można ustalić indywidualnie. Nie każda strefa jest równie łatwo dostępna; najpierw sprawdzamy konstrukcję auta i cel prac." },
      { question: "Czy wygłuszenie całkowicie usunie hałas z samochodu?", answer: "Nie. Hałas w kabinie zależy od źródła dźwięku, prędkości, opon, konstrukcji auta oraz zakresu użytych materiałów. Nie deklarujemy z góry konkretnej liczby decybeli." },
      { question: "Czy wygłuszenie wpływa na masę pojazdu?", answer: "Dodatkowe materiały mają określoną masę. Ilość i lokalizację ustalamy przed montażem, uwzględniając elementy bezpieczeństwa i dostęp do instalacji." },
      { question: "Ile kosztuje wygłuszenie auta w Warszawie?", answer: "Nie podajemy stałej ceny bez poznania modelu, zakresu demontażu i planowanych materiałów. Po ustaleniu stref prac przygotujemy indywidualną wycenę." },
    ],
    photos: SOUNDPROOFING_PHOTOS,
    keywords: ["wygłuszenie samochodu Warszawa", "wyciszenie auta Warszawa", "wygłuszenie drzwi samochodu Warszawa", "wygłuszenie bagażnika", "maty antywibracyjne", "izolacja akustyczna samochodu", "шумоизоляция автомобиля Варшава"],
  },
  {
    slug: "obszywanie-kierownicy-warszawa",
    title: "Obszywanie kierownicy samochodowej",
    titleRu: "Перетяжка руля",
    metaTitle: "Obszywanie kierownicy Warszawa – renowacja i personalizacja",
    metaDescription: "Obszywanie i personalizacja kierownicy samochodowej w Warszawie. Dobór materiału oraz indywidualnego wykończenia po sprawdzeniu kierownicy. BESS MOTORS Włochy.",
    category: "upholstery",
    intro: "Wytarta, śliska lub uszkodzona okładzina kierownicy wpływa na wygląd i odczucia z jazdy. Obszycie pozwala odświeżyć jej powierzchnię i dopasować stylistykę do wnętrza.",
    explanation: "Przy planowaniu obszycia ważne są kształt wieńca, stan obecnej powłoki, miejsce na szwy i wybrany materiał. Nie każda kierownica wymaga identycznego przygotowania. Elementy związane z poduszką powietrzną i przyciskami wymagają szczególnej ostrożności.",
    scope: ["Ocena stanu powierzchni i kształtu wieńca", "Dobór materiału, przeszyć i koloru nici", "Przygotowanie zakresu obszycia po oględzinach", "Uzgodnienie demontażu i ponownego montażu, jeżeli potrzebne"],
    preparation: ["Prześlij zdjęcie kierownicy z kilku stron.", "Podaj markę, model i rocznik samochodu.", "Wybierz preferowany wygląd i materiał do omówienia."],
    faq: [
      { question: "Czy mogę wybrać kolor nici?", answer: "Takie wykończenie można omówić przy przygotowaniu indywidualnego zamówienia. Dostępność konkretnego materiału potwierdzimy przed wykonaniem pracy." },
      { question: "Czy obszycie wymaga zdjęcia kierownicy?", answer: "Sposób wykonania zależy od konstrukcji i stanu elementu. Decyzję podejmujemy po sprawdzeniu samochodu." },
      { question: "Jak otrzymać wycenę?", answer: "Prześlij zdjęcia kierownicy, model auta i oczekiwany efekt. Cenę i termin ustalimy indywidualnie." },
    ],
    keywords: ["obszywanie kierownicy Warszawa", "przeszywanie kierownicy", "tapicer kierownic samochodowych"],
  },
  {
    slug: "obszywanie-foteli-samochodowych-warszawa",
    title: "Obszywanie foteli samochodowych",
    titleRu: "Перетяжка сидений",
    metaTitle: "Obszywanie foteli samochodowych Warszawa",
    metaDescription: "Obszywanie i odświeżanie tapicerki foteli samochodowych. Indywidualny dobór materiału i zakresu prac. BESS MOTORS, Aleja Krakowska 48/52, Warszawa.",
    category: "upholstery",
    intro: "Tapicerka foteli zużywa się od codziennego użytkowania. Zmiana obszycia może dotyczyć wybranego siedziska, oparcia lub większej części kompletu foteli.",
    explanation: "Zakres prac zależy od stanu poszycia i pianek oraz konstrukcji fotela. W autach z poduszkami bocznymi, czujnikami zajętości lub podgrzewaniem trzeba uwzględnić elementy bezpieczeństwa i wyposażenia. Materiał i wzór dobieramy do konkretnego wnętrza.",
    scope: ["Obszywanie siedzisk i oparć według ustalonego zakresu", "Dobór koloru, faktury i wzoru przeszyć", "Ocena zużycia tapicerki przed wyceną", "Omówienie połączenia z obszyciem innych elementów wnętrza"],
    preparation: ["Przygotuj zdjęcia foteli, przetarć i uszkodzeń.", "Podaj liczbę foteli oraz rodzaj tapicerki.", "Zaznacz obecność ogrzewania lub poduszek w fotelach."],
    faq: [
      { question: "Czy można obszyć tylko jeden fotel?", answer: "Można zapytać o zakres miejscowy. Ostateczna możliwość zależy od stanu poszycia i dopasowania dostępnego materiału." },
      { question: "Czy zmieni się działanie poduszek lub ogrzewania?", answer: "Konstrukcja foteli i elementy bezpieczeństwa muszą zostać sprawdzone przed doborem technologii. Nie obiecujemy kompatybilności bez oględzin." },
      { question: "Czy przyjmujecie zdjęcia do wstępnej oceny?", answer: "Tak, zdjęcia i dane auta są dobrym punktem wyjścia do rozmowy o zakresie i wycenie." },
    ],
    keywords: ["obszywanie foteli Warszawa", "tapicerka foteli samochodowych", "renowacja tapicerki samochodu"],
  },
  {
    slug: "obszywanie-podsufitki-samochodowej-warszawa",
    title: "Obszywanie podsufitki samochodowej",
    titleRu: "Перетяжка потолка автомобиля",
    metaTitle: "Obszywanie podsufitki samochodowej Warszawa",
    metaDescription: "Obszywanie podsufitki auta w Warszawie: dobór tkaniny, koloru i zakresu demontażu. Zapytaj o indywidualną wycenę BESS MOTORS Włochy.",
    category: "upholstery",
    intro: "Odklejająca się tkanina, przetarcia lub chęć zmiany koloru podsufitki to powody, by rozważyć ponowne obszycie tego elementu kabiny.",
    explanation: "Podsufitka jest dużym, delikatnym elementem o kształcie zależnym od modelu auta. Znaczenie mają otwory na lampki, uchwyty, słupki i ewentualny szyberdach. Przy wyborze tkaniny trzeba brać pod uwagę także stan podłoża i pianki.",
    scope: ["Ocena odklejonej lub uszkodzonej tkaniny", "Dobór nowego materiału i koloru podsufitki", "Omówienie demontażu i montażu elementu", "Uzgodnienie wykończenia widocznych krawędzi i otworów"],
    preparation: ["Prześlij zdjęcia całego sufitu i problematycznych miejsc.", "Podaj model, rocznik i informację o szyberdachu.", "Określ, czy chodzi o odnowienie czy zmianę stylu."],
    faq: [
      { question: "Czy można zmienić jasną podsufitkę na ciemną?", answer: "Zmiana koloru jest jednym z możliwych kierunków personalizacji. Dobór materiału i zakres pozostałych elementów należy omówić oddzielnie." },
      { question: "Czy wystarczy przykleić starą tkaninę?", answer: "To zależy od stanu tkaniny i warstwy pod nią. Po oględzinach oceniamy, jakie przygotowanie ma sens." },
      { question: "Czy podsufitka z szyberdachem wymaga dodatkowych prac?", answer: "Budowa sufitu z szyberdachem może zmieniać zakres demontażu i obszycia, dlatego potrzebujemy danych konkretnego auta." },
    ],
    keywords: ["obszywanie podsufitki Warszawa", "wymiana materiału podsufitki", "czarna podsufitka samochód"],
  },
  {
    slug: "obszywanie-boczkow-drzwi-warszawa",
    title: "Obszywanie boczków drzwi samochodowych",
    titleRu: "Перетяжка дверных карт",
    metaTitle: "Obszywanie boczków drzwi samochodowych Warszawa",
    metaDescription: "Obszywanie boczków drzwi i paneli tapicerki we wnętrzu samochodu. Dobór materiałów i wzoru po oględzinach. BESS MOTORS Warszawa Włochy.",
    category: "upholstery",
    intro: "Boczki drzwiowe są widoczną częścią wystroju kabiny. Ich obszycie umożliwia zmianę koloru i faktury albo odświeżenie zużytych paneli.",
    explanation: "Przy ocenie boczka liczy się sposób mocowania panelu, kształt wstawek, okolice klamek, przełączników i głośników. W niektórych autach drzwi zawierają elementy bezpieczeństwa, więc zakres demontażu trzeba ustalić przed rozpoczęciem pracy.",
    scope: ["Obszywanie dekoracyjnych wstawek i wybranych paneli drzwi", "Dobór materiału, nici i zestawienia kolorów", "Ocena mocowań oraz stanu paneli", "Łączenie stylistyczne z fotelami lub kierownicą"],
    preparation: ["Prześlij zdjęcia wszystkich drzwi objętych zmianą.", "Napisz, czy chodzi o jeden panel czy komplet.", "Podaj markę, model i rok produkcji."],
    faq: [
      { question: "Czy można zrobić tylko cztery wstawki w drzwiach?", answer: "Zakres można dopasować do projektu. Po zdjęciach i oględzinach potwierdzimy techniczną możliwość wykonania." },
      { question: "Czy materiał może pasować do foteli?", answer: "Można dobrać spójną kolorystykę i fakturę. Dokładne dopasowanie zależy od dostępności materiałów." },
      { question: "Co zrobić przy odklejającej się tapicerce?", answer: "Prześlij zdjęcia i opisz problem. Ocenimy stan podłoża oraz właściwy zakres prac." },
    ],
    keywords: ["obszywanie boczków drzwi Warszawa", "tapicerka drzwi samochodowych", "przeszywanie kart drzwiowych"],
  },
  {
    slug: "montaz-body-kitu-warszawa",
    title: "Montaż body kitu i obwieszeń stylistycznych",
    titleRu: "Установка обвесов",
    metaTitle: "Montaż body kitu Warszawa – pakiety stylistyczne",
    metaDescription: "Montaż body kitów i elementów pakietów stylistycznych samochodu. Sprawdzenie dopasowania, mocowań i zakresu prac. BESS MOTORS Warszawa Włochy.",
    category: "exterior",
    intro: "Pakiet stylistyczny może zmienić wygląd przedniego i tylnego zderzaka, progów oraz innych elementów nadwozia. Montaż wymaga przede wszystkim sprawdzenia dopasowania części do wersji auta.",
    explanation: "Elementy aftermarket nie zawsze pasują tak samo jak fabryczne. Przed montażem trzeba sprawdzić punkty mocowania, spasowanie względem karoserii, czujniki parkowania i pozostałe wyposażenie. Nie obiecujemy dopasowania zestawu bez sprawdzenia jego pochodzenia.",
    scope: ["Ocena dopasowania zakupionego zestawu do samochodu", "Montaż uzgodnionych elementów stylistycznych nadwozia", "Kontrola dostępnych mocowań i połączeń", "Omówienie ewentualnych prac przygotowawczych"],
    preparation: ["Wyślij VIN lub pełne dane auta.", "Prześlij zdjęcia i link do wybranego body kitu.", "Podaj, czy elementy są przygotowane do montażu."],
    faq: [
      { question: "Czy zamontujecie body kit kupiony przeze mnie?", answer: "Możemy ocenić możliwość montażu po otrzymaniu danych samochodu i informacji o zestawie. Nie każdy produkt będzie pasować bez dodatkowych prac." },
      { question: "Czy zestaw wymaga lakierowania?", answer: "To zależy od wykończenia dostarczonych części. Przed pracą należy oddzielnie ustalić przygotowanie i ewentualne wykończenie powierzchni." },
      { question: "Czy body kit może kolidować z czujnikami?", answer: "Możliwe są różnice w otworach i mocowaniach. Kompatybilność z wyposażeniem auta sprawdzamy przed ustaleniem zakresu montażu." },
    ],
    keywords: ["montaż body kit Warszawa", "montaż obwieszeń samochodowych", "pakiety stylistyczne samochodów"],
  },
  {
    slug: "montaz-spoilera-samochodowego-warszawa",
    title: "Montaż spoilera samochodowego",
    titleRu: "Установка спойлеров",
    metaTitle: "Montaż spoilera samochodowego Warszawa",
    metaDescription: "Montaż spoilerów i lotek samochodowych w Warszawie. Ocena dopasowania do klapy, mocowań i przygotowania elementu. BESS MOTORS Włochy.",
    category: "exterior",
    intro: "Spoiler lub lotka może dopełnić wygląd samochodu. Sposób montażu zależy od konstrukcji klapy i rodzaju dodatku, dlatego najpierw oceniamy wybrany element.",
    explanation: "Niektóre spoilery mają przewidziane otwory montażowe, inne korzystają z dedykowanego systemu mocowania. Trzeba uwzględnić kształt powierzchni, dostęp do klapy oraz ewentualne elementy wyposażenia pojazdu. Nie każdy typ mocowania pasuje do każdego modelu.",
    scope: ["Ocena rodzaju spoilera lub lotki", "Sprawdzenie spasowania z klapą lub nadwoziem", "Uzgodnienie sposobu montażu i przygotowania powierzchni", "Montaż po potwierdzeniu zgodności elementów"],
    preparation: ["Prześlij zdjęcie samochodu i wybranego spoilera.", "Podaj model, wersję nadwozia i rok produkcji.", "Napisz, czy masz komplet mocowań."],
    faq: [
      { question: "Czy można zamontować spoiler bez wiercenia?", answer: "To zależy od konstrukcji spoilera oraz dopuszczonego sposobu mocowania. Ocenę robimy dla konkretnego zestawu." },
      { question: "Czy montujecie lotki dachowe i na klapę?", answer: "Zakres zależy od dopasowania dodatku do auta. Podeślij zdjęcia lub numer zestawu do wstępnej oceny." },
      { question: "Czy można przynieść własną część?", answer: "Taką możliwość ustalamy po sprawdzeniu pochodzenia, stanu i kompatybilności elementu." },
    ],
    keywords: ["montaż spoilera Warszawa", "montaż lotki bagażnika", "spojler samochodowy montaż"],
  },
  {
    slug: "montaz-splittera-warszawa",
    title: "Montaż splittera i dokładek zderzaka",
    titleRu: "Установка сплиттеров",
    metaTitle: "Montaż splittera Warszawa – dokładki zderzaka",
    metaDescription: "Montaż splitterów i dokładek przedniego zderzaka. Weryfikacja mocowań, prześwitu i dopasowania zestawu. BESS MOTORS Warszawa Włochy.",
    category: "exterior",
    intro: "Splitter to element dolnej części przedniego zderzaka. Dobrze dobrana dokładka podkreśla linię nadwozia, ale powinna pasować do konkretnego zderzaka i jego mocowań.",
    explanation: "Przed pracą warto sprawdzić prześwit, punkty podparcia, sposób łączenia oraz ryzyko zahaczenia o przeszkody. Inaczej montuje się część przeznaczoną do danego modelu, a inaczej element uniwersalny. Nie deklarujemy funkcji aerodynamicznych bez danych producenta części.",
    scope: ["Dobór i weryfikacja mocowania splittera", "Ocena prześwitu oraz kolizji z osłonami", "Montaż dokładki przedniego zderzaka", "Sprawdzenie stabilności elementu po instalacji"],
    preparation: ["Prześlij zdjęcie przodu auta i wybranego splittera.", "Podaj wariant zderzaka i rok produkcji.", "Poinformuj o dodatkowych osłonach lub obniżeniu zawieszenia."],
    faq: [
      { question: "Czy splitter uniwersalny będzie pasować?", answer: "Nie zawsze. Wymagana jest ocena wymiarów oraz sposobu mocowania i niekiedy prace dopasowujące." },
      { question: "Czy trzeba zdejmować zderzak?", answer: "To zależy od konstrukcji samochodu i dostępu do mocowań. Zakres ustalimy po ocenie konkretnej części." },
      { question: "Czy splitter zmniejszy prześwit?", answer: "Dodatek może obniżyć najniżej położony punkt przodu auta. Dlatego przed montażem omawiamy prześwit i codzienną eksploatację." },
    ],
    keywords: ["montaż splittera Warszawa", "dokładka zderzaka montaż", "splitter przedni samochodu"],
  },
  {
    slug: "aromatyzacja-samochodu-warszawa",
    title: "Aromatyzacja wnętrza samochodu",
    titleRu: "Ароматизация автомобиля",
    metaTitle: "Aromatyzacja samochodu Warszawa – systemy zapachowe",
    metaDescription: "Aromatyzacja wnętrza auta i dobór samochodowych systemów zapachowych. Zakres instalacji po ocenie wyposażenia. BESS MOTORS Warszawa Włochy.",
    category: "comfort",
    intro: "Zapach we wnętrzu jest częścią komfortu podróży. W BESS MOTORS można zapytać o system aromatyzacji samochodu i rozwiązania dopasowane do kabiny.",
    explanation: "Rozwiązania zapachowe różnią się sposobem montażu, wymianą wkładów i regulacją intensywności. Nie każdy samochód jest przygotowany do instalacji urządzenia wewnątrz kanałów wentylacji. Dobór zależy od oczekiwanego efektu i wyposażenia konkretnego auta.",
    scope: ["Omówienie rodzaju i umiejscowienia systemu zapachowego", "Sprawdzenie możliwości montażu w wybranym modelu", "Dobór sposobu obsługi i wymiany wkładów", "Instalacja po zatwierdzeniu zakresu"],
    preparation: ["Podaj model i rocznik samochodu.", "Napisz, czy chodzi o system stały czy akcesorium.", "Prześlij zdjęcie wybranego urządzenia, jeśli już je masz."],
    faq: [
      { question: "Czy można dodać system aromatyzacji do każdego auta?", answer: "Możliwości zależą od konstrukcji kabiny i wybranego urządzenia. Weryfikujemy dopasowanie przed uzgodnieniem montażu." },
      { question: "Czy aromatyzacja usuwa nieprzyjemne zapachy?", answer: "System zapachowy nie zastępuje usuwania źródła zapachu. Przy zabrudzeniach lub wilgoci warto rozważyć czyszczenie wnętrza." },
      { question: "Czy mogę dostarczyć własny dyfuzor?", answer: "Prześlij jego model i instrukcję montażu. Ocenimy zgodność z samochodem i zakres prac." },
    ],
    keywords: ["aromatyzacja samochodu Warszawa", "montaż samochodowego dyfuzora zapachowego", "system zapachowy do auta"],
  },
  {
    slug: "montaz-apple-carplay-warszawa",
    title: "Montaż i doposażenie w Apple CarPlay",
    titleRu: "Установка Apple CarPlay",
    metaTitle: "Montaż Apple CarPlay Warszawa – doposażenie auta",
    metaDescription: "Doposażenie samochodu w Apple CarPlay po sprawdzeniu systemu multimedialnego. Dobór rozwiązania do modelu i rocznika. BESS MOTORS Warszawa Włochy.",
    category: "multimedia",
    intro: "Apple CarPlay ułatwia korzystanie z kompatybilnych funkcji iPhone'a na ekranie multimedialnym samochodu. Możliwość doposażenia zależy jednak od zastosowanego radia i elektroniki auta.",
    explanation: "W jednych samochodach wystarczy kompatybilny moduł, w innych potrzebna może być wymiana jednostki. Przed podjęciem prac trzeba sprawdzić złącza, ekran, sterowanie z kierownicy i możliwości systemu. Nie obiecujemy aktywacji każdej fabrycznej jednostki bez weryfikacji.",
    scope: ["Wstępna ocena fabrycznego systemu multimedialnego", "Dobór sposobu doposażenia w Apple CarPlay", "Omówienie kompatybilności ekranu i sterowania", "Montaż lub konfiguracja zatwierdzonego rozwiązania"],
    preparation: ["Podaj VIN, markę, model i rocznik.", "Wyślij zdjęcie ekranu oraz menu systemu.", "Napisz, czy zależy Ci na połączeniu przewodowym czy bezprzewodowym."],
    faq: [
      { question: "Czy Apple CarPlay można zamontować w starszym samochodzie?", answer: "W wielu autach istnieją rozwiązania doposażeniowe, ale ich dostępność zależy od fabrycznego radia i wyposażenia. Weryfikujemy model przed doborem części." },
      { question: "Czy pozostaną przyciski na kierownicy?", answer: "Zgodność przycisków oraz pozostałych funkcji zależy od zastosowanego modułu. Potwierdzimy ją dla wybranego samochodu." },
      { question: "Czy dostępny jest bezprzewodowy CarPlay?", answer: "Niektóre rozwiązania obsługują łączność bezprzewodową. Dobór wersji przewodowej lub bezprzewodowej ustalamy przed montażem." },
    ],
    keywords: ["montaż Apple CarPlay Warszawa", "CarPlay do starszego auta", "doposażenie CarPlay samochodu"],
  },
  {
    slug: "oklejanie-samochodu-folia-warszawa",
    title: "Oklejanie samochodu folią",
    titleRu: "Оклейка автомобиля плёнкой",
    metaTitle: "Oklejanie samochodu folią Warszawa – stylizacja",
    metaDescription: "Oklejanie samochodu folią i wybranych elementów nadwozia. Dobór rodzaju folii i zakresu pracy po ocenie lakieru. BESS MOTORS Warszawa Włochy.",
    category: "exterior",
    intro: "Folia może zmienić wygląd wybranych elementów nadwozia lub większej powierzchni samochodu. Każdy projekt wymaga dobrania materiału do celu, kształtu części oraz stanu powłoki lakierniczej.",
    explanation: "Folia do zmiany wyglądu i folia ochronna nie są tym samym produktem. Przed wykonaniem pracy trzeba sprawdzić stan lakieru, wcześniejsze naprawy, ostre przetłoczenia i krawędzie. Zakres, rodzaj materiału oraz oczekiwany rezultat potwierdzamy indywidualnie, bez domyślnego przypisywania usługi PPF.",
    scope: ["Omówienie oklejania elementów lub większej części nadwozia", "Dobór typu i koloru folii do projektu", "Ocena stanu powierzchni przed aplikacją", "Uzgodnienie przygotowania i wykończenia krawędzi"],
    preparation: ["Prześlij zdjęcia auta i zaznacz obszary do oklejenia.", "Napisz, czy celem jest zmiana wyglądu czy ochrona.", "Podaj rodzaj i historię lakieru, jeśli są znane."],
    faq: [
      { question: "Czy wykonujecie oklejanie całego samochodu?", answer: "Zakres projektu omawiamy indywidualnie po otrzymaniu danych auta i celu oklejania. Możliwa jest wstępna ocena na podstawie zdjęć." },
      { question: "Czym różni się folia stylistyczna od PPF?", answer: "Folie mogą mieć różne przeznaczenie i właściwości. Przed wyceną trzeba ustalić konkretny materiał, zamiast traktować każdy rodzaj folii jako identyczną usługę." },
      { question: "Czy można okleić element po lakierowaniu?", answer: "Należy sprawdzić stan i przygotowanie powłoki oraz zalecenia dla folii. Decyzję podejmujemy po ocenie powierzchni." },
    ],
    keywords: ["oklejanie samochodu folią Warszawa", "zmiana koloru auta folią", "car wrapping Warszawa"],
  },
  {
    slug: "pranie-tapicerki-samochodowej-warszawa",
    title: "Pranie tapicerki i czyszczenie wnętrza",
    titleRu: "Химчистка салона автомобиля",
    metaTitle: "Pranie tapicerki samochodowej Warszawa – czyszczenie",
    metaDescription: "Pranie tapicerki i czyszczenie wnętrza samochodu w Warszawie. Ocena zabrudzeń i dobór zakresu pielęgnacji. BESS MOTORS Włochy, Aleja Krakowska 48/52.",
    category: "detailing",
    intro: "Codzienne użytkowanie samochodu pozostawia ślady na siedzeniach, wykładzinach i elementach kabiny. Czyszczenie wnętrza pomaga zadbać o wygląd i higienę miejsc, z których korzystają kierowca i pasażerowie.",
    explanation: "Metoda czyszczenia zależy od rodzaju powierzchni, zabrudzeń i stanu materiałów. Fotele tekstylne, skóra, plastiki i podsufitka wymagają odmiennego podejścia. Stare plamy lub nieprzyjemne zapachy nie zawsze da się całkowicie usunąć, dlatego zakres omawiamy przed rozpoczęciem pracy.",
    scope: ["Pranie i czyszczenie wybranych elementów tapicerki", "Czyszczenie foteli, wykładzin i dostępnych powierzchni", "Dobór metody do materiału i rodzaju zabrudzenia", "Omówienie indywidualnego pakietu czyszczenia wnętrza"],
    preparation: ["Wyślij zdjęcia wnętrza i miejsc z zabrudzeniami.", "Podaj rodzaj tapicerki oraz model auta.", "Opisz źródło plam lub zapachu, jeśli je znasz."],
    faq: [
      { question: "Czy chemiczne czyszczenie usuwa wszystkie plamy?", answer: "Nie da się tego zagwarantować bez oceny rodzaju zabrudzenia i materiału. Wstępną ocenę możemy zrobić na podstawie zdjęć." },
      { question: "Czy czyścicie również podsufitkę?", answer: "Dobór metody do delikatnego materiału wymaga osobnej oceny. Zakres czyszczenia ustalimy przed wykonaniem usługi." },
      { question: "Czy trzeba zostawić samochód do wyschnięcia?", answer: "Czas zależy od zakresu, temperatury i użytej metody. Omówimy go przed umówieniem wizyty." },
    ],
    keywords: ["pranie tapicerki samochodowej Warszawa", "czyszczenie wnętrza samochodu", "химчистка салона Варшава"],
  },
];

export const enhancementServiceSlugs = enhancementServices.map((s) => s.slug);
export const allEnhancementSlugs = [ENHANCEMENT_HUB_SLUG, ...enhancementServiceSlugs];
export function getEnhancementService(slug: string): EnhancementService | undefined {
  return enhancementServices.find((s) => s.slug === slug);
}
export function isEnhancementSlug(slug: string): boolean {
  return allEnhancementSlugs.includes(slug);
}
