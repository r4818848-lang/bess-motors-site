import type { WorkOrder } from "@/lib/store";

/** Client must sign (cabinet, /status, Telegram) */
export function orderNeedsClientSignature(order: WorkOrder): boolean {
  return (
    order.confirmationStatus !== "confirmed" ||
    order.documentStatus === "awaiting_signature"
  );
}
