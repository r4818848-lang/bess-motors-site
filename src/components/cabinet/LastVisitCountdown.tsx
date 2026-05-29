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
  const { t } = useI18n();
  const days = daysSinceLastVisit(orders, vehicleId);
  if (days === null) return null;

  return (
    <p className="text-xs text-bm-muted">
      {t.lastVisit.label.replace("{days}", String(days))}
    </p>
  );
}
