import type { WorkOrder, RepairStatus, PaymentMethod, PaymentStatus } from "./store";

export type WorkOrderListFilters = {
  repairStatus: RepairStatus | "all";
  paymentMethod: PaymentMethod | "all";
  paymentStatus: PaymentStatus | "all" | "unpaid";
};

export const defaultWorkOrderFilters: WorkOrderListFilters = {
  repairStatus: "all",
  paymentMethod: "all",
  paymentStatus: "all",
};

export function filterWorkOrders(
  orders: WorkOrder[],
  filters: WorkOrderListFilters
): WorkOrder[] {
  return orders.filter((o) => {
    if (filters.repairStatus !== "all" && o.status !== filters.repairStatus) {
      return false;
    }
    if (filters.paymentStatus === "unpaid") {
      if (o.paymentStatus === "paid") return false;
    } else if (filters.paymentStatus !== "all" && o.paymentStatus !== filters.paymentStatus) {
      return false;
    }
    if (filters.paymentMethod !== "all") {
      if (o.paymentMethod !== filters.paymentMethod) return false;
    }
    return true;
  });
}
