"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { locales, localeNames, type Locale } from "@/lib/i18n/types";
import { clsx } from "clsx";

/** Compact language dropdown — PL ▾ (TZ §7) */
export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className={clsx("relative", compact && "text-xs")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-bm-card px-2.5 py-2 min-h-[40px] text-bm-silver hover:text-white hover:border-white/20 transition-colors uppercase font-semibold tracking-wide"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={localeNames[locale]}
      >
        {locale}
        <ChevronDown size={14} className={clsx("opacity-70 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-[60] mt-1 min-w-[9rem] overflow-hidden rounded-xl border border-white/10 bg-bm-card shadow-lg"
        >
          {locales.map((l) => (
            <li key={l} role="option" aria-selected={locale === l}>
              <button
                type="button"
                className={clsx(
                  "w-full px-3 py-2.5 text-left text-sm transition-colors",
                  locale === l
                    ? "bg-white/10 text-white"
                    : "text-bm-silver hover:bg-white/5 hover:text-white"
                )}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
              >
                <span className="uppercase font-semibold mr-2">{l}</span>
                <span className="text-bm-muted">{localeNames[l]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
