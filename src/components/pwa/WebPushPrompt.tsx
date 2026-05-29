"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { subscribeWebPush } from "@/lib/push-client";

export function WebPushPrompt({ userId }: { userId: string }) {
  const { locale } = useI18n();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (done || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return null;

  const label =
    locale === "ru" || locale === "uk"
      ? "Включить уведомления в браузере"
      : locale === "en"
        ? "Enable browser notifications"
        : "Włącz powiadomienia w przeglądarce";

  const enableBtn =
    locale === "ru" || locale === "uk"
      ? "Включить"
      : locale === "en"
        ? "Enable"
        : "Włącz";

  const click = async () => {
    setError("");
    const res = await subscribeWebPush(userId);
    if (res.ok) setDone(true);
    else if (res.reason === "denied") {
      setError(
        locale === "ru" || locale === "uk"
          ? "Разрешение отклонено"
          : locale === "pl"
            ? "Odmowa powiadomień"
            : "Permission denied"
      );
    } else if (res.reason === "no_vapid") {
      setError(
        locale === "pl"
          ? "Powiadomienia nie są skonfigurowane"
          : locale === "ru" || locale === "uk"
            ? "VAPID не настроен"
            : "VAPID not configured"
      );
    } else {
      setError(
        locale === "ru" || locale === "uk"
          ? "Не удалось"
          : locale === "pl"
            ? "Nie udało się włączyć"
            : "Failed"
      );
    }
  };

  return (
    <div className="glass rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Bell size={18} className="text-bm-red" />
        <span>{label}</span>
      </div>
      <button type="button" className="btn-outline text-xs" onClick={click}>
        {enableBtn}
      </button>
      {error && <p className="text-xs text-red-400 w-full">{error}</p>}
    </div>
  );
}
