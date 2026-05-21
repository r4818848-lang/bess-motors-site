import type { WorkOrder, PaymentMethod, PaymentStatus } from "./store";
import { calcClientTotal } from "./workorder-calc";

/** Admin-facing payment method labels are in i18n `paymentMethods` */

export const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "cash_receipt",
  "card",
  "transfer",
  "blik",
  "card_cash",
];

/** Client sees only cash or card (BLIK/transfer → card; cash+receipt → cash) */
export type ClientPaymentView = "cash" | "card" | "mixed";

export function getClientPaymentView(
  method?: PaymentMethod,
  status?: PaymentStatus
): ClientPaymentView | null {
  if (status !== "paid" || !method) return null;
  switch (method) {
    case "card":
    case "transfer":
    case "blik":
      return "card";
    case "cash":
    case "cash_receipt":
      return "cash";
    case "card_cash":
      return "mixed";
    default:
      return null;
  }
}

export interface PaymentBreakdown {
  cash: number;
  cash_receipt: number;
  card: number;
  transfer: number;
  blik: number;
  card_cash_cash: number;
  card_cash_card: number;
  unpaid: number;
  paidTotal: number;
}

export function emptyPaymentBreakdown(): PaymentBreakdown {
  return {
    cash: 0,
    cash_receipt: 0,
    card: 0,
    transfer: 0,
    blik: 0,
    card_cash_cash: 0,
    card_cash_card: 0,
    unpaid: 0,
    paidTotal: 0,
  };
}

/** Sum paid orders by payment method for CRM reports */
export function aggregatePaymentBreakdown(orders: WorkOrder[]): PaymentBreakdown {
  const b = emptyPaymentBreakdown();
  for (const o of orders) {
    const total = calcClientTotal(o);
    if (o.paymentStatus !== "paid" || !o.paymentMethod) {
      b.unpaid += total;
      continue;
    }
    b.paidTotal += total;
    switch (o.paymentMethod) {
      case "cash":
        b.cash += total;
        break;
      case "cash_receipt":
        b.cash_receipt += total;
        break;
      case "card":
        b.card += total;
        break;
      case "transfer":
        b.transfer += total;
        break;
      case "blik":
        b.blik += total;
        break;
      case "card_cash": {
        const cashPart = o.paidCashAmount ?? 0;
        const cardPart = o.paidCardAmount ?? 0;
        b.card_cash_cash += cashPart;
        b.card_cash_card += cardPart;
        const splitSum = cashPart + cardPart;
        if (splitSum < total) {
          b.cash += total - splitSum;
        }
        break;
      }
    }
  }
  return b;
}
