"use client";

import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import type { DocLocale } from "@/lib/work-order-locale";

const LOCALES: DocLocale[] = ["pl", "ru", "en"];

interface Props {
  value: DocLocale;
  onChange: (locale: DocLocale) => void;
  compact?: boolean;
  className?: string;
}

export function DocumentLocalePicker({ value, onChange, compact, className = "" }: Props) {
  const { t } = useI18n();
  const d = t.document;
  const labels: Record<DocLocale, string> = {
    pl: d.langPl,
    ru: d.langRu,
    en: d.langEn,
  };

  return (
    <div className={clsx("flex flex-wrap items-center gap-2", className)}>
      {!compact && (
        <span className="text-[10px] uppercase tracking-widest text-bm-muted shrink-0">
          {d.docLanguage}
        </span>
      )}
      <div className="inline-flex rounded-lg border border-bm-border/80 bg-bm-black/40 p-0.5">
        {LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            title={labels[loc]}
            onClick={() => onChange(loc)}
            className={clsx(
              "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all",
              value === loc
                ? "bg-bm-red/25 text-bm-red border border-bm-red/50 shadow-neon-sm"
                : "text-bm-muted hover:text-white border border-transparent"
            )}
          >
            {labels[loc]}
          </button>
        ))}
      </div>
    </div>
  );
}
