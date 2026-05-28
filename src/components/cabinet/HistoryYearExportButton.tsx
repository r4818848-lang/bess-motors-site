"use client";

import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder } from "@/lib/store";
import { downloadOrdersHistoryPdf } from "@/lib/work-order-pdf";

export function HistoryYearExportButton({
  orders,
  vehicleLabel,
}: {
  orders: WorkOrder[];
  vehicleLabel: string;
}) {
  const { locale } = useI18n();
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const cutoff = yearAgo.toISOString().slice(0, 10);
  const yearOrders = orders.filter((o) => o.createdAt >= cutoff);
  if (!yearOrders.length) return null;

  const label =
    locale === "ru"
      ? `PDF истории (${yearOrders.length})`
      : locale === "en"
        ? `History PDF (${yearOrders.length})`
        : `PDF historii (${yearOrders.length})`;

  return (
    <button
      type="button"
      className="btn-outline text-sm"
      onClick={() =>
        downloadOrdersHistoryPdf(
          yearOrders,
          vehicleLabel,
          locale === "ru" || locale === "uk" ? "ru" : "pl"
        )
      }
    >
      {label}
    </button>
  );
}
