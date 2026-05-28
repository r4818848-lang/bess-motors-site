"use client";

import { useI18n } from "@/lib/i18n/context";
import type { WorkOrder } from "@/lib/store";
import { daysSinceLastVisit } from "@/lib/vehicle-health-score";

export function LastVisitCountdown({
  vehicleId,
  orders,
}: {
  vehicleId: string;
  orders: WorkOrder[];
}) {
  const { locale } = useI18n();
  const days = daysSinceLastVisit(orders, vehicleId);
  if (days === null) return null;

  const label =
    locale === "ru"
      ? `Последний визит: ${days} дн. назад`
      : locale === "en"
        ? `Last visit: ${days} days ago`
        : `Ostatnia wizyta: ${days} dni temu`;

  return <p className="text-xs text-bm-muted">{label}</p>;
}
