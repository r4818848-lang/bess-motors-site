import { notifyAdminTelegram } from "@/lib/server/telegram-api";
import { listUnsignedOrders } from "../telegram-bot/admin-unsigned";

export async function runUnsignedNudge(db: Parameters<typeof listUnsignedOrders>[0]): Promise<boolean> {
  const orders = listUnsignedOrders(db);
  if (!orders.length) return false;
  await notifyAdminTelegram(
    `✍️ <b>Подписи:</b> ${orders.length} заказ-наряд(ов) ждут клиента.\nОткройте меню → «Подписи».`
  );
  return true;
}
