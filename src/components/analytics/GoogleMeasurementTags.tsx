import Script from "next/script";
import { GOOGLE_ADS_ID } from "@/lib/google-ads";

/**
 * One direct gtag.js bootstrap for GA4 and Google Ads.
 * GTM is a separate existing marketing container; leave its tags untouched.
 * This reduces duplicate script loads without changing conversion labels.
 */
const candidate = process.env.NEXT_PUBLIC_GA4_ID?.trim();
const GA4_ID = candidate && /^G-[A-Za-z0-9]+$/.test(candidate) ? candidate : null;
const SCRIPT_ID = GA4_ID ?? GOOGLE_ADS_ID;

export function GoogleMeasurementTags() {
  return (
    <>
      <Script
        id="bess-google-gtag-loader"
        src={\`https://www.googletagmanager.com/gtag/js?id=\${SCRIPT_ID}\`}
        strategy="afterInteractive"
      />
      <Script id="bess-google-gtag-config" strategy="afterInteractive">
        {\`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
          gtag('js', new Date());
          \${GA4_ID ? \`gtag('config', '\${GA4_ID}');\` : ""}
          gtag('config', '\${GOOGLE_ADS_ID}');
        \`}
      </Script>
    </>
  );
}
