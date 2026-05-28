import type { RepairStatus, Vehicle, WorkOrder } from "@/lib/store";

const STATUS_WEIGHT: Record<RepairStatus, number> = {
  received: 40,
  diagnostic: 35,
  repair: 30,
  waitingParts: 25,
  ready: 85,
  delivered: 100,
};

export function computeVehicleHealthScore(
  vehicle: Vehicle,
  orders: WorkOrder[]
): { score: number; label: string } {
  const related = orders.filter((o) => o.vehicleId === vehicle.id);
  if (!related.length) {
    return { score: 70, label: "ok" };
  }
  const active = related.find((o) => o.status !== "delivered");
  if (active) {
    const s = STATUS_WEIGHT[active.status] ?? 50;
    return { score: s, label: active.status };
  }
  const last = [...related].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const daysSince = Math.floor(
    (Date.now() - new Date(last.updatedAt).getTime()) / (86400 * 1000)
  );
  if (daysSince > 365) return { score: 55, label: "service_due" };
  if (daysSince > 180) return { score: 72, label: "monitor" };
  return { score: 92, label: "good" };
}

export function daysSinceLastVisit(orders: WorkOrder[], vehicleId: string): number | null {
  const done = orders
    .filter((o) => o.vehicleId === vehicleId && o.status === "delivered")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (!done) return null;
  return Math.floor((Date.now() - new Date(done.updatedAt).getTime()) / 86400 * 1000);
}
