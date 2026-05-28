import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import type { Database } from "@/lib/store";
import { formatLowStockReport, getLowStockItems, migrateWarehouseItem } from "@/lib/warehouse-stock";

export function formatWarehouseDetailed(db: Database): string {
  const items = db.warehouse.map(migrateWarehouseItem).slice(0, 20);
  if (!items.length) return "🏭 <b>Склад пуст</b>";
  const lines = items.map(
    (i) =>
      `• <b>${i.name}</b> (${i.sku})\n  ${i.qty} шт. · закуп ${i.purchasePrice} / продажа ${i.sellPrice} zł`
  );
  const low = getLowStockItems(db.warehouse).length;
  return [
    "🏭 <b>Склад</b>",
    low > 0 ? `⚠️ Низкий остаток: ${low} поз.` : "",
    "",
    ...lines,
  ]
    .filter(Boolean)
    .join("\n");
}

export function warehouseKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "⚠️ Низкий остаток", callback_data: "wh:low" }],
      [{ text: "🔄 Обновить", callback_data: "wh:0" }],
      [{ text: "🏠 Меню", callback_data: "menu" }],
    ],
  };
}

export function formatWarehouseLowOnly(db: Database): string {
  return formatLowStockReport(db.warehouse);
}
