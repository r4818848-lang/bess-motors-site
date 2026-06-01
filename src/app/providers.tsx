"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { UtmCapture } from "@/components/marketing/UtmCapture";
import { ReferralCapture } from "@/components/marketing/ReferralCapture";
import { MetaClickTracker } from "@/components/analytics/MetaClickTracker";
import { GoogleClickTracker } from "@/components/analytics/GoogleClickTracker";
import { AuthSessionProvider } from "@/lib/auth/session-context";
import { PwaRegister } from "@/components/PwaRegister";
import { CookieConsent } from "@/components/consent/CookieConsent";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthSessionProvider>
        <PwaRegister />
        <CookieConsent />
        <UtmCapture />
        <ReferralCapture />
        <MetaClickTracker />
        <GoogleClickTracker />
        {children}
      </AuthSessionProvider>
    </I18nProvider>
  );
}
