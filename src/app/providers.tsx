"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { UtmCapture } from "@/components/marketing/UtmCapture";
import { AuthSessionProvider } from "@/lib/auth/session-context";
import { ClientNotificationWatcher } from "@/components/cabinet/ClientNotificationWatcher";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthSessionProvider>
        <ClientNotificationWatcher />
        <UtmCapture />
        {children}
      </AuthSessionProvider>
    </I18nProvider>
  );
}
