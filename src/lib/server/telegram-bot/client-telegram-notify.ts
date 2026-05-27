import { cleanEnvValue } from "@/lib/server/supabase-config";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import type { Database, User, WorkOrder } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { REPAIR_STATUS_RU } from "./labels";

function siteUrl(): string {
  return cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL) || "https://www.bess-motors.com";
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function vehicleLabel(db: Database, order: WorkOrder): string {
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  if (!vehicle) return order.number;
  return `${vehicle.make} ${vehicle.model} · ${vehicle.plate}`.trim() || order.number;
}

function signUrl(orderId: string): string {
  return `${siteUrl()}/sign/${orderId}`;
}

function cabinetUrl(): string {
  return `${siteUrl()}/cabinet`;
}

function signKeyboard(orderId: string) {
  return {
    inline_keyboard: [
      [{ text: "✍️ Подписать заказ-наряд", url: signUrl(orderId) }],
      [{ text: "📋 Личный кабинет", url: cabinetUrl() }],
    ],
  };
}

function orderNeedsSignature(order: WorkOrder): boolean {
  if (order.confirmationStatus === "confirmed") return false;
  return (
    order.confirmationStatus === "awaiting_confirmation" ||
    order.documentStatus === "awaiting_signature"
  );
}

async function sendToClient(
  user: User,
  text: string,
  keyboard?: { inline_keyboard: { text: string; url?: string; callback_data?: string }[][] }
): Promise<void> {
  if (!user.telegramChatId) return;
  await sendTelegramMessage(user.telegramChatId, text, keyboard);
}

export async function notifyTelegramWorkOrderChange(
  db: Database,
  order: WorkOrder,
  previous?: WorkOrder | null
): Promise<void> {
  const user = db.users.find((u) => u.id === order.userId && u.role === "client");
  if (!user?.telegramChatId) return;

  const car = esc(vehicleLabel(db, order));
  const total = calcClientTotal(order);

  const signJustRequired =
    orderNeedsSignature(order) &&
    (!previous || !orderNeedsSignature(previous));

  if (signJustRequired) {
    await sendToClient(
      user,
      [
        "✍️ <b>Требуется подпись</b>",
        "",
        `Заказ-наряд <b>${esc(order.number)}</b>`,
        `🚗 ${car}`,
        `💰 ${total.toFixed(2)} zł`,
        "",
        "Нажмите кнопку ниже, чтобы подписать документ.",
        "Регистрация не нужна — мы узнаем вас по номеру телефона.",
      ].join("\n"),
      signKeyboard(order.id)
    );
    return;
  }

  if (previous?.status !== order.status) {
    if (order.status === "ready") {
      await sendToClient(
        user,
        [
          "✅ <b>Автомобиль готов!</b>",
          "",
          `🚗 ${car}`,
          `📋 ${esc(order.number)}`,
          "",
          "Можете забрать авто в рабочие часы.",
          `🌐 ${cabinetUrl()}`,
        ].join("\n")
      );
      return;
    }

    await sendToClient(
      user,
      [
        "🔧 <b>Статус заказ-наряда обновлён</b>",
        "",
        `📋 ${esc(order.number)}`,
        `🚗 ${car}`,
        `📌 ${REPAIR_STATUS_RU[order.status]}`,
      ].join("\n")
    );
  }
}

export async function notifyTelegramAfterOrderMutation(
  orderNumber: string,
  previous?: WorkOrder | null
): Promise<void> {
  const { loadCrmFromCloud } = await import("./crm-actions");
  const db = await loadCrmFromCloud();
  if (!db) return;
  const order = db.workOrders.find((o) => o.number === orderNumber);
  if (!order) return;
  await notifyTelegramWorkOrderChange(db, order, previous);
}

export async function dispatchTelegramFromCrmSave(
  previous: Database,
  next: Database
): Promise<void> {
  for (const order of next.workOrders) {
    const old = previous.workOrders.find((o) => o.id === order.id);
    if (!old) continue;
    if (
      old.status === order.status &&
      old.confirmationStatus === order.confirmationStatus &&
      old.documentStatus === order.documentStatus
    ) {
      continue;
    }
    await notifyTelegramWorkOrderChange(next, order, old);
  }
}

export async function notifyTelegramSignByPhone(
  db: Database,
  order: WorkOrder
): Promise<void> {
  const user = db.users.find((u) => u.id === order.userId && u.role === "client");
  if (!user?.telegramChatId) return;
  if (!orderNeedsSignature(order)) return;

  const car = esc(vehicleLabel(db, order));
  await sendToClient(
    user,
    [
      "✍️ <b>Документ на подпись</b>",
      "",
      `📋 ${esc(order.number)} · ${car}`,
      "",
      "Подпишите заказ-наряд в один клик:",
    ].join("\n"),
    signKeyboard(order.id)
  );
}
