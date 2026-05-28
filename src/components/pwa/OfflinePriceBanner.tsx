"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

type CachedPriceList = {
  categories: { id: string; namePl: string; nameRu: string }[];
  items: {
    id: string;
    categoryId: string;
    namePl: string;
    nameRu: string;
    basePrice: number;
    unit: string;
    priceFrom: boolean;
  }[];
  updatedAt: string;
};

export function OfflinePriceBanner() {
  const { locale } = useI18n();
  const [offline, setOffline] = useState(false);
  const [cached, setCached] = useState<CachedPriceList | null>(null);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    if (!offline) return;
    fetch("/api/price-list")
      .then((r) => r.json())
      .then((data) => setCached(data))
      .catch(() => null);
  }, [offline]);

  if (!offline) return null;

  const label =
    locale === "ru" || locale === "uk"
      ? "Офлайн — показан кэш прайса"
      : locale === "en"
        ? "Offline — showing cached price list"
        : "Offline — pokazujemy zapisany cennik";

  return (
    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <p className="font-semibold">{label}</p>
      {cached ? (
        <p className="text-xs text-bm-muted mt-1">
          {cached.items.length}{" "}
          {locale === "pl" ? "pozycji" : locale === "en" ? "items" : "позиций"} · {cached.updatedAt}
        </p>
      ) : null}
    </div>
  );
}
