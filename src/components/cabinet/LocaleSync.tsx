"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { siteLocaleFromTelegram } from "@/lib/locale-sync";

export function LocaleSync({ userId }: { userId: string }) {
  const { setLocale } = useI18n();

  useEffect(() => {
    const user = loadDb().users.find((u) => u.id === userId);
    const mapped = siteLocaleFromTelegram(user?.telegramLocale);
    if (mapped) setLocale(mapped);
  }, [userId, setLocale]);

  return null;
}
