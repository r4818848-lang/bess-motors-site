"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

export function PwaInstallHint() {
  const { locale } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("bm-pwa-hint-dismissed")) return;
    setShow(true);
  }, []);

  if (!show) return null;

  const text =
    locale === "ru" || locale === "uk"
      ? "Добавьте сайт на главный экран — быстрый доступ к записи и прайсу офлайн."
      : locale === "en"
        ? "Add to home screen for quick booking and offline price list."
        : "Dodaj stronę do ekranu głównego — szybka rezerwacja i cennik offline.";

  return (
    <div className="rounded-lg border border-bm-red/30 bg-bm-red/5 p-4 text-sm flex flex-wrap gap-3 justify-between items-center mb-6">
      <span>{text}</span>
      <button
        type="button"
        className="text-xs text-bm-muted hover:text-white"
        onClick={() => {
          localStorage.setItem("bm-pwa-hint-dismissed", "1");
          setShow(false);
        }}
      >
        OK
      </button>
    </div>
  );
}
