/** Google Analytics / Ads gtag.js (loaded via Script in layout) */
interface Window {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
}
