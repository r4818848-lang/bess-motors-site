/**
 * Retired. Copying Meta event names into GA4 counted one click twice
 * (`Contact` plus `click_phone`, `Lead` plus the thank-you event).
 * Named events live in `src/lib/gtag.ts`. Meta still uses MetaClickTracker.
 */
export function GoogleClickTracker() {
  return null;
}
