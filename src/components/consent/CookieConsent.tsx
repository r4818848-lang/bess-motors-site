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

function ConsentText({ field }: { field: "title" | "body" | "accept" | "reject" | "privacyLink" }) {
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
    <section
      data-cookie-dialog
      className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[80] max-w-sm rounded-2xl border border-white/25 bg-[#141820] p-3.5 shadow-xl sm:p-4 md:bottom-4 md:left-4 md:right-auto"
      aria-labelledby="cookie-consent-title"
    >
      <p id="cookie-consent-title" className="text-sm font-semibold text-white">
        <ConsentText field="title" />
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-200">
        <ConsentText field="body" />
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" className="btn-outline min-h-10 px-2 text-xs font-semibold" onClick={accept}>
          <ConsentText field="accept" />
        </button>
        <button type="button" className="btn-outline min-h-10 px-2 text-xs font-semibold" onClick={reject}>
          <ConsentText field="reject" />
        </button>
      </div>
      <Link href="/privacy" className="mt-2 inline-flex text-xs text-slate-300 underline underline-offset-2">
        <ConsentText field="privacyLink" />
      </Link>
    </section>
  );
}
