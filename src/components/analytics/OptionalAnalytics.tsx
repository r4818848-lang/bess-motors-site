"use client";

import { useEffect, useState } from "react";
import { GoogleAdsTag } from "@/components/analytics/GoogleAdsTag";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { GoogleTagManagerBody, GoogleTagManagerHead } from "@/components/analytics/GoogleTagManager";
import { YandexMetrika } from "@/components/analytics/YandexMetrika";
import { ANALYTICS_CONSENT_EVENT, analyticsConsentGranted } from "@/lib/analytics-consent";
import { META_PIXEL_ID, metaPixelInitScript } from "@/lib/meta-pixel";

/**
 * Optional statistics and ads tags. They stay unloaded until the visitor
 * accepts analytics cookies. The consent default in the document head remains denied.
 */
export function OptionalAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setEnabled(analyticsConsentGranted());
    sync();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <YandexMetrika />
      <GoogleTagManagerHead />
      <GoogleTagManagerBody />
      <GoogleAdsTag />
      <GoogleAnalytics />
      {META_PIXEL_ID ? (
        <script dangerouslySetInnerHTML={{ __html: metaPixelInitScript(META_PIXEL_ID) }} />
      ) : null}
    </>
  );
}
