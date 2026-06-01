export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "kiedy-wymienic-olej",
    title: "Kiedy wymienić olej w silniku?",
    date: "2026-05-01",
    excerpt: "Interwały serwisowe i objawy zużytego oleju.",
    body:
      "Zalecamy wymianę oleju co 10–15 tys. km lub raz w roku. Ciemny dym, stuki przy starcie i podwyższony poziom oleju to sygnały, że warto umówić wizytę w BESS MOTORS.",
  },
  {
    slug: "check-engine-co-robic",
    title: "Check Engine — co robić?",
    date: "2026-05-10",
    excerpt: "Kontrolka silnika nie zawsze oznacza awarię.",
    body:
      "Najpierw sprawdź korek wlewu paliwa. Jeśli lampka miga — nie jedź dalej. Umów diagnostykę komputerową — odczytamy błędy i podamy koszt naprawy.",
  },
  {
    slug: "program-polecen",
    title: "Program poleceń BESS MOTORS",
    date: "2026-05-20",
    excerpt: "Poleć znajomego i odbierz rabat.",
    body:
      "Każdy klient ma link polecający w kabinecie i Telegramie. Po pierwszej opłaconej wizycie znajomego odblokujesz nagrodę — szczegóły na stronie /referral.",
  },
  {
    slug: "geometria-kol-kiedy",
    title: "Kiedy robić geometrię kół?",
    date: "2026-05-22",
    excerpt: "Objawy złej zbieżności i zużycia opon.",
    body:
      "Auto ściąga na bok, nierównomierne zużycie bieżnika lub po wymianie zawieszenia — to sygnał do ustawienia geometrii. W BESS MOTORS wykonujemy pomiar i korektę zbieżności na nowoczesnym stanowisku. Umów wizytę online — zwykle 1–2 godziny.",
  },
  {
    slug: "serwis-klimatyzacji-porady",
    title: "Serwis klimatyzacji — kiedy i dlaczego?",
    date: "2026-05-24",
    excerpt: "Nabijanie, odgrzybianie i diagnostyka klimy.",
    body:
      "Słaba chłodziwość, zapach pleśni lub wilgoć na szybie to powody wizyty w serwisie klimatyzacji. Co 1–2 lata warto sprawdzić szczelność i doładować czynnik. Oferujemy diagnostykę, napełnianie i odgrzybianie w BESS MOTORS Warszawa.",
  },
  {
    slug: "wulkanizacja-sezonowa",
    title: "Wymiana opon — kiedy zmieniać sezon?",
    date: "2026-05-26",
    excerpt: "Terminy wymiany letnia / zima w Polsce.",
    body:
      "W Polsce większość kierowców zmienia opony przy +7°C — zazwyczaj marzec–kwiecień (lato) i październik–listopad (zima). W BESS MOTORS: montaż, wyważanie, naprawa opon i przechowanie. Rezerwacja online skraca czas oczekiwania.",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
