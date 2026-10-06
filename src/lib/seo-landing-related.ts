import { getSeoLandingPage, seoLandingPages } from "@/lib/seo-landing-pages";
import { EXTRA_SEO_RELATED } from "@/lib/seo-extra-service-pages";

export type RelatedLandingLink = {
  slug: string;
  title: string;
};

/** Internal links for SEO — related services per landing slug */
const RELATED_SLUGS: Record<string, string[]> = {
  ...EXTRA_SEO_RELATED,
  diagnostyka: ["check-engine", "elektryka", "silnik", "wymiana-oleju", "hamulce"],
  zawieszenie: ["geometria", "hamulce", "opony", "diagnostyka", "silnik"],
  "wymiana-oleju": ["przeglad", "diagnostyka", "hamulce", "opony", "serwis-toyota"],
  hamulce: [
    "hamulce-warszawa",
    "wymiana-klockow-hamulcowych-warszawa",
    "wymiana-tarcz-hamulcowych-warszawa",
    "wymiana-plynu-hamulcowego-warszawa",
    "zawieszenie",
  ],
  klimatyzacja: ["naprawa-klimatyzacji", "diagnostyka", "elektryka", "przeglad", "wymiana-oleju"],
  "naprawa-klimatyzacji": ["klimatyzacja", "diagnostyka", "elektryka", "przeglad", "wymiana-oleju"],
  geometria: ["zawieszenie", "opony", "hamulce", "diagnostyka", "wymiana-oleju"],
  silnik: ["diagnostyka", "check-engine", "wymiana-oleju", "elektryka", "zawieszenie"],
  elektryka: ["diagnostyka", "check-engine", "klimatyzacja", "silnik", "bmw"],
  przeglad: ["wymiana-oleju", "hamulce", "diagnostyka", "geometria", "opony"],
  opony: [
    "wulkanizacja-warszawa",
    "wymiana-opon-warszawa",
    "wywazanie-kol-warszawa",
    "naprawa-opon-warszawa",
    "geometria",
  ],
  bmw: ["diagnostyka", "wymiana-oleju", "hamulce", "chip-tuning-warszawa", "serwis-audi"],
  mercedes: ["diagnostyka", "wymiana-oleju", "klimatyzacja", "hamulce", "vag"],
  vag: ["serwis-audi", "diagnostyka", "wymiana-oleju", "geometria", "chip-tuning-warszawa"],
  kontakt: ["diagnostyka", "wymiana-oleju", "warszawa-wlochy", "hamulce", "opony"],
  "warszawa-wlochy": ["warszawa-ursynow", "diagnostyka", "opony", "klimatyzacja", "wymiana-oleju"],
  "warszawa-ursynow": ["warszawa-wlochy", "warszawa-mokotow", "diagnostyka", "hamulce", "klimatyzacja"],
  "warszawa-mokotow": ["warszawa-wlochy", "warszawa-ursynow", "warszawa-ochota", "opony", "diagnostyka"],
  "warszawa-ochota": ["warszawa-wlochy", "warszawa-mokotow", "hamulce", "klimatyzacja", "wymiana-oleju"],
  "serwis-audi": ["vag", "diagnostyka", "geometria", "wymiana-oleju", "chip-tuning-warszawa"],
  "serwis-toyota": ["wymiana-oleju", "diagnostyka", "hamulce", "przeglad", "opony"],
  "serwis-opel": ["diagnostyka", "wymiana-oleju", "zawieszenie", "hamulce", "vag"],
  "serwis-ford": ["diagnostyka", "wymiana-oleju", "silnik", "hamulce", "check-engine"],
  "serwis-renault": ["diagnostyka", "wymiana-oleju", "klimatyzacja", "hamulce", "zawieszenie"],
  "serwis-peugeot": ["diagnostyka", "silnik", "hamulce", "wymiana-oleju", "vag"],
  "check-engine": ["diagnostyka", "elektryka", "silnik", "wymiana-oleju", "serwis-ford"],
  "chip-tuning-warszawa": ["diagnostyka", "silnik", "bmw", "vag", "promocje"],
  promocje: ["wymiana-oleju", "diagnostyka", "opony", "hamulce", "chip-tuning-warszawa"],
};

const DEFAULT_RELATED = [
  "diagnostyka",
  "wymiana-oleju",
  "hamulce",
  "opony",
  "klimatyzacja",
];

export function getRelatedLandingLinks(slug: string): RelatedLandingLink[] {
  const related = RELATED_SLUGS[slug] ?? DEFAULT_RELATED;
  return related
    .filter((s) => s !== slug)
    .map((s) => {
      const page = getSeoLandingPage(s);
      if (!page) return null;
      return { slug: s, title: page.title };
    })
    .filter((x): x is RelatedLandingLink => x !== null)
    .slice(0, 6);
}

/** All landing paths for sitemap / audits */
export function allLandingPaths(): string[] {
  return seoLandingPages.map((p) => `/${p.slug}`);
}
