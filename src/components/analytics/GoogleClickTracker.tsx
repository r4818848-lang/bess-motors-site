"use client";

import { useEffect } from "react";
import { fireGtag } from "@/lib/gtag";

/**
 * Capture-phase clicks on [data-fbq-track] and mirror them to GA4 as events.
 * This keeps Meta + GA4 event names aligned for key conversion buttons.
 */
export function GoogleClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-fbq-track]");
      if (!el) return;
      const event = el.getAttribute("data-fbq-track");
      if (!event) return;
      const raw = el.getAttribute("data-fbq-params");
      let params: Record<string, unknown> | undefined;
      if (raw) {
        try {
          params = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          params = undefined;
        }
      }
      fireGtag(event, params);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

