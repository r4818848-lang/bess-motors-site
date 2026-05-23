/** UTM / marketing attribution from URL → sessionStorage */

export interface MarketingAttribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingPage?: string;
  capturedAt?: string;
}

const STORAGE_KEY = "bess-motors-utm";

export function captureUtmFromUrl(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const hasUtm =
    params.has("utm_source") ||
    params.has("utm_medium") ||
    params.has("utm_campaign") ||
    params.get("gclid") ||
    params.get("fbclid");

  if (!hasUtm && !params.get("partner")) return;

  const data: MarketingAttribution = {
    utmSource:
      params.get("utm_source") ??
      params.get("partner") ??
      (params.get("gclid") ? "google_ads" : undefined) ??
      (params.get("fbclid") ? "facebook" : undefined),
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    landingPage: `${window.location.pathname}${window.location.search}`,
    capturedAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function getStoredAttribution(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MarketingAttribution;
  } catch {
    return null;
  }
}

export function formatAttributionLabel(a: MarketingAttribution | null | undefined): string {
  if (!a?.utmSource) return "—";
  const parts = [a.utmSource, a.utmMedium, a.utmCampaign].filter(Boolean);
  return parts.join(" / ");
}
