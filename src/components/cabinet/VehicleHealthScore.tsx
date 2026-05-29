"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Vehicle, WorkOrder } from "@/lib/store";
import { computeVehicleHealthScore } from "@/lib/vehicle-health-score";

export function VehicleHealthScore({
  vehicle,
  orders,
}: {
  vehicle: Vehicle;
  orders: WorkOrder[];
}) {
  const { t } = useI18n();
  const { score } = computeVehicleHealthScore(vehicle, orders);
  const color = score >= 80 ? "text-green-400" : score >= 60 ? "text-amber-400" : "text-bm-red";

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-bm-muted">{t.vehicleHealth.label}</span>
      <div className="flex-1 h-2 rounded-full bg-bm-border overflow-hidden max-w-[120px]">
        <div className="h-full bg-bm-red transition-all" style={{ width: `${score}%` }} />
      </div>
      <span className={`font-bold ${color}`}>{score}%</span>
    </div>
  );
}
