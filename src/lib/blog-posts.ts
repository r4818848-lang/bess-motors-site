export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  /** Last content review (ISO) — used for “updated” signal */
  updatedAt?: string;
  excerpt: string;
  body: string;
  /** Related service / SEO page paths for internal linking */
  relatedHrefs?: { href: string; label: string }[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "kiedy-wymienic-olej",
    title: "Kiedy wymienić olej w silniku?",
    date: "2026-05-01",
    updatedAt: "2026-10-21",
    excerpt: "Interwały serwisowe i objawy zużytego oleju.",
    body:
      "Zalecamy wymianę oleju co 10–15 tys. km lub raz w roku. Ciemny olej, stuki przy starcie i podwyższony poziom oleju to sygnały, że warto umówić wizytę w BESS MOTORS.\n\nRobocizna wymiany oleju i filtra: 80 zł (kod BessMotors) — olej i filtr wyceniamy osobno pod VIN.",
    relatedHrefs: [
      { href: "/wymiana-oleju-warszawa", label: "Wymiana oleju Warszawa" },
      { href: "/cennik", label: "Cennik" },
    ],
  },
  {
    slug: "check-engine-co-robic",
    title: "Check Engine — co robić?",
    date: "2026-05-10",
    updatedAt: "2026-10-21",
    excerpt: "Kontrolka silnika nie zawsze oznacza awarię.",
    body:
      "Najpierw sprawdź korek wlewu paliwa. Jeśli lampka miga — nie jedź dalej. Umów diagnostykę komputerową — odczytamy dostępne kody i podamy zakres naprawy.\n\nZakres diagnostyki zależy od auta i sprzętu w warsztacie — bez obietnic „wszystkie bloki za darmo”.",
    relatedHrefs: [
      { href: "/diagnostyka-komputerowa-warszawa", label: "Diagnostyka komputerowa" },
      { href: "/diagnostyka-silnika-warszawa", label: "Diagnostyka silnika" },
    ],
  },
  {
    slug: "program-polecen",
    title: "Program poleceń BESS MOTORS",
    date: "2026-05-20",
    excerpt: "Poleć znajomego i odbierz rabat.",
    body:
      "Poleć warsztat znajomemu — przy umawianiu wizyty podaj kod BessMotors. Aktualne promocje: olej, hamulce i klimatyzacja. Szczegóły na stronie /promocje.",
    relatedHrefs: [{ href: "/promocje", label: "Promocje" }],
  },
  {
    slug: "geometria-kol-kiedy",
    title: "Kiedy robić geometrię kół?",
    date: "2026-05-22",
    updatedAt: "2026-10-21",
    excerpt: "Objawy złej zbieżności i zużycia opon.",
    body:
      "Auto ściąga na bok, nierównomierne zużycie bieżnika lub po wymianie zawieszenia — to sygnał do ustawienia geometrii. W BESS MOTORS wykonujemy pomiar i korektę zbieżności. Zapytaj o najbliższy termin wizyty.",
    relatedHrefs: [
      { href: "/geometria", label: "Geometria kół" },
      { href: "/naprawa-zawieszenia-warszawa", label: "Naprawa zawieszenia" },
    ],
  },
  {
    slug: "serwis-klimatyzacji-porady",
    title: "Serwis klimatyzacji — kiedy i dlaczego?",
    date: "2026-05-24",
    updatedAt: "2026-10-21",
    excerpt: "Nabijanie, odgrzybianie i diagnostyka klimy.",
    body:
      "Słabe chłodzenie, zapach pleśni lub wilgoć na szybie to powody wizyty w serwisie klimatyzacji. Co 1–2 lata warto sprawdzić szczelność i doładować czynnik.\n\nTarify: podłączenie 80 zł, R134a 50 zł/100 g, R1234yf 100 zł/100 g. Przy nieszczelności najpierw naprawa — nie „dopychamy gazu”.",
    relatedHrefs: [
      { href: "/serwis-klimatyzacji-warszawa", label: "Serwis klimatyzacji" },
      { href: "/sprawdzenie-szczelnosci-klimatyzacji-warszawa", label: "Szczelność klimy" },
      { href: "/odgrzybianie-klimatyzacji-warszawa", label: "Odgrzybianie" },
    ],
  },
  {
    slug: "wulkanizacja-sezonowa",
    title: "Wymiana opon — kiedy zmieniać sezon?",
    date: "2026-05-26",
    updatedAt: "2026-10-21",
    excerpt: "Terminy wymiany letnia / zima w Polsce.",
    body:
      "W Polsce większość kierowców zmienia opony przy ok. +7°C — zazwyczaj marzec–kwiecień (lato) i październik–listopad (zima).\n\nW BESS MOTORS komplet 4 kół: R13–R17 200 zł, R18 260 zł, R19 300 zł, R20 350 zł. SUV / RunFlat / R21+ — po potwierdzeniu pojazdu. Naprawa przebicia: 60 zł robocizna.\n\nZapytaj o termin wymiany opon — potwierdzimy po kontakcie.",
    relatedHrefs: [
      { href: "/wymiana-opon-warszawa", label: "Wymiana opon" },
      { href: "/wulkanizacja-warszawa", label: "Wulkanizacja" },
      { href: "/naprawa-opon-warszawa", label: "Naprawa opon" },
    ],
  },
  {
    slug: "ile-kosztuje-wymiana-oleju",
    title: "Ile kosztuje wymiana oleju w Warszawie? (2026)",
    date: "2026-08-17",
    updatedAt: "2026-10-21",
    excerpt:
      "Robocizna wymiany oleju i filtra w BESS MOTORS: 80 zł z kodem BessMotors (było 150 zł). Olej dobieramy pod VIN.",
    body: `Ile kosztuje wymiana oleju w Warszawie? W BESS MOTORS (Aleja Krakowska 48/52, Włochy) robocizna wymiany oleju + filtr to 80 zł z kodem BessMotors — wcześniej 150 zł. Sam olej i filtr liczymy osobno, pod VIN, żeby trafić w specyfikację silnika.

Co wchodzi w cenę robocizny
• spuszczenie zużytego oleju
• wymiana filtra oleju
• zalanie nowym olejem według normy producenta
• kontrola poziomu i ewentualnych wycieków

Olej i filtr — skąd kwota „od”
Cena oleju zależy od pojemności miski i specyfikacji (np. 0W-20, 5W-30, Longlife). Dlatego w Google widzisz „od … zł”: robocizna jest stała, materiały wyceniamy przed startem.

Jak często wymieniać
Zwykle co 10–15 tys. km lub raz w roku — wcześniej, jeśli jeździsz głównie po mieście. Ciemny olej, stuki na zimno i kontrolka ciśnienia to sygnał, żeby nie czekać.

Czas wizyty
Wymiana oleju u nas to zwykle około 1 godziny, jeśli jest wolne stanowisko. Zapisz się online albo zostaw numer — potwierdzimy termin po kontakcie.

Gdzie nas szukać
Warsztat przy Alei Krakowskiej, okolice Okęcia. Parking przy serwisie. Pn–Sb 8:00–18:00, tel. +48 791 257 229.`,
    relatedHrefs: [
      { href: "/wymiana-oleju-warszawa", label: "Wymiana oleju Warszawa" },
      { href: "/booking", label: "Umów wizytę" },
    ],
  },
  {
    slug: "kiedy-zmieniac-klocki",
    title: "Kiedy zmieniać klocki hamulcowe? Objawy i cena robocizny",
    date: "2026-08-17",
    updatedAt: "2026-10-21",
    excerpt:
      "Pisk, wibracje, dłuższa droga hamowania — kiedy wymienić klocki. W BESS MOTORS klocki przód od 100 zł robocizny (kod BessMotors).",
    body: `Kiedy zmieniać klocki hamulcowe? Nie ma jednej liczby kilometrów dla każdego auta — miasto, korki i styl jazdy ścierają okładziny szybciej niż trasa. Warto sprawdzić klocki co przegląd.

Typowe objawy zużytych klocków
• pisk lub metaliczne tarcie przy hamowaniu
• auto ściąga w jedną stronę
• wibracje na pedale lub kierownicy (często tarcze)
• dłuższa droga hamowania

Klocki czy tarcze?
Same klocki wystarczą, gdy tarcze mają jeszcze zapas grubości i nie biją. Jeśli tarcze są poniżej minimum — wymieniamy komplet.

Ile to kosztuje w Warszawie
W BESS MOTORS robocizna z kodem BessMotors:
• klocki przód — 100 zł (było 120 zł)
• tarcze + klocki przód — 150 zł (było 220 zł)
• klocki tył — 120 zł (było 150 zł)
Części wyceniamy osobno.

Warsztat: Aleja Krakowska 48/52, Warszawa Włochy. Pn–Sb 8:00–18:00.`,
    relatedHrefs: [
      { href: "/hamulce-warszawa", label: "Hamulce Warszawa" },
      { href: "/wymiana-klockow-hamulcowych-warszawa", label: "Wymiana klocków" },
    ],
  },
  {
    slug: "nabijanie-klimatyzacji-cena-warszawa",
    title: "Nabijanie klimatyzacji — cena Warszawa 2026",
    date: "2026-08-17",
    updatedAt: "2026-10-21",
    excerpt:
      "Nabijanie klimatyzacji w Warszawie Włochy: podłączenie 80 zł, R134a 50 zł/100 g, R1234yf 100 zł/100 g.",
    body: `Nabijanie klimatyzacji cena Warszawa — w BESS MOTORS (Włochy, Aleja Krakowska 48/52) podłączenie 80 zł, R134a 50 zł/100 g, R1234yf 100 zł/100 g.

Co znaczy „nabijanie” i czego nie obejmuje
Nabijanie to odzysk czynnika, próżnia, test szczelności i uzupełnienie oleju PAG + czynnik. Nie obejmuje naprawy nieszczelnego skraplacza ani odgrzybiania — to osobne pozycje. Jeśli układ nie trzyma próżni, najpierw szukamy wycieku.

R134a czy R1234yf?
Sprawdzamy tabliczkę pod maską i nie mieszamy gazów.

Ile trwa
Samo nabicie, gdy układ jest szczelny, to zwykle około 1 godziny przy wolnym stanowisku. Zapytaj o termin — potwierdzimy po kontakcie.

Warsztat:  Aleja Krakowska 48/52. Tel. +48 791 257 229.`,
    relatedHrefs: [
      { href: "/klimatyzacja", label: "Nabijanie klimatyzacji" },
      { href: "/serwis-klimatyzacji-warszawa", label: "Serwis klimatyzacji" },
      { href: "/sprawdzenie-szczelnosci-klimatyzacji-warszawa", label: "Szczelność klimy" },
    ],
  },
  {
    slug: "kiedy-zmieniac-opony-na-zimowe",
    title: "Kiedy zmieniać opony na zimowe w Warszawie?",
    date: "2026-10-21",
    updatedAt: "2026-10-21",
    excerpt:
      "Praktyczna reguła +7°C, ceny kompletu R13–R20 w BESS MOTORS i jak umówić wymianę opon we Włochach.",
    body: `Kiedy zmieniać opony na zimowe? W Polsce najczęściej przy temperaturach około +7°C — zwykle październik–listopad, zanim nocne przymrozki i śnieg.

Dlaczego nie czekać do pierwszego śniegu
Kolejki w wulkanizacjach rosną w pierwszy mroźny poranek. Lepiej umówić termin wcześniej i mieć spokój.

Cennik wymiany kompletu w BESS MOTORS
• R13–R17 — 200 zł
• R18 — 260 zł
• R19 — 300 zł
• R20 — 350 zł
SUV, RunFlat, niski profil, R21+ — wycena po potwierdzeniu pojazdu. Naprawa przebicia: 60 zł robocizna.

Jak umówić
Zadzwoń +48 791 257 229 albo zostaw wniosek online — potwierdzimy termin telefonicznie. Adres: Aleja Krakowska 48/52, Warszawa Włochy.`,
    relatedHrefs: [
      { href: "/wymiana-opon-warszawa", label: "Wymiana opon Warszawa" },
      { href: "/wulkanizacja-warszawa", label: "Wulkanizacja" },
      { href: "/booking", label: "Zapytaj o termin" },
    ],
  },
  {
    slug: "wymiana-rozrzadu-ile-trwa",
    title: "Ile trwa wymiana rozrządu? Co wpływa na koszt",
    date: "2026-10-21",
    updatedAt: "2026-10-21",
    excerpt:
      "Czas i zakres wymiany paska lub łańcucha rozrządu — bez obietnic „na już”. Wycena po modelu w BESS MOTORS.",
    body: `Ile trwa wymiana rozrządu? W praktyce często 1–2 dni robocze — zależy od silnika (pasek vs łańcuch), dostępu, pompy wody i dostępności części.

Co zwykle wchodzi w zakres
• ocena stanu rozrządu
• wymiana paska/łańcucha według zaleceń
• rolki, napinacz, często pompa wody — po wycenie
• części dobierane do modelu (VIN)

Cena
Robocizna jest „od” w cenniku — dokładną kwotę podajemy po sprawdzeniu auta. Materiały osobno. Nie startujemy bez akceptacji zakresu.

Gdzie
BESS MOTORS, Aleja Krakowska 48/52, Warszawa Włochy. Tel. +48 791 257 229.`,
    relatedHrefs: [
      { href: "/wymiana-rozrzadu-warszawa", label: "Wymiana rozrządu Warszawa" },
      { href: "/diagnostyka-silnika-warszawa", label: "Diagnostyka silnika" },
    ],
  },
  {
    slug: "diagnostyka-elektryki-objawy",
    title: "Problemy z elektryką w aucie — objawy i diagnostyka",
    date: "2026-10-21",
    updatedAt: "2026-10-21",
    excerpt:
      "Słaby rozruch, lampa ładowania, rozładowany akumulator — jak wygląda diagnostyka elektryki w BESS MOTORS.",
    body: `Problemy z elektryką samochodową bywają mylące: raz nie odpala, innym razem gasną światła albo pada akumulator po weekendzie.

Co sprawdzamy
• stan i pojemność akumulatora
• układ ładowania (alternator)
• rozrusznik i podstawowe obwody
• odczyt dostępnych kodów — w zakresie sprzętu warsztatu

Nie obiecujemy „pełnej diagnostyki wszystkich modułów za darmo”. Najpierw test, potem wycena naprawy.

Umów diagnostykę
Aleja Krakowska 48/52, Warszawa Włochy · +48 791 257 229.`,
    relatedHrefs: [
      { href: "/diagnostyka-elektryki-samochodowej-warszawa", label: "Diagnostyka elektryki" },
      { href: "/wymiana-akumulatora-warszawa", label: "Wymiana akumulatora" },
      { href: "/wymiana-alternatora-warszawa", label: "Wymiana alternatora" },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
