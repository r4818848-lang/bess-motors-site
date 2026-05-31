import type { Database, User, Vehicle } from "./store";

export type RecentClientVehicle = {
  user: User;
  vehicle: Vehicle;
  orderNumber: string;
  lastUsedAt: string;
};

/** Last used client+vehicle pairs from work orders (for quick-create picker) */
export function getRecentClientVehiclePairs(
  db: Database,
  limit = 8
): RecentClientVehicle[] {
  const sorted = [...db.workOrders].sort((a, b) => {
    const da = b.updatedAt || b.createdAt;
    const db_ = a.updatedAt || a.createdAt;
    return da.localeCompare(db_);
  });

  const seen = new Set<string>();
  const out: RecentClientVehicle[] = [];

  for (const order of sorted) {
    const key = `${order.userId}:${order.vehicleId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const user = db.users.find((u) => u.id === order.userId && u.role === "client");
    const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
    if (!user || !vehicle) continue;
    out.push({
      user,
      vehicle,
      orderNumber: order.number,
      lastUsedAt: order.updatedAt || order.createdAt,
    });
    if (out.length >= limit) break;
  }

  return out;
}
