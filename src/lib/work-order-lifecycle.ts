import type { WorkOrder } from "@/lib/store";

/** Open work orders — everything except issued to client (Выдан). */
export function isOpenWorkOrder(order: WorkOrder): boolean {
  return order.status !== "delivered";
}

/** Closed work orders — moved to order history when status is delivered. */
export function isClosedWorkOrder(order: WorkOrder): boolean {
  return order.status === "delivered";
}

export function filterOpenWorkOrders(orders: WorkOrder[]): WorkOrder[] {
  return orders.filter(isOpenWorkOrder);
}

export function filterClosedWorkOrders(orders: WorkOrder[]): WorkOrder[] {
  return orders.filter(isClosedWorkOrder);
}
