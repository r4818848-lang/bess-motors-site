"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { UtmCapture } from "@/components/marketing/UtmCapture";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <UtmCapture />
      {children}
    </I18nProvider>
  );
}
