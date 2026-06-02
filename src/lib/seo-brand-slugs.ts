/** SEO landing URLs focused on a car brand — not dealership pages */
export const BRAND_SEO_LANDING_SLUGS = new Set([
  "bmw",
  "mercedes",
  "vag",
  "serwis-audi",
  "serwis-toyota",
  "serwis-opel",
  "serwis-ford",
  "serwis-renault",
  "serwis-peugeot",
]);

export function isBrandSeoLandingSlug(slug: string): boolean {
  return BRAND_SEO_LANDING_SLUGS.has(slug);
}
