import type { WorkOrder, RepairStatus, PaymentMethod, PaymentStatus } from "./store";

export type WorkOrderFilterPreset =
  | "all"
  | "unsigned"
  | "unpaid_ready"
  | "sla_critical"
  | "needs_sign";

export type WorkOrderListFilters = {
  repairStatus: RepairStatus | "all";
  paymentMethod: PaymentMethod | "all";
  paymentStatus: PaymentStatus | "all" | "unpaid";
  preset?: WorkOrderFilterPreset;
};

export const defaultWorkOrderFilters: WorkOrderListFilters = {
  repairStatus: "all",
  paymentMethod: "all",
  paymentStatus: "all",
};

function needsSignature(o: WorkOrder): boolean {
  return (
    o.confirmationStatus !== "confirmed" ||
    o.documentStatus === "awaiting_signature" ||
    !o.documentStatus
  );
}

export function filterWorkOrders(
  orders: WorkOrder[],
  filters: WorkOrderListFilters
): WorkOrder[] {
  return orders.filter((o) => {
    if (filters.preset === "unsigned" || filters.preset === "needs_sign") {
      if (!needsSignature(o)) return false;
    }
    if (filters.preset === "unpaid_ready") {
      if (o.status !== "ready" || o.paymentStatus === "paid") return false;
    }
    if (filters.preset === "sla_critical") {
      if (o.slaLevel !== "critical") return false;
    }
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
