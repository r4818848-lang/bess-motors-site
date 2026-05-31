import type { WorkOrder } from "./store";
import {
  calcClientTotal,
  calcClientTotalWithVat,
  calcOrderBreakdown,
} from "./workorder-calc";

export function displayOrderTotal(
  order: WorkOrder,
  mode: "net" | "gross",
  vatRate = 23
): number {
  if (mode === "gross" && order.vatEnabled) {
    return calcClientTotalWithVat(order, vatRate);
  }
  return calcClientTotal(order);
}

export function displayOrderTotalLabel(
  order: WorkOrder,
  mode: "net" | "gross",
  labels: { net: string; gross: string }
): string {
  if (mode === "gross" && order.vatEnabled) return labels.gross;
  return labels.net;
}

export { calcOrderBreakdown };
