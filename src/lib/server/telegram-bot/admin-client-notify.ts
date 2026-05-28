import { sendTelegramMessage } from "@/lib/server/telegram-api";
import type { BotLocale } from "./client-i18n";
import type { Database, WorkOrder } from "@/lib/store";

export type MasterTemplate =
  | "ready"
  | "parts"
  | "diagnostic"
  | "callme"
  | "prepay"
  | "delay"
  | "partsArrived"
  | "pickup";

const MSGS: Record<MasterTemplate, Record<BotLocale, string>> = {
  ready: {
    pl: "✅ <b>Auto gotowe do odbioru!</b>\n\n🚗 {car}\n📋 {number}\n\nZapraszamy w godzinach pracy.",
    ru: "✅ <b>Автомобиль готов к выдаче!</b>\n\n🚗 {car}\n📋 {number}\n\nЖдём вас в рабочее время.",
    uk: "✅ <b>Авто готове до видачі!</b>\n\n🚗 {car}\n📋 {number}",
    en: "✅ <b>Your car is ready!</b>\n\n🚗 {car}\n📋 {number}\n\nPick up during opening hours.",
  },
  parts: {
    pl: "⏳ <b>Czekamy na części</b>\n\n🚗 {car}\n📋 {number}\n\nSkontaktujemy się, gdy będą.",
    ru: "⏳ <b>Ожидаем запчасти</b>\n\n🚗 {car}\n📋 {number}\n\nСвяжемся, когда детали будут.",
    uk: "⏳ <b>Очікуємо запчастини</b>\n\n🚗 {car}\n📋 {number}",
    en: "⏳ <b>Waiting for parts</b>\n\n🚗 {car}\n📋 {number}\n\nWe will contact you.",
  },
  diagnostic: {
    pl: "🔍 <b>Trwa diagnostyka</b>\n\n🚗 {car}\n📋 {number}",
    ru: "🔍 <b>Идёт диагностика</b>\n\n🚗 {car}\n📋 {number}",
    uk: "🔍 <b>Триває діагностика</b>\n\n🚗 {car}\n📋 {number}",
    en: "🔍 <b>Diagnostics in progress</b>\n\n🚗 {car}\n📋 {number}",
  },
  callme: {
    pl: "📞 <b>Prosimy o kontakt</b>\n\n🚗 {car}\n📋 {number}\n\nZadzwoń do warsztatu.",
    ru: "📞 <b>Нужна связь с вами</b>\n\n🚗 {car}\n📋 {number}\n\nПозвоните в сервис.",
    uk: "📞 <b>Зв'яжіться з нами</b>\n\n🚗 {car}\n📋 {number}",
    en: "📞 <b>Please call us</b>\n\n🚗 {car}\n📋 {number}",
  },
  prepay: {
    pl: "💳 <b>Przedpłata</b>\n\n🚗 {car}\n📋 {number}\n\nProsimy o zaliczkę przed zamówieniem części.",
    ru: "💳 <b>Предоплата</b>\n\n🚗 {car}\n📋 {number}\n\nНужна предоплата перед заказом запчастей.",
    uk: "💳 <b>Передоплата</b>\n\n🚗 {car}\n📋 {number}",
    en: "💳 <b>Prepayment</b>\n\n🚗 {car}\n📋 {number}",
  },
  delay: {
    pl: "⏱ <b>Opóźnienie</b>\n\n🚗 {car}\n📋 {number}\n\nPrace trwają dłużej — damy znać.",
    ru: "⏱ <b>Задержка</b>\n\n🚗 {car}\n📋 {number}\n\nРаботы затягиваются — сообщим срок.",
    uk: "⏱ <b>Затримка</b>\n\n🚗 {car}\n📋 {number}",
    en: "⏱ <b>Delay</b>\n\n🚗 {car}\n📋 {number}",
  },
  partsArrived: {
    pl: "📦 <b>Części dotarły</b>\n\n🚗 {car}\n📋 {number}\n\nWznawiamy naprawę.",
    ru: "📦 <b>Запчасти приехали</b>\n\n🚗 {car}\n📋 {number}\n\nПродолжаем ремонт.",
    uk: "📦 <b>Запчастини прибули</b>\n\n🚗 {car}\n📋 {number}",
    en: "📦 <b>Parts arrived</b>\n\n🚗 {car}\n📋 {number}",
  },
  pickup: {
    pl: "🚗 <b>Odbiór</b>\n\n🚗 {car}\n📋 {number}\n\nMożna odbierać w godzinach pracy.",
    ru: "🚗 <b>Выдача</b>\n\n🚗 {car}\n📋 {number}\n\nМожно забирать в рабочее время.",
    uk: "🚗 <b>Видача</b>\n\n🚗 {car}\n📋 {number}",
    en: "🚗 <b>Pickup</b>\n\n🚗 {car}\n📋 {number}",
  },
};

function vehicleLabel(db: Database, order: WorkOrder): string {
  const v = db.vehicles.find((x) => x.id === order.vehicleId);
  return v ? `${v.make} ${v.model} · ${v.plate}`.trim() : order.number;
}

export async function sendMasterTemplateToClient(
  db: Database,
  orderNumber: string,
  template: MasterTemplate
): Promise<{ ok: boolean; message: string }> {
  const order = db.workOrders.find((o) => o.number === orderNumber);
  if (!order) return { ok: false, message: "Заказ-наряд не найден." };

  const user = db.users.find((u) => u.id === order.userId && u.role === "client");
  if (!user?.telegramChatId) {
    return { ok: false, message: "У клиента нет Telegram." };
  }

  const loc: BotLocale = user.telegramLocale ?? "ru";
  const car = vehicleLabel(db, order);
  const text = (MSGS[template][loc] ?? MSGS[template].ru)
    .replace("{car}", car)
    .replace("{number}", order.number);

  const sent = await sendTelegramMessage(user.telegramChatId, text);
  return sent
    ? { ok: true, message: "✅ Сообщение отправлено клиенту." }
    : { ok: false, message: "Ошибка отправки." };
}

export function masterTemplateKeyboard(orderNumber: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Готов", callback_data: `wo:tpl:${orderNumber}:ready` },
        { text: "⏳ Запчасти", callback_data: `wo:tpl:${orderNumber}:parts` },
      ],
      [
        { text: "🔍 Диагностика", callback_data: `wo:tpl:${orderNumber}:diagnostic` },
        { text: "📞 Связаться", callback_data: `wo:tpl:${orderNumber}:callme` },
      ],
      [
        { text: "💳 Предоплата", callback_data: `wo:tpl:${orderNumber}:prepay` },
        { text: "⏱ Задержка", callback_data: `wo:tpl:${orderNumber}:delay` },
      ],
      [
        { text: "📦 Запчасти ✓", callback_data: `wo:tpl:${orderNumber}:partsArrived` },
        { text: "🚗 Выдача", callback_data: `wo:tpl:${orderNumber}:pickup` },
      ],
      [{ text: "◀️ Назад", callback_data: `wo:n:${orderNumber}` }],
    ],
  };
}
