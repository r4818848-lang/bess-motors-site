import type { WorkOrder, WorkOrderLine, PartLine, MechanicProfile, AppSettings } from "./store";

export function calcServiceLine(line: WorkOrderLine): number {
  return line.qty * line.price * (1 - line.discount / 100);
}

/** Mechanic assigned to a labor line (line override or order default). */
export function resolveServiceLineMechanicId(
  line: WorkOrderLine,
  order: WorkOrder
): string {
  const id = line.mechanicId?.trim();
  return id || order.mechanicId;
}

export function calcPartLine(line: PartLine): number {
  return line.qty * line.sellPrice * (1 - line.discount / 100);
}

export function calcPartLineProfit(line: PartLine): number {
  const revenue = calcPartLine(line);
  const cost = line.qty * line.purchasePrice;
  return revenue - cost;
}

export function calcPartMarginPercent(line: PartLine): number {
  if (line.purchasePrice <= 0) return 0;
  return ((line.sellPrice - line.purchasePrice) / line.purchasePrice) * 100;
}

export function calcServicesSubtotal(order: WorkOrder): number {
  return order.services.reduce((s, l) => s + calcServiceLine(l), 0);
}

export function calcPartsSubtotal(order: WorkOrder): number {
  return order.parts.reduce((s, l) => s + calcPartLine(l), 0);
}

export function calcSubtotal(order: WorkOrder): number {
  return calcServicesSubtotal(order) + calcPartsSubtotal(order);
}

export function calcOrderDiscountAmount(order: WorkOrder): number {
  const sub = calcSubtotal(order);
  return sub * (order.orderDiscount / 100);
}

export function calcClientTotal(order: WorkOrder): number {
  return Math.max(0, calcSubtotal(order) - calcOrderDiscountAmount(order));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calcClientTotalWithVat(order: WorkOrder, vatRate: number): number {
  if (!order.vatEnabled) return calcClientTotal(order);
  const net = calcClientTotal(order);
  return roundMoney(net * (1 + vatRate / 100));
}

export function calcVatAmount(order: WorkOrder, vatRate: number): number {
  if (!order.vatEnabled) return 0;
  return roundMoney(calcClientTotalWithVat(order, vatRate) - calcClientTotal(order));
}

export interface OrderTotalsBreakdown {
  servicesSub: number;
  partsSub: number;
  subtotal: number;
  discount: number;
  netTotal: number;
  vatRate: number;
  vatAmount: number;
  grossTotal: number;
}

export function calcOrderBreakdown(order: WorkOrder, vatRate = 23): OrderTotalsBreakdown {
  const servicesSub = calcServicesSubtotal(order);
  const partsSub = calcPartsSubtotal(order);
  const subtotal = servicesSub + partsSub;
  const discount = calcOrderDiscountAmount(order);
  const netTotal = calcClientTotal(order);
  const vatAmount = calcVatAmount(order, vatRate);
  const grossTotal = netTotal + vatAmount;
  return {
    servicesSub,
    partsSub,
    subtotal,
    discount,
    netTotal,
    vatRate,
    vatAmount,
    grossTotal,
  };
}

export function calcPartsProfit(order: WorkOrder): number {
  return order.parts.reduce((s, l) => s + calcPartLineProfit(l), 0);
}

export function calcPartsPurchaseCost(order: WorkOrder): number {
  return order.parts.reduce((s, l) => s + l.qty * l.purchasePrice, 0);
}

/** What the workshop keeps on this order (after discount, parts cost, mechanic pay). */
export interface ServiceOrderProfit {
  laborMargin: number;
  partsMargin: number;
  mechanicPay: number;
  partsCost: number;
  netRevenue: number;
  total: number;
}

export function calcServiceOrderProfit(
  order: WorkOrder,
  settings: AppSettings,
  mechanic?: MechanicProfile
): ServiceOrderProfit {
  const earnings = calcMechanicEarnings(order, settings, mechanic);
  const servicesSub = calcServicesSubtotal(order);
  const partsProfitGross = calcPartsProfit(order);
  const partsCost = calcPartsPurchaseCost(order);
  const netRevenue = calcClientTotal(order);
  const laborMargin = servicesSub - earnings.fromLabor;
  const partsMargin = partsProfitGross - earnings.fromParts;
  const mechanicPay = earnings.total;
  const total = netRevenue - partsCost - mechanicPay;

  return {
    laborMargin,
    partsMargin,
    mechanicPay,
    partsCost,
    netRevenue,
    total,
  };
}

export interface MechanicEarnings {
  laborBase: number;
  laborPercent: number;
  fromLabor: number;
  partsProfit: number;
  partsPercent: number;
  fromParts: number;
  bonus: number;
  total: number;
}

/** Resolve % for this order: order override > mechanic profile > global settings */
export function resolveLaborPercent(
  order: WorkOrder,
  mechanic: MechanicProfile | undefined,
  settings: AppSettings
): number {
  if (order.mechanicLaborPercent >= 0) return order.mechanicLaborPercent;
  if (mechanic) return mechanic.laborPercent;
  return settings.defaultLaborPercent;
}

export function resolvePartsPercent(
  order: WorkOrder,
  mechanic: MechanicProfile | undefined,
  settings: AppSettings
): number {
  if (order.mechanicPartsPercent >= 0) return order.mechanicPartsPercent;
  if (mechanic) return mechanic.partsPercent;
  return settings.defaultPartsPercent;
}

export function calcMechanicEarnings(
  order: WorkOrder,
  settings: AppSettings,
  mechanic?: MechanicProfile
): MechanicEarnings {
  const laborPercent = resolveLaborPercent(order, mechanic, settings);
  const partsPercent = resolvePartsPercent(order, mechanic, settings);
  const laborBase = calcServicesSubtotal(order);
  const partsProfit = calcPartsProfit(order);
  const fromLabor = laborBase * (laborPercent / 100);
  const fromParts = partsProfit * (partsPercent / 100);
  const bonus = mechanic?.bonusPerOrder ?? 0;
  return {
    laborBase,
    laborPercent,
    fromLabor,
    partsProfit,
    partsPercent,
    fromParts,
    bonus,
    total: fromLabor + fromParts + bonus,
  };
}

/** @deprecated use calcMechanicEarnings */
export function calcMechanicSalary(
  order: WorkOrder,
  commissionPercent: number,
  bonusPerOrder: number
): number {
  const labor = calcServicesSubtotal(order);
  return labor * (commissionPercent / 100) + bonusPerOrder;
}

export function generateOrderNumber(existing: WorkOrder[]): string {
  const year = new Date().getFullYear();
  const nums = existing
    .map((o) => o.number.match(/BM-\d+-(\d+)/)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `BM-${year}-${String(next).padStart(4, "0")}`;
}

export function toClientWorkOrder(order: WorkOrder): WorkOrder {
  return {
    ...order,
    internalNotes: "",
    mechanicId: "",
    mechanicLaborPercent: -1,
    mechanicPartsPercent: -1,
    confirmationStatus: "awaiting_confirmation",
    files: order.files.filter((f) => f.category !== "internal"),
    parts: order.parts.map((p) => ({
      ...p,
      purchasePrice: 0,
      discount: p.discount,
    })),
  };
}
