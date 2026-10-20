type GtagFn = (...args: unknown[]) => void;

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  return typeof window.gtag === "function" ? (window.gtag as GtagFn) : null;
}

/** Safe params only — never pass VIN, phone, name, email, or free-text repair notes */
export function fireGtag(event: string, params?: Record<string, unknown>): void {
  const gtag = getGtag();
  if (!gtag) return;
  try {
    gtag("event", event, params ?? {});
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

/** Business conversions we care about (legacy + named) */
export function trackLead(kind: "booking" | "call_request", meta?: Record<string, unknown>): void {
  fireGtag("generate_lead", { lead_type: kind, ...meta });
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
