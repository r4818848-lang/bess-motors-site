import type { RepairStatus } from "@/lib/store";

export const REPAIR_STATUS_ORDER: RepairStatus[] = [
  "received",
  "diagnostic",
  "awaitingApproval",
  "waitingParts",
  "partsOrdered",
  "repair",
  "ready",
  "delivered",
];

export function repairProgressPercent(status: RepairStatus): number {
  if (status === "cancelled") return 0;
  const idx = REPAIR_STATUS_ORDER.indexOf(status);
  if (idx < 0) return 0;
  if (REPAIR_STATUS_ORDER.length <= 1) return 100;
  return Math.round((idx / (REPAIR_STATUS_ORDER.length - 1)) * 100);
}

export function isActiveRepairStatus(status: RepairStatus): boolean {
  return status !== "delivered" && status !== "cancelled";
}
