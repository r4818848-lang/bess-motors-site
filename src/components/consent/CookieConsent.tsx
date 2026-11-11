"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { ANALYTICS_CONSENT_EVENT, ANALYTICS_CONSENT_KEY } from "@/lib/analytics-consent";

const CONSENT_KEY = ANALYTICS_CONSENT_KEY;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function publishConsent(value: "granted" | "denied"): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  if (value === "granted" && typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
  }
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
}

export function CookieConsent() {
  const { t } = useI18n();
  const cc = t.cookieConsent;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved === "granted") {
        publishConsent("granted");
        return;
      }
      if (saved !== "denied") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const accept = () => {
    publishConsent("granted");
    setVisible(false);
  };

  const reject = () => {
    publishConsent("denied");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={cc.title}
    >
      <div className="w-full max-w-lg rounded-2xl border border-bm-red/40 bg-bm-surface p-6 md:p-8 shadow-2xl">
        <p className="font-display text-lg uppercase text-bm-red">{cc.title}</p>
        <p className="text-sm text-bm-muted mt-3 leading-relaxed">{cc.body}</p>
        <p className="text-xs text-bm-muted/80 mt-2">{cc.requiredHint}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button type="button" className="btn-primary flex-1 py-3" onClick={accept}>
            {cc.accept}
          </button>
          <button type="button" className="btn-outline flex-1 py-3" onClick={reject}>
            {cc.reject}
          </button>
        </div>
        <Link
          href="/privacy"
          className="block text-center text-xs text-bm-muted hover:text-bm-red mt-4"
        >
          {cc.privacyLink}
        </Link>
      </div>
    </div>
  );
}
