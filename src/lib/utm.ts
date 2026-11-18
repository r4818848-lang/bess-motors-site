/** Campaign attribution from public landing URL → sessionStorage → CRM.
 * Store campaign labels only, never click IDs, raw query strings, or client PII.
 */

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
const SITE_ORIGIN = "https://www.bess-motors.com";

/** Accept plain marketing tokens only: no phone, VIN, email, free-text or click IDs. */
function safeCampaignToken(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const token = value.trim();
  if (!/^[A-Za-z][A-Za-z0-9._+-]{0,63}$/.test(token)) return undefined;
  if (/\d{7,}/.test(token)) return undefined;
  return token;
}

/** Only the onsite pathname is needed. Query strings might contain client details. */
export function safeLandingPath(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim() || value.length > 2048) return undefined;
  try {
    const url = new URL(value.trim(), SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return undefined;
    return url.pathname.length <= 180 && url.pathname.startsWith("/") && !url.pathname.startsWith("//")
      ? url.pathname
      : undefined;
  } catch {
    return undefined;
  }
}

/** Validate untrusted client-supplied marketing labels before saving to the cloud CRM. */
export function normalizeMarketingAttribution(value: unknown): MarketingAttribution | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const utmSource = safeCampaignToken(v.utmSource);
  if (!utmSource) return null;
  const out: MarketingAttribution = {
    utmSource,
    utmMedium: safeCampaignToken(v.utmMedium),
    utmCampaign: safeCampaignToken(v.utmCampaign),
    utmContent: safeCampaignToken(v.utmContent),
    utmTerm: safeCampaignToken(v.utmTerm),
    landingPage: safeLandingPath(v.landingPage),
  };
  return out;
}

/** Recognize only known AI assistant domains; never store the full referrer URL. */
export function classifyAiReferral(referrer: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const sources: Record<string, string> = {
      "chatgpt.com": "chatgpt",
      "chat.openai.com": "chatgpt",
      "perplexity.ai": "perplexity",
      "gemini.google.com": "gemini",
      "claude.ai": "claude",
      "copilot.microsoft.com": "copilot",
    };
    return sources[host] ?? null;
  } catch {
    return null;
  }
}

export function captureUtmFromUrl(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const hasUtm =
    params.has("utm_source") ||
    params.has("utm_medium") ||
    params.has("utm_campaign") ||
    params.get("gclid") ||
    params.get("fbclid");
  const aiReferral = !hasUtm && !params.get("partner")
    ? classifyAiReferral(document.referrer)
    : null;
  if (!hasUtm && !params.get("partner") && !aiReferral) return;

  const data = normalizeMarketingAttribution({
    utmSource:
      params.get("utm_source") ??
      params.get("partner") ??
      (params.get("gclid") ? "google_ads" : undefined) ??
      (params.get("fbclid") ? "facebook" : undefined) ??
      aiReferral,
    utmMedium: params.get("utm_medium") ?? (aiReferral ? "referral" : undefined),
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    landingPage: window.location.pathname,
  });
  if (!data) return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, capturedAt: new Date().toISOString() }));
  } catch {
    /* Session storage may be unavailable; the form still works. */
  }
}

export function getStoredAttribution(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeMarketingAttribution(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function formatAttributionLabel(a: MarketingAttribution | null | undefined): string {
  if (!a?.utmSource) return "—";
  const parts = [a.utmSource, a.utmMedium, a.utmCampaign].filter(Boolean);
  return parts.join(" / ");
}
