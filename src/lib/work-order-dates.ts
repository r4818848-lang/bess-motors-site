import type { WorkOrder } from "./store";

/** Date when order was closed (delivered) */
export function getWorkOrderCompletedAt(order: WorkOrder): string | null {
  if (order.completedAt) return order.completedAt.slice(0, 10);
  if (order.status === "delivered") {
    return (order.updatedAt || order.createdAt).slice(0, 10);
  }
  return null;
}

export function applyWorkOrderCompletedAt(order: WorkOrder): WorkOrder {
  if (order.status === "delivered") {
    return {
      ...order,
      completedAt: order.completedAt ?? new Date().toISOString().slice(0, 10),
    };
  }
  return { ...order, completedAt: undefined };
}
