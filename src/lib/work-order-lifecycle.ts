import type { WorkOrder } from "@/lib/store";

/** Order is closed (history) when repair status or document status is «issued to client». */
export function isWorkOrderClosed(order: WorkOrder): boolean {
  return order.status === "delivered" || order.documentStatus === "delivered";
}

/** Open work orders — not yet issued to client. */
export function isOpenWorkOrder(order: WorkOrder): boolean {
  return !isWorkOrderClosed(order);
}

/** Closed work orders — shown in order history. */
export function isClosedWorkOrder(order: WorkOrder): boolean {
  return isWorkOrderClosed(order);
}

export function filterOpenWorkOrders(orders: WorkOrder[]): WorkOrder[] {
  return orders.filter(isOpenWorkOrder);
}

export function filterClosedWorkOrders(orders: WorkOrder[]): WorkOrder[] {
  return orders.filter(isClosedWorkOrder);
}

/** When document is «delivered» or repair status is «delivered», close the work order. */
export function applyWorkOrderClosure(order: WorkOrder): WorkOrder {
  if (!isWorkOrderClosed(order) && order.documentStatus !== "delivered" && order.status !== "delivered") {
    return order;
  }
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...order,
    status: "delivered",
    documentStatus: "delivered",
    completedAt: order.completedAt ?? today,
    updatedAt: today,
  };
}
