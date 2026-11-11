/** Optional analytics and ads cookies. The value is only "granted" or "denied". */
export const ANALYTICS_CONSENT_KEY = "bess-cookie-consent";

export const ANALYTICS_CONSENT_EVENT = "bess-cookie-consent-change";

export type AnalyticsConsent = "granted" | "denied" | "unknown";

type ConsentStorage = { getItem(key: string): string | null };

export function readAnalyticsConsent(storage?: ConsentStorage | null): AnalyticsConsent {
  const store = storage ?? (typeof localStorage === "undefined" ? null : localStorage);
  if (!store) return "unknown";
  try {
    const value = store.getItem(ANALYTICS_CONSENT_KEY);
    if (value === "granted" || value === "denied") return value;
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function analyticsConsentGranted(storage?: ConsentStorage | null): boolean {
  return readAnalyticsConsent(storage) === "granted";
}
