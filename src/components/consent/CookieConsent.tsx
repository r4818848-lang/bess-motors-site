"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

const CONSENT_KEY = "bess-cookie-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function grantAnalyticsConsent(): void {
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
  }
}

export function CookieConsent() {
  const { t } = useI18n();
  const cc = t.cookieConsent;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved === "granted") {
        grantAnalyticsConsent();
        return;
      }
      if (saved !== "denied") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "granted");
    } catch {
      /* ignore */
    }
    grantAnalyticsConsent();
    setVisible(false);
  };

  const reject = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "denied");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] p-3 md:p-4 safe-area-pb"
      role="dialog"
      aria-label={cc.title}
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-bm-border/60 bg-bm-surface/95 backdrop-blur-md p-4 shadow-2xl">
        <p className="font-display text-sm uppercase text-bm-red">{cc.title}</p>
        <p className="text-sm text-bm-muted mt-2 leading-relaxed">{cc.body}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary text-xs py-2 px-4" onClick={accept}>
            {cc.accept}
          </button>
          <button type="button" className="btn-outline text-xs py-2 px-4" onClick={reject}>
            {cc.reject}
          </button>
          <Link href="/privacy" className="text-xs text-bm-muted hover:text-bm-red self-center px-2">
            {cc.privacyLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
