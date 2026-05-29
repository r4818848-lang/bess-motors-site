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
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
