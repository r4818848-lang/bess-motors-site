/** Short “call back in 5 minutes” form — oil / brakes / A/C landings */
export const CALLBACK_LANDING_SLUGS = new Set([
  "wymiana-oleju",
  "hamulce",
  "klocki-hamulcowe",
  "klimatyzacja",
  "naprawa-klimatyzacji",
  "serwis-klimatyzacji",
]);

export function isCallbackLandingSlug(slug: string): boolean {
  return CALLBACK_LANDING_SLUGS.has(slug);
}
