type GtagFn = (...args: unknown[]) => void;

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  return typeof window.gtag === "function" ? (window.gtag as GtagFn) : null;
}

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

/** Business conversions we care about */
export function trackLead(kind: "booking" | "call_request", meta?: Record<string, unknown>): void {
  fireGtag("generate_lead", { lead_type: kind, ...meta });
}

