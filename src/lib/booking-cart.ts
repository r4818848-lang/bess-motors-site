import {
  getPriceItem,
  type PriceListItem,
  type PriceUnit,
} from "./price-list";

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
  locale: "pl" | "ru"
): string {
  if (item.unit === "per_cylinder") {
    return locale === "ru" ? `${qty} цил.` : `${qty} cyl.`;
  }
  if (item.unit === "per_wheel") {
    return locale === "ru" ? `${qty} кол.` : `${qty} koła`;
  }
  if (item.unit === "per_100g") {
    return `${qty * 100} g`;
  }
  return qty > 1 ? `×${qty}` : "";
}

export function unitPriceHint(item: PriceListItem, locale: "pl" | "ru"): string {
  if (item.unit === "free") {
    return locale === "ru" ? "бесплатно" : "bezpłatnie";
  }
  const from = item.priceFrom ? (locale === "ru" ? "от " : "od ") : "";
  if (item.unit === "per_cylinder") {
    return `${from}${item.basePrice} zł / ${locale === "ru" ? "цилиндр" : "cylinder"}`;
  }
  if (item.unit === "per_wheel") {
    return `${from}${item.basePrice} zł / ${locale === "ru" ? "колесо" : "koło"}`;
  }
  if (item.unit === "per_100g") {
    return `${from}${item.basePrice} zł / 100 g`;
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
