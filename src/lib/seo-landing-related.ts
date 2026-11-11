import { getSeoLandingPage, seoLandingPages } from "@/lib/seo-landing-pages";
import { EXTRA_SEO_RELATED } from "@/lib/seo-extra-service-pages";
import { pendingNoIndexSlugs } from "@/lib/seo";

export type RelatedLandingLink = {
  slug: string;
  title: string;
};

/** Internal links for SEO — related services per landing slug */
const RELATED_SLUGS: Record<string, string[]> = {
  ...EXTRA_SEO_RELATED,
  diagnostyka: ["check-engine", "elektryka", "silnik", "wymiana-oleju", "hamulce"],
  zawieszenie: ["hamulce", "opony", "diagnostyka", "silnik", "wymiana-oleju"],
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
  przeglad: ["wymiana-oleju", "hamulce", "diagnostyka", "opony", "zawieszenie"],
  opony: [
    "wulkanizacja-warszawa",
    "wymiana-opon-warszawa",
    "sezonowa-wymiana-opon-warszawa",
    "naprawa-opon-warszawa",
    "wywazanie-kol-warszawa",
  ],
  bmw: [
    "wymiana-opon-bmw-7-g70-warszawa",
    "wymiana-opon-bmw-x3-warszawa",
    "wymiana-klockow-hamulcowych-bmw-warszawa",
    "diagnostyka",
    "wymiana-oleju",
    "hamulce",
  ],
  mercedes: [
    "wymiana-opon-mercedes-warszawa",
    "wymiana-klockow-hamulcowych-mercedes-warszawa",
    "diagnostyka",
    "wymiana-oleju",
    "hamulce",
  ],
  vag: ["serwis-audi", "wymiana-opon-audi-q5-warszawa", "diagnostyka", "wymiana-oleju", "zawieszenie"],
  kontakt: ["diagnostyka", "wymiana-oleju", "warszawa-wlochy", "hamulce", "opony"],
  "warszawa-wlochy": ["wulkanizacja-warszawa", "warszawa-ursynow", "diagnostyka", "opony", "wymiana-oleju"],
  "warszawa-ursynow": ["wulkanizacja-warszawa", "warszawa-wlochy", "warszawa-mokotow", "diagnostyka", "wymiana-opon-warszawa"],
  "warszawa-mokotow": ["wulkanizacja-warszawa", "warszawa-wlochy", "warszawa-ochota", "wymiana-opon-warszawa", "diagnostyka"],
  "warszawa-ochota": ["wulkanizacja-warszawa", "warszawa-wlochy", "warszawa-mokotow", "wymiana-opon-warszawa", "wymiana-oleju"],
  "serwis-audi": [
    "wymiana-opon-audi-q5-warszawa",
    "wymiana-klockow-hamulcowych-audi-q5-warszawa",
    "vag",
    "diagnostyka",
    "wymiana-oleju",
  ],
  "serwis-toyota": ["wymiana-oleju", "diagnostyka", "hamulce", "przeglad", "opony"],
  "serwis-opel": ["diagnostyka", "wymiana-oleju", "zawieszenie", "hamulce", "vag"],
  "serwis-ford": ["diagnostyka", "wymiana-oleju", "silnik", "hamulce", "check-engine"],
  "serwis-renault": ["diagnostyka", "wymiana-oleju", "klimatyzacja", "hamulce", "zawieszenie"],
  "serwis-peugeot": ["diagnostyka", "silnik", "hamulce", "wymiana-oleju", "vag"],
  "check-engine": ["diagnostyka", "elektryka", "silnik", "wymiana-oleju", "serwis-ford"],
  "chip-tuning-warszawa": ["diagnostyka", "silnik", "bmw", "vag", "promocje"],
  promocje: ["wymiana-oleju", "diagnostyka", "opony", "hamulce", "klimatyzacja"],
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
      if (!page || page.noIndex || pendingNoIndexSlugs.has(s)) return null;
      return { slug: s, title: page.title };
    })
    .filter((x): x is RelatedLandingLink => x !== null)
    .slice(0, 6);
}

/** All landing paths for sitemap / audits */
export function allLandingPaths(): string[] {
  return seoLandingPages.map((p) => `/${p.slug}`);
}
