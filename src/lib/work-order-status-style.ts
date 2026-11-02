import type { RepairStatus } from "@/lib/store";

/** Motowarsztat-style status pill colors */
export function repairStatusPillClass(status: RepairStatus): string {
  switch (status) {
    case "received":
      return "crm-status-pill crm-status-received";
    case "diagnostic":
      return "crm-status-pill crm-status-diagnostic";
    case "awaitingApproval":
      return "crm-status-pill crm-status-diagnostic";
    case "repair":
      return "crm-status-pill crm-status-repair";
    case "waitingParts":
    case "partsOrdered":
      return "crm-status-pill crm-status-waiting";
    case "ready":
      return "crm-status-pill crm-status-ready";
    case "delivered":
      return "crm-status-pill crm-status-delivered";
    case "cancelled":
      return "crm-status-pill crm-status-waiting";
    default:
      return "crm-status-pill crm-status-received";
  }
}
