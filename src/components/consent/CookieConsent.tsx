"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ANALYTICS_CONSENT_EVENT, ANALYTICS_CONSENT_KEY, readAnalyticsConsent } from "@/lib/analytics-consent";
import { getTranslations } from "@/lib/i18n/translations";
import type { Locale } from "@/lib/i18n/types";

const CONSENT_LOCALES: Locale[] = ["pl", "en", "ru", "uk"];

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

function ConsentText({ field }: { field: "title" | "body" | "requiredHint" | "accept" | "reject" | "privacyLink" }) {
  return (
    <>
      {CONSENT_LOCALES.map((locale) => (
        <span key={locale} data-cc={locale}>
          {getTranslations(locale).cookieConsent[field]}
        </span>
      ))}
    </>
  );
}

export function CookieConsent() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const saved = readAnalyticsConsent();
    if (saved === "granted") {
      publishConsent("granted");
      setVisible(false);
      return;
    }
    if (saved === "denied") {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!visible || readAnalyticsConsent() !== "unknown") return;
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
      data-cookie-dialog
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-bm-red/40 bg-bm-surface p-6 md:p-8 shadow-2xl">
        <p id="cookie-consent-title" className="font-display text-lg uppercase text-bm-red">
          <ConsentText field="title" />
        </p>
        <p className="text-sm text-bm-muted mt-3 leading-relaxed min-h-[4.75rem]">
          <ConsentText field="body" />
        </p>
        <p className="text-xs text-bm-muted/80 mt-2">
          <ConsentText field="requiredHint" />
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button type="button" className="btn-primary flex-1 py-3" onClick={accept}>
            <ConsentText field="accept" />
          </button>
          <button type="button" className="btn-outline flex-1 py-3" onClick={reject}>
            <ConsentText field="reject" />
          </button>
        </div>
        <Link
          href="/privacy"
          className="block text-center text-xs text-bm-muted hover:text-bm-red mt-4"
        >
          <ConsentText field="privacyLink" />
        </Link>
      </div>
    </div>
  );
}
