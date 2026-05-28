import type { Database, WorkOrder } from "./store";

const ACTIVE: WorkOrder["status"][] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
];

export function getQueuePosition(
  db: Database,
  order: WorkOrder
): { position: number; total: number } | null {
  if (!ACTIVE.includes(order.status)) return null;

  const active = db.workOrders
    .filter((o) => ACTIVE.includes(o.status))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const idx = active.findIndex((o) => o.id === order.id);
  if (idx < 0) return { position: active.length, total: active.length };
  return { position: idx + 1, total: active.length };
}
