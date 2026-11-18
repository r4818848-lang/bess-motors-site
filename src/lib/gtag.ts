import { analyticsConsentGranted } from "@/lib/analytics-consent";

type GtagFn = (...args: unknown[]) => void;

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  return typeof window.gtag === "function" ? (window.gtag as GtagFn) : null;
}

const BLOCKED_PARAM = /^(phone|email|e-mail|name|clientname|firstname|lastname|vin|plate|comment|token|address)$/i;

/** Drop anything that could identify a client. Analytics receives the event name and a page source only. */
export function publicAnalyticsParams(params?: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (BLOCKED_PARAM.test(key)) continue;
    if (typeof value === "string" && (/@/.test(value) || /\d{7,}/.test(value))) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    }
  }
  return safe;
}

/** Safe params only — never pass VIN, phone, name, email, or free-text repair notes. */
/**
 * The Google Ads send_to field is an account/label routing key, not personal
 * data. The generic PII scrubber intentionally strips long digit strings,
 * so restore only a strictly valid AW-.../label value for conversion events.
 * Never allow client-provided text, phone numbers or VINs through this escape.
 */
export function safeGtagEventParams(event: string, params?: Record<string, unknown>): Record<string, unknown> {
  const safe = publicAnalyticsParams(params);
  if (event === "conversion") {
    const destination = params?.send_to;
    if (typeof destination === "string" && /^AW-\\d{6,15}\\/[A-Za-z0-9_-]{2,}$/.test(destination)) {
      safe.send_to = destination;
    }
  }
  return safe;
}

export function fireGtag(event: string, params?: Record<string, unknown>): void {
  if (!analyticsConsentGranted()) return;
  const gtag = getGtag();
  if (!gtag) return;
  const safe = safeGtagEventParams(event, params);
  // An Ads conversion without a valid destination can never be attributed.
  if (event === "conversion" && !safe.send_to) return;
  try {
    gtag("event", event, safe);
  } catch {
    /* ignore */
  }
}

/** GA4 SPA navigation page_view */
export function fireGaPageView(pathname: string): void {
  fireGtag("page_view", { page_path: pathname });
}

/** Named conversion events (KPI_TRACKING.md) — no PII */
export function trackClickPhone(source?: string): void {
  fireGtag("click_phone", source ? { content_name: source } : undefined);
}

export function trackBookingOpen(source?: string): void {
  fireGtag("booking_open", source ? { content_name: source } : undefined);
}

export function trackClickWhatsapp(source?: string): void {
  fireGtag("click_whatsapp", source ? { content_name: source } : undefined);
}

export function trackGetDirectionsClick(source?: string): void {
  fireGtag("get_directions_click", source ? { content_name: source } : undefined);
}

export function trackCallbackSubmitSuccess(source?: string): void {
  fireGtag("callback_submit_success", source ? { content_name: source } : undefined);
}

export function trackVinQuoteSubmitSuccess(): void {
  fireGtag("vin_quote_submit_success");
}

export function trackBookingRequestSubmitSuccess(source?: string): void {
  fireGtag("booking_request_submit_success", source ? { content_name: source } : undefined);
}

/**
 * One named GA4 event per action.
 * `generate_lead` is not sent as well: two key events for one form would double-count.
 * A visit that also opens the thank-you page is counted there, not here.
 */
export function trackLead(kind: "booking" | "call_request", meta?: Record<string, unknown>): void {
  if (kind === "booking") {
    trackBookingRequestSubmitSuccess(
      typeof meta?.source === "string" ? meta.source : undefined
    );
  } else if (meta?.lead_source === "vin_quote" || meta?.source === "vin_quote") {
    trackVinQuoteSubmitSuccess();
  } else {
    trackCallbackSubmitSuccess(
      typeof meta?.source === "string"
        ? meta.source
        : typeof meta?.lead_source === "string"
          ? meta.lead_source
          : undefined
    );
  }
}
