/** Short “call back in 5 minutes” form — oil / brakes / A/C / tyre-ad landings */
export const CALLBACK_LANDING_SLUGS = new Set([
  "wymiana-oleju",
  "hamulce",
  "klocki-hamulcowe",
  "klimatyzacja",
  "naprawa-klimatyzacji",
  "serwis-klimatyzacji",
  "sezonowa-wymiana-opon-warszawa",
  "wulkanizacja-warszawa",
  "wymiana-opon-warszawa",
]);

export function isCallbackLandingSlug(slug: string): boolean {
  return CALLBACK_LANDING_SLUGS.has(slug);
}
