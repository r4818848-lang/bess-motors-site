import type { User, WorkOrder } from "./store";
import type { Database } from "./store";

/** ISO string for sorting lists newest-first */
export function compareIsoDateDesc(a: string, b: string): number {
  return b.localeCompare(a);
}

export function workOrderSortDate(order: WorkOrder): string {
  return order.createdAt || order.updatedAt;
}

export function sortWorkOrdersByDateDesc(orders: WorkOrder[]): WorkOrder[] {
  return [...orders].sort((a, b) => {
    const byCreated = compareIsoDateDesc(a.createdAt, b.createdAt);
    if (byCreated !== 0) return byCreated;
    return compareIsoDateDesc(a.updatedAt, b.updatedAt);
  });
}

/** Latest activity: last work order or client registration */
export function clientListSortDate(db: Database, user: User): string {
  let latest = user.createdAt || "";
  for (const o of db.workOrders) {
    if (o.userId !== user.id) continue;
    const d = workOrderSortDate(o);
    if (d > latest) latest = d;
  }
  return latest;
}
