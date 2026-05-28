"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Database, User, WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { downloadWorkOrderPdf } from "@/lib/work-order-pdf";

export function HistoryExportButton({
  user,
  db,
  orders,
}: {
  user: User;
  db: Database;
  orders: WorkOrder[];
}) {
  const { locale } = useI18n();
  const label =
    locale === "ru" || locale === "uk"
      ? "Скачать PDF последнего заказа"
      : locale === "en"
        ? "Download latest order PDF"
        : "Pobierz PDF ostatniego zlecenia";

  const latest = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!latest) return null;

  const vehicle = db.vehicles.find((v) => v.id === latest.vehicleId);
  const vehicleLabel = vehicle
    ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`
    : latest.number;

  return (
    <button
      type="button"
      className="btn-outline text-sm mb-6"
      onClick={() =>
        downloadWorkOrderPdf(latest, vehicleLabel, locale === "ru" || locale === "uk" ? "ru" : "pl")
      }
    >
      {label} ({latest.number}, {calcClientTotal(latest).toFixed(0)} zł)
    </button>
  );
}
