"use client";

import { useI18n } from "@/lib/i18n/context";
import { locales, localeNames, type Locale } from "@/lib/i18n/types";
import { clsx } from "clsx";

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={clsx(
        "flex gap-1 rounded-lg border border-bm-border bg-bm-graphite/80 p-1",
        compact && "text-xs"
      )}
    >
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={clsx(
            "rounded-md px-2 py-1 font-medium uppercase transition-all",
            locale === l
              ? "bg-bm-red text-white shadow-neon-sm"
              : "text-bm-muted hover:text-white"
          )}
          aria-label={localeNames[l]}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
