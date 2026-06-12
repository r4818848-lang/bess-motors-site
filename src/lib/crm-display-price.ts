import type { PartLine, WorkOrder, WorkOrderLine } from "./store";
import {
  calcClientTotal,
  calcClientTotalWithVat,
  calcOrderBreakdown,
  calcPartLine,
  calcServiceLine,
} from "./workorder-calc";

export type CrmPriceMode = "net" | "gross";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Line prices in CRM are stored netto; when VAT is on the document, staff enter brutto.
 * (Netto/Brutto toggle only affects list views, not order entry.)
 */
export function usesGrossEntry(_mode: CrmPriceMode, vatEnabled: boolean): boolean {
  return vatEnabled;
}

export function displayServicesSubtotal(
  order: WorkOrder,
  mode: CrmPriceMode,
  vatRate: number,
  vatEnabled: boolean
): number {
  const net = order.services.reduce((s, l) => s + calcServiceLine(l), 0);
  if (usesGrossEntry(mode, vatEnabled)) return netToGross(net, vatRate);
  return roundMoney(net);
}

export function displayPartsSubtotal(
  order: WorkOrder,
  mode: CrmPriceMode,
  vatRate: number,
  vatEnabled: boolean
): number {
  const net = order.parts.reduce((s, l) => s + calcPartLine(l), 0);
  if (usesGrossEntry(mode, vatEnabled)) return netToGross(net, vatRate);
  return roundMoney(net);
}

/** Amount the client pays (brutto when VAT is on the document). */
export function displayClientFacingTotal(order: WorkOrder, vatRate = 23): number {
  if (order.vatEnabled) return calcClientTotalWithVat(order, vatRate);
  return calcClientTotal(order);
}

export function netToGross(net: number, vatRate: number): number {
  return roundMoney(net * (1 + vatRate / 100));
}

export function grossToNet(gross: number, vatRate: number): number {
  return roundMoney(gross / (1 + vatRate / 100));
}

/** Unit price shown in CRM inputs (net or gross depending on toggle). */
export function displayUnitPrice(
  storedNetPrice: number,
  mode: CrmPriceMode,
  vatRate: number,
  vatEnabled: boolean
): number {
  if (usesGrossEntry(mode, vatEnabled)) {
    return netToGross(storedNetPrice, vatRate);
  }
  return storedNetPrice;
}

/** Convert value from input field back to stored net unit price. */
export function storeUnitPriceFromDisplay(
  displayPrice: number,
  mode: CrmPriceMode,
  vatRate: number,
  vatEnabled: boolean
): number {
  if (usesGrossEntry(mode, vatEnabled)) {
    return grossToNet(displayPrice, vatRate);
  }
  return displayPrice;
}

export function displayServiceLineTotal(
  line: WorkOrderLine,
  mode: CrmPriceMode,
  vatRate: number,
  vatEnabled: boolean
): number {
  const net = calcServiceLine(line);
  if (usesGrossEntry(mode, vatEnabled)) {
    return netToGross(net, vatRate);
  }
  return roundMoney(net);
}

export function displayPartLineTotal(
  line: PartLine,
  mode: CrmPriceMode,
  vatRate: number,
  vatEnabled: boolean
): number {
  const net = calcPartLine(line);
  if (usesGrossEntry(mode, vatEnabled)) {
    return netToGross(net, vatRate);
  }
  return roundMoney(net);
}

export function displayOrderTotal(
  order: WorkOrder,
  mode: CrmPriceMode,
  vatRate = 23
): number {
  if (mode === "gross" && order.vatEnabled) {
    return calcClientTotalWithVat(order, vatRate);
  }
  return calcClientTotal(order);
}

export function displayOrderTotalLabel(
  order: WorkOrder,
  mode: CrmPriceMode,
  labels: { net: string; gross: string }
): string {
  if (mode === "gross" && order.vatEnabled) return labels.gross;
  return labels.net;
}

export { calcOrderBreakdown };
