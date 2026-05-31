import type { WorkOrder } from "./store";
import { isWorkOrderClosed } from "./work-order-lifecycle";

/** Date when order was closed (issued to client) */
export function getWorkOrderCompletedAt(order: WorkOrder): string | null {
  if (order.completedAt) return order.completedAt.slice(0, 10);
  if (isWorkOrderClosed(order)) {
    return (order.updatedAt || order.createdAt).slice(0, 10);
  }
  return null;
}

export function applyWorkOrderCompletedAt(order: WorkOrder): WorkOrder {
  if (isWorkOrderClosed(order)) {
    return {
      ...order,
      completedAt: order.completedAt ?? new Date().toISOString().slice(0, 10),
    };
  }
  return { ...order, completedAt: undefined };
}
