import { KNOWN_CRM_SCREENSHOTS } from "@/lib/motowarsztat-crm-screenshot-parser";
import { enrichWorkOrderFromScreenshot } from "@/lib/enrich-work-order-from-screenshot";
import type { WorkOrder } from "@/lib/store";

export function knownScreenshotForOrder(orderNumber?: string) {
  if (!orderNumber?.trim()) return undefined;
  const key = orderNumber.trim().toUpperCase().replace(/\s+/g, " ");
  return KNOWN_CRM_SCREENSHOTS[key];
}

/** Apply curated CRM screenshot purchase/part data when available for this order number. */
export function applyKnownScreenshotToOrder(order: WorkOrder, vatRate: number): boolean {
  const snapshot = knownScreenshotForOrder(order.number);
  if (!snapshot) return false;
  enrichWorkOrderFromScreenshot(order, snapshot, vatRate);
  return true;
}
