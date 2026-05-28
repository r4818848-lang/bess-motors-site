"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { UtmCapture } from "@/components/marketing/UtmCapture";
import { MetaClickTracker } from "@/components/analytics/MetaClickTracker";
import { GoogleClickTracker } from "@/components/analytics/GoogleClickTracker";
import { AuthSessionProvider } from "@/lib/auth/session-context";
import { PwaRegister } from "@/components/PwaRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthSessionProvider>
        <PwaRegister />
        <UtmCapture />
        <MetaClickTracker />
        <GoogleClickTracker />
        {children}
      </AuthSessionProvider>
    </I18nProvider>
  );
}
