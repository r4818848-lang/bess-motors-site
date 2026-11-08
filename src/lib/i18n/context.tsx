"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Locale } from "./types";
import { getTranslations, type TranslationKeys } from "./translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LOCALES: Locale[] = ["pl", "ru", "en", "uk"];

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("bess-locale") as Locale | null;
  return saved && LOCALES.includes(saved) ? saved : null;
}

function browserLocale(): Locale {
  const code = (navigator.languages?.[0] || navigator.language || "").toLowerCase();
  if (code.startsWith("ru")) return "ru";
  if (code.startsWith("uk") || code.startsWith("ua")) return "uk";
  if (code.startsWith("en")) return "en";
  return "pl";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pl");

  useEffect(() => {
    const next = readStoredLocale() ?? browserLocale();
    setLocaleState(next);
    document.documentElement.lang = next;
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("bess-locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = getTranslations(locale);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
