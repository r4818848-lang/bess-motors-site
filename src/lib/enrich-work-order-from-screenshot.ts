import {
  displayUnitPrice,
  storeUnitPriceFromDisplay,
} from "@/lib/crm-display-price";
import type { CrmScreenshotData } from "@/lib/motowarsztat-crm-screenshot-parser";
import type { Database, PartLine, WorkOrder, WorkOrderLine } from "@/lib/store";

export type EnrichLineUpdate = {
  kind: "service" | "part";
  index: number;
  name: string;
  fields: string[];
};

export type EnrichWorkOrderResult = {
  ok: boolean;
  orderNumber: string;
  orderId?: string;
  updates: EnrichLineUpdate[];
  warnings: string[];
  snapshot: CrmScreenshotData;
};

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s+.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const wa = na.split(" ").filter((w) => w.length > 2);
  const wb = new Set(nb.split(" ").filter((w) => w.length > 2));
  const overlap = wa.filter((w) => wb.has(w)).length;
  return overlap >= Math.min(2, Math.min(wa.length, wb.size));
}

function moneyClose(a: number, b: number): boolean {
  if (a <= 0 || b <= 0) return false;
  return Math.abs(a - b) <= 0.05 || Math.abs(a - b) / Math.max(a, b) <= 0.02;
}

function serviceLineBrutto(
  line: WorkOrderLine,
  vatRate: number,
  vatEnabled: boolean
): number {
  const unit = displayUnitPrice(line.price, "gross", vatRate, vatEnabled);
  return Math.round(unit * line.qty * (1 - line.discount / 100) * 100) / 100;
}

function partSellBrutto(
  line: PartLine,
  vatRate: number,
  vatEnabled: boolean
): number {
  const unit = displayUnitPrice(line.sellPrice, "gross", vatRate, vatEnabled);
  return Math.round(unit * line.qty * (1 - line.discount / 100) * 100) / 100;
}

function findServiceIndex(
  order: WorkOrder,
  snap: { name: string; priceBrutto: number },
  vatRate: number,
  vatEnabled: boolean,
  used: Set<number>
): number {
  let best = -1;
  let bestScore = 0;
  order.services.forEach((line, i) => {
    if (used.has(i)) return;
    let score = 0;
    if (namesMatch(line.name, snap.name)) score += 10;
    const brutto = serviceLineBrutto(line, vatRate, vatEnabled);
    if (moneyClose(brutto, snap.priceBrutto)) score += 8;
    else if (moneyClose(displayUnitPrice(line.price, "gross", vatRate, vatEnabled), snap.priceBrutto))
      score += 5;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return bestScore >= 8 ? best : -1;
}

function findPartIndex(
  order: WorkOrder,
  snap: {
    name: string;
    sellPriceBrutto: number;
    qty: number;
    partNumber?: string;
  },
  vatRate: number,
  vatEnabled: boolean,
  used: Set<number>
): number {
  let best = -1;
  let bestScore = 0;
  order.parts.forEach((line, i) => {
    if (used.has(i)) return;
    let score = 0;
    if (namesMatch(line.name, snap.name)) score += 10;
    if (snap.partNumber && line.partNumber && normalizeName(line.partNumber) === normalizeName(snap.partNumber))
      score += 6;
    const brutto = partSellBrutto(line, vatRate, vatEnabled);
    const unitBrutto = displayUnitPrice(line.sellPrice, "gross", vatRate, vatEnabled);
    if (moneyClose(brutto, snap.sellPriceBrutto)) score += 8;
    else if (moneyClose(unitBrutto, snap.sellPriceBrutto)) score += 6;
    if (line.qty === snap.qty) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return bestScore >= 8 ? best : -1;
}

export function enrichWorkOrderFromScreenshot(
  order: WorkOrder,
  snapshot: CrmScreenshotData,
  vatRate: number
): EnrichWorkOrderResult {
  const warnings: string[] = [...snapshot.warnings];
  const updates: EnrichLineUpdate[] = [];
  const vatEnabled = order.vatEnabled ?? false;

  const orderKey = order.number.trim().toUpperCase();
  const snapKey = snapshot.orderNumber.trim().toUpperCase();
  if (snapKey && orderKey !== snapKey) {
    warnings.push("order_number_mismatch");
  }

  const usedServices = new Set<number>();
  const usedParts = new Set<number>();

  for (const snapSvc of snapshot.services) {
    const idx = findServiceIndex(order, snapSvc, vatRate, vatEnabled, usedServices);
    if (idx < 0) {
      warnings.push(`service_not_matched:${snapSvc.name}`);
      continue;
    }
    usedServices.add(idx);
    const line = order.services[idx]!;
    const fields: string[] = [];

    if (snapSvc.discountPercent != null && line.discount !== snapSvc.discountPercent) {
      line.discount = snapSvc.discountPercent;
      fields.push("discount");
    }

  const expectedStored = storeUnitPriceFromDisplay(
      snapSvc.priceBrutto / (snapSvc.qty > 0 ? snapSvc.qty : 1),
      "gross",
      vatRate,
      vatEnabled
    );
    if (!moneyClose(line.price, expectedStored) && snapSvc.discountPercent) {
      /* keep imported line total; discount carries the difference */
    }

    if (fields.length) {
      updates.push({ kind: "service", index: idx, name: line.name, fields });
    }
  }

  for (const snapPart of snapshot.parts) {
    const idx = findPartIndex(order, snapPart, vatRate, vatEnabled, usedParts);
    if (idx < 0) {
      warnings.push(`part_not_matched:${snapPart.name}`);
      continue;
    }
    usedParts.add(idx);
    const line = order.parts[idx]!;
    const fields: string[] = [];

    if (snapPart.partNumber?.trim()) {
      const code = snapPart.partNumber.trim();
      if ((line.partNumber ?? "").trim() !== code) {
        line.partNumber = code;
        fields.push("partNumber");
      }
    }

    if (snapPart.purchasePriceBrutto > 0) {
      const storedPurchase = storeUnitPriceFromDisplay(
        snapPart.purchasePriceBrutto,
        "gross",
        vatRate,
        vatEnabled
      );
      if (!moneyClose(line.purchasePrice, storedPurchase)) {
        line.purchasePrice = storedPurchase;
        fields.push("purchasePrice");
      }
    }

    if (snapPart.discountPercent != null && line.discount !== snapPart.discountPercent) {
      line.discount = snapPart.discountPercent;
      fields.push("discount");
    }

    if (fields.length) {
      updates.push({ kind: "part", index: idx, name: line.name, fields });
    }
  }

  return {
    ok: updates.length > 0 || warnings.length === 0,
    orderNumber: snapshot.orderNumber,
    orderId: order.id,
    updates,
    warnings,
    snapshot,
  };
}

export function findWorkOrderByNumber(db: Database, orderNumber: string): WorkOrder | undefined {
  const key = orderNumber.trim().toUpperCase();
  return db.workOrders.find((o) => o.number.trim().toUpperCase() === key);
}

/** Sanity: imported sell lines should be close to snapshot (brutto). */
export function verifyOrderAgainstSnapshot(
  order: WorkOrder,
  snapshot: CrmScreenshotData,
  vatRate: number
): string[] {
  const issues: string[] = [];
  const vatEnabled = order.vatEnabled ?? false;

  for (const snap of snapshot.services) {
    const idx = order.services.findIndex(
      (l) =>
        namesMatch(l.name, snap.name) &&
        (moneyClose(serviceLineBrutto(l, vatRate, vatEnabled), snap.priceBrutto) ||
          moneyClose(
            displayUnitPrice(l.price, "gross", vatRate, vatEnabled),
            snap.priceBrutto
          ))
    );
    if (idx < 0) issues.push(`service:${snap.name}`);
  }

  for (const snap of snapshot.parts) {
    const idx = order.parts.findIndex(
      (l) =>
        namesMatch(l.name, snap.name) &&
        (moneyClose(partSellBrutto(l, vatRate, vatEnabled), snap.sellPriceBrutto) ||
          moneyClose(
            displayUnitPrice(l.sellPrice, "gross", vatRate, vatEnabled),
            snap.sellPriceBrutto
          ))
    );
    if (idx < 0) issues.push(`part:${snap.name}`);
  }

  return issues;
}
