import type { Database, PartLine, WarehouseItem, WorkOrder } from "@/lib/store";

export const DEFAULT_MIN_QTY = 3;

export function migrateWarehouseItem(item: WarehouseItem): WarehouseItem {
  return { ...item, minQty: item.minQty ?? DEFAULT_MIN_QTY };
}

export function getLowStockItems(items: WarehouseItem[]): WarehouseItem[] {
  return items
    .map(migrateWarehouseItem)
    .filter((i) => i.qty <= (i.minQty ?? DEFAULT_MIN_QTY))
    .sort((a, b) => a.qty - b.qty);
}

function matchPartToWarehouse(part: PartLine, items: WarehouseItem[]): WarehouseItem | undefined {
  const pn = part.partNumber?.trim().toLowerCase();
  if (pn) {
    const bySku = items.find((w) => w.sku.toLowerCase() === pn);
    if (bySku) return bySku;
  }
  const name = part.name.trim().toLowerCase();
  return items.find((w) => w.name.trim().toLowerCase() === name);
}

/** Deduct warehouse qty when CRM saves parts on a work order (best-effort by SKU/name). */
export function syncWarehouseFromWorkOrder(db: Database, order: WorkOrder): Database {
  if (!order.parts?.length || !db.warehouse.length) return db;
  const warehouse = db.warehouse.map((w) => ({ ...migrateWarehouseItem(w) }));
  let touched = false;

  for (const part of order.parts) {
    const item = matchPartToWarehouse(part, warehouse);
    if (!item || part.qty <= 0) continue;
    const next = Math.max(0, item.qty - part.qty);
    if (next !== item.qty) {
      item.qty = next;
      touched = true;
    }
  }

  return touched ? { ...db, warehouse } : db;
}

export function formatLowStockReport(items: WarehouseItem[]): string {
  const low = getLowStockItems(items);
  if (!low.length) return "✅ <b>Склад:</b> все позиции в норме.";
  const lines = low.slice(0, 15).map((i) => `• ${i.name} (${i.sku}) — <b>${i.qty}</b> шт.`);
  return ["⚠️ <b>Низкий остаток на складе</b>", "", ...lines].join("\n");
}
