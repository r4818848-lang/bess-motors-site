import {
  getPriceItem,
  type PriceListItem,
  type PriceUnit,
} from "./price-list";
import { getTranslations } from "./i18n/translations";
import type { Locale } from "./i18n/types";
import { fillTemplate } from "./i18n/locale-utils";

export interface CartLineParams {
  cylinders?: number;
  wheels?: number;
  grams100?: number;
}

export interface CartLine {
  id: string;
  itemId: string;
  label: string;
  unit: PriceUnit;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  priceFrom: boolean;
  isFree: boolean;
  params?: CartLineParams;
}

export function defaultQuantity(item: PriceListItem): number {
  if (item.unit === "per_cylinder") return 4;
  if (item.unit === "per_wheel") return 4;
  if (item.unit === "per_100g") return 5;
  return 1;
}

export function calcLineTotal(
  item: PriceListItem,
  quantity: number
): number {
  if (item.unit === "free") return 0;
  const q = Math.max(item.minQty ?? 1, quantity);
  return item.basePrice * q;
}

export function buildCartLine(
  item: PriceListItem,
  label: string,
  quantity: number
): CartLine {
  const q = Math.max(item.minQty ?? 1, Math.min(item.maxQty ?? 99, quantity));
  const lineTotal = calcLineTotal(item, q);
  return {
    id: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    itemId: item.id,
    label,
    unit: item.unit,
    quantity: q,
    unitPrice: item.basePrice,
    lineTotal,
    priceFrom: !!item.priceFrom && item.unit !== "free",
    isFree: item.unit === "free",
    params:
      item.unit === "per_cylinder"
        ? { cylinders: q }
        : item.unit === "per_wheel"
          ? { wheels: q }
          : item.unit === "per_100g"
            ? { grams100: q }
            : undefined,
  };
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.lineTotal, 0);
}

export function cartHasFromPrices(lines: CartLine[]): boolean {
  return lines.some((l) => l.priceFrom && !l.isFree);
}

export function formatPln(amount: number): string {
  return `${amount.toFixed(2)} zł`;
}

export function quantityLabel(
  item: PriceListItem,
  qty: number,
  locale: Locale
): string {
  const c = getTranslations(locale).priceCart;
  if (item.unit === "per_cylinder") {
    return fillTemplate(c.cylinderQty, { qty });
  }
  if (item.unit === "per_wheel") {
    return fillTemplate(c.wheelQty, { qty });
  }
  if (item.unit === "per_100g") {
    return fillTemplate(c.gramsQty, { qty: qty * 100 });
  }
  return qty > 1 ? `×${qty}` : "";
}

export function unitPriceHint(item: PriceListItem, locale: Locale): string {
  const c = getTranslations(locale).priceCart;
  if (item.unit === "free") {
    return c.free;
  }
  const from = item.priceFrom ? c.fromPrefix : "";
  if (item.unit === "per_cylinder") {
    return `${from}${item.basePrice} zł / ${c.perCylinder}`;
  }
  if (item.unit === "per_wheel") {
    return `${from}${item.basePrice} zł / ${c.perWheel}`;
  }
  if (item.unit === "per_100g") {
    return `${from}${item.basePrice} zł / ${c.per100g}`;
  }
  return `${from}${item.basePrice} zł`;
}

export function mergeCartLine(
  lines: CartLine[],
  itemId: string,
  newLine: CartLine
): CartLine[] {
  const existing = lines.find((l) => l.itemId === itemId);
  if (!existing) return [...lines, newLine];
  return lines.map((l) =>
    l.itemId === itemId
      ? { ...newLine, id: l.id }
      : l
  );
}

export function updateCartQuantity(
  lines: CartLine[],
  lineId: string,
  quantity: number
): CartLine[] {
  return lines.map((line) => {
    if (line.id !== lineId) return line;
    const item = getPriceItem(line.itemId);
    if (!item) return line;
    const label = line.label.split(" (")[0];
    return buildCartLine(item, label, quantity);
  });
}