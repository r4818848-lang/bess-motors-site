import { sendTelegramMessage } from "@/lib/server/telegram-api";
import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import type { Database, WorkOrder } from "@/lib/store";
import { notifyTelegramSignByPhone } from "./client-telegram-notify";
import { esc } from "./format";

export function listUnsignedOrders(db: Database): WorkOrder[] {
  return db.workOrders
    .filter(
      (o) =>
        o.confirmationStatus !== "confirmed" &&
        (o.documentStatus === "awaiting_signature" ||
          o.confirmationStatus === "awaiting_confirmation")
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);
}

export function formatUnsignedList(db: Database): string {
  const orders = listUnsignedOrders(db);
  if (!orders.length) {
    return "✅ <b>Нет заказ-нарядов, ожидающих подпись.</b>";
  }

  const lines = [`✍️ <b>Ожидают подпись (${orders.length})</b>`, ""];
  for (const o of orders) {
    const client = db.users.find((u) => u.id === o.userId);
    const vehicle = db.vehicles.find((v) => v.id === o.vehicleId);
    lines.push(
      `<b>${o.number}</b>`,
      client ? `👤 ${esc(client.name)} · ${esc(client.phone)}` : "",
      vehicle ? `🚗 ${esc(vehicle.plate)}` : "",
      client?.telegramChatId ? "📱 Telegram ✓" : "📱 Telegram ✗",
      ""
    );
  }
  return lines.filter(Boolean).join("\n");
}

export function unsignedKeyboard(db: Database): InlineKeyboardMarkup {
  const orders = listUnsignedOrders(db).slice(0, 8);
  const rows = orders.map((o) => [
    {
      text: `✍️ ${o.number}`,
      callback_data: `unsigned:remind:${o.id}`,
    },
  ]);
  rows.push([{ text: "🏠 Меню", callback_data: "menu" }]);
  return { inline_keyboard: rows };
}

export async function remindClientToSign(
  db: Database,
  orderId: string
): Promise<{ ok: boolean; message: string }> {
  const order = db.workOrders.find((o) => o.id === orderId);
  if (!order) return { ok: false, message: "Заказ-наряд не найден." };

  const user = db.users.find((u) => u.id === order.userId);
  if (!user?.telegramChatId) {
    return { ok: false, message: "У клиента нет Telegram — напомните по телефону." };
  }

  await notifyTelegramSignByPhone(db, order);
  return { ok: true, message: `✅ Напоминание отправлено: ${order.number}` };
}

export async function sendQuickStatusToClient(
  db: Database,
  orderNumber: string,
  template: "ready" | "parts" | "diagnostic"
): Promise<{ ok: boolean; message: string }> {
  const order = db.workOrders.find((o) => o.number === orderNumber);
  if (!order) return { ok: false, message: "Не найден." };
  const user = db.users.find((u) => u.id === order.userId);
  if (!user?.telegramChatId) return { ok: false, message: "Нет Telegram у клиента." };

  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  const car = vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.plate}` : order.number;

  const texts: Record<typeof template, string> = {
    ready: `✅ <b>Автомобиль готов к выдаче</b>\n\n🚗 ${car}\n📋 ${order.number}`,
    parts: `⏳ <b>Ожидаем запчасти</b>\n\n🚗 ${car}\n📋 ${order.number}\n\nСвяжемся, когда детали будут.`,
    diagnostic: `🔍 <b>Диагностика в процессе</b>\n\n🚗 ${car}\n📋 ${order.number}`,
  };

  const id = await sendTelegramMessage(user.telegramChatId, texts[template]);
  return id ? { ok: true, message: "✅ Отправлено клиенту." } : { ok: false, message: "Ошибка отправки." };
}
