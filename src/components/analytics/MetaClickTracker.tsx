"use client";

import { useEffect } from "react";
import { fireFbq, installMetaPixelDebug } from "@/lib/meta-pixel";

/**
 * Capture-phase clicks on [data-fbq-track] — same effect as onclick="fbq('track', …)".
 * Works even if React handlers fail; runs before tel:/navigation.
 */
export function MetaClickTracker() {
  useEffect(() => {
    installMetaPixelDebug();

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
      fireFbq(event, params);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
