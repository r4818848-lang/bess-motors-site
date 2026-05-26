"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { UtmCapture } from "@/components/marketing/UtmCapture";
import { MetaClickTracker } from "@/components/analytics/MetaClickTracker";
import { AuthSessionProvider } from "@/lib/auth/session-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthSessionProvider>
        <UtmCapture />
        <MetaClickTracker />
        {children}
      </AuthSessionProvider>
    </I18nProvider>
  );
}
