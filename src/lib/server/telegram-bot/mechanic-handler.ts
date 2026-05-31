import type { ReportPeriod } from "@/lib/crm-analytics";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import {
  answerCallbackQuery,
  type InlineKeyboardButton,
  type InlineKeyboardMarkup,
  updateTelegramInlineScreen,
} from "@/lib/server/telegram-api";
import type { RepairStatus } from "@/lib/store";
import { calcMechanicEarnings } from "@/lib/workorder-calc";
import { filterOpenWorkOrders } from "@/lib/work-order-lifecycle";
import { applyWorkOrderStatus, loadCrmFromCloud } from "./crm-actions";
import { esc, formatWorkOrderDetail } from "./format";
import { REPAIR_STATUS_RU } from "./labels";
import type { MechanicActor } from "./telegram-actor";
import { linkMechanicTelegram } from "./telegram-actor";

type TelegramMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
};

type TelegramCallback = {
  id: string;
  message?: TelegramMessage;
  data?: string;
};

const MECH = {
  welcome: (name: string) =>
    `🔧 <b>Панель механика</b>\n\n👷 ${esc(name)}\n\nЗаказы и статусы синхронизируются с CRM и сайтом.`,
  cloudOff: "☁️ Облако CRM недоступно.",
  linkHint:
    "🔗 <b>Привязка Telegram</b>\n\nОтправьте одной строкой:\n<code>/linkmech +48XXXXXXXXX пароль</code>\n\nПароль — как на сайте bess-motors.com/mechanic",
  noOrders: "✅ Нет активных заказ-нарядов на вас.",
  saved: "✅ Статус сохранён в CRM.",
  saveFailed: "❌ Не удалось сохранить в облако.",
  unknown: "⚠️ Команда не распознана.",
};

const QUICK_NEXT: Partial<Record<RepairStatus, RepairStatus>> = {
  received: "diagnostic",
  diagnostic: "repair",
  waitingParts: "repair",
  repair: "ready",
  ready: "delivered",
};

function siteBase(): string {
  return cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL) || "https://www.bess-motors.com";
}

function mechanicMainKeyboard(): InlineKeyboardMarkup {
  const site = siteBase();
  return {
    inline_keyboard: [
      [{ text: "📋 Мои заказы", callback_data: "mch:orders:0" }],
      [{ text: "💰 Зарплата (месяц)", callback_data: "mch:salary" }],
      [
        { text: "🌐 Панель на сайте", url: `${site}/mechanic` },
        { text: "📅 Календарь", url: `${site}/mechanic?view=calendar` },
      ],
      [{ text: "🏠 Меню", callback_data: "mch:menu" }],
    ],
  };
}

function mechanicOrdersKeyboard(
  orders: { id: string; number: string; status: RepairStatus }[],
  page: number,
  pageSize = 5
): InlineKeyboardMarkup {
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const slice = orders.slice(page * pageSize, page * pageSize + pageSize);
  const rows: InlineKeyboardButton[][] = slice.map((o) => [
    {
      text: `${o.number} · ${REPAIR_STATUS_RU[o.status]}`,
      callback_data: `mch:wo:${o.id}`,
    },
  ]);
  const nav: InlineKeyboardButton[] = [];
  if (page > 0) nav.push({ text: "◀️", callback_data: `mch:orders:${page - 1}` });
  nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
  if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `mch:orders:${page + 1}` });
  if (nav.length) rows.push(nav);
  rows.push([{ text: "🏠 Меню", callback_data: "mch:menu" }]);
  return { inline_keyboard: rows };
}

function mechanicOrderKeyboard(
  orderId: string,
  status: RepairStatus
): InlineKeyboardMarkup {
  const next = QUICK_NEXT[status];
  const rows: InlineKeyboardButton[][] = [];
  if (next) {
    rows.push([
      {
        text: `➡️ ${REPAIR_STATUS_RU[next]}`,
        callback_data: `mch:adv:${orderId}:${next}`,
      },
    ]);
  }
  rows.push([{ text: "◀️ К списку", callback_data: "mch:orders:0" }]);
  rows.push([{ text: "🏠 Меню", callback_data: "mch:menu" }]);
  return { inline_keyboard: rows };
}

function formatMechanicOrders(
  actor: MechanicActor,
  db: import("@/lib/store").Database,
  page: number
): { text: string; orders: { id: string; number: string; status: RepairStatus }[] } {
  const orders = filterOpenWorkOrders(
    db.workOrders.filter((o) => o.mechanicId === actor.mechanicId)
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!orders.length) {
    return { text: MECH.noOrders, orders: [] };
  }

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const slice = orders.slice(page * pageSize, page * pageSize + pageSize);
  const lines = [
    `📋 <b>Мои заказы</b> (${orders.length}) · стр. ${page + 1}/${totalPages}`,
    "",
  ];
  for (const o of slice) {
    const client = db.users.find((u) => u.id === o.userId);
    const vehicle = db.vehicles.find((v) => v.id === o.vehicleId);
    lines.push(
      `<b>${esc(o.number)}</b> — ${REPAIR_STATUS_RU[o.status]}`,
      client ? `👤 ${esc(client.name)}` : "",
      vehicle ? `🚗 ${esc(vehicle.plate)}` : "",
      ""
    );
  }
  return {
    text: lines.filter(Boolean).join("\n"),
    orders: orders.map((o) => ({ id: o.id, number: o.number, status: o.status })),
  };
}

function formatMechanicSalary(
  actor: MechanicActor,
  db: import("@/lib/store").Database
): string {
  const profile = db.mechanics.find((m) => m.id === actor.mechanicId);
  if (!profile) return "❌ Профиль механика не найден.";

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const myOrders = db.workOrders.filter((o) => o.mechanicId === actor.mechanicId);
  const monthOrders = myOrders.filter((o) => o.createdAt.startsWith(ym));

  let monthTotal = 0;
  for (const o of monthOrders) {
    monthTotal += calcMechanicEarnings(o, db.settings, profile).total;
  }

  const active = filterOpenWorkOrders(myOrders).length;
  const today = now.toISOString().slice(0, 10);
  const readyToday = myOrders.filter(
    (o) => o.status === "ready" && (o.updatedAt ?? "").slice(0, 10) === today
  ).length;

  return [
    `💰 <b>Зарплата — ${esc(actor.name)}</b>`,
    "",
    `📅 Месяц (${ym}): <b>${monthTotal.toFixed(2)} zł</b>`,
    `🔧 Активных заказов: ${active}`,
    `✅ Готово сегодня: ${readyToday}`,
    "",
    `Подробности: ${siteBase()}/mechanic`,
  ].join("\n");
}

async function mechReply(
  chatId: number,
  messageId: number | undefined,
  text: string,
  keyboard = mechanicMainKeyboard()
): Promise<void> {
  await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
}

export async function handleMechanicTelegramUpdate(
  update: { message?: TelegramMessage; callback_query?: TelegramCallback },
  actor: MechanicActor
): Promise<void> {
  if (update.callback_query) {
    await handleMechanicCallback(update.callback_query, actor);
    return;
  }
  if (update.message?.text) {
    await handleMechanicMessage(update.message, actor);
  }
}

async function handleMechanicMessage(
  msg: TelegramMessage,
  actor: MechanicActor
): Promise<void> {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() ?? "";

  if (text === "/start" || text === "/menu") {
    await mechReply(chatId, undefined, MECH.welcome(actor.name));
    return;
  }

  if (text.startsWith("/linkmech")) {
    const parts = text.split(/\s+/);
    const phone = parts[1];
    const password = parts[2];
    if (!phone || !password) {
      await mechReply(chatId, undefined, MECH.linkHint);
      return;
    }
    const res = await linkMechanicTelegram(chatId, phone, password);
    await mechReply(chatId, undefined, res.message);
    return;
  }

  if (text === "/help") {
    await mechReply(
      chatId,
      undefined,
      `${MECH.welcome(actor.name)}\n\n${MECH.linkHint}`
    );
    return;
  }

  await mechReply(chatId, undefined, `${MECH.unknown}\n\n${MECH.linkHint}`);
}

async function handleMechanicCallback(
  cb: TelegramCallback,
  actor: MechanicActor
): Promise<void> {
  const chatId = cb.message?.chat.id;
  const messageId = cb.message?.message_id;
  const data = cb.data ?? "";

  if (!chatId) {
    await answerCallbackQuery(cb.id, "Ошибка чата");
    return;
  }

  if (data === "noop") {
    await answerCallbackQuery(cb.id);
    return;
  }

  await answerCallbackQuery(cb.id);

  if (data === "mch:menu") {
    await mechReply(chatId, messageId, MECH.welcome(actor.name));
    return;
  }

  const db = await loadCrmFromCloud();
  if (!db) {
    await mechReply(chatId, messageId, MECH.cloudOff);
    return;
  }

  if (data.startsWith("mch:orders:")) {
    const page = Number(data.slice(11)) || 0;
    const { text, orders } = formatMechanicOrders(actor, db, page);
    await mechReply(chatId, messageId, text, mechanicOrdersKeyboard(orders, page));
    return;
  }

  if (data === "mch:salary") {
    await mechReply(chatId, messageId, formatMechanicSalary(actor, db), mechanicMainKeyboard());
    return;
  }

  if (data.startsWith("mch:wo:")) {
    const orderId = data.slice(7);
    const order = db.workOrders.find(
      (o) => o.id === orderId && o.mechanicId === actor.mechanicId
    );
    if (!order) {
      await mechReply(chatId, messageId, "❌ Заказ не найден.", mechanicMainKeyboard());
      return;
    }
    const detail = formatWorkOrderDetail(db, order.number);
    await mechReply(
      chatId,
      messageId,
      detail ?? order.number,
      mechanicOrderKeyboard(order.id, order.status)
    );
    return;
  }

  if (data.startsWith("mch:adv:")) {
    const rest = data.slice(8);
    const colon = rest.lastIndexOf(":");
    const orderId = rest.slice(0, colon);
    const status = rest.slice(colon + 1) as RepairStatus;
    const order = db.workOrders.find(
      (o) => o.id === orderId && o.mechanicId === actor.mechanicId
    );
    if (!order || !REPAIR_STATUS_RU[status]) {
      await mechReply(chatId, messageId, MECH.saveFailed, mechanicMainKeyboard());
      return;
    }
    const result = await applyWorkOrderStatus(order.number, status);
    const freshDb = (await loadCrmFromCloud()) ?? db;
    const freshOrder = freshDb.workOrders.find((o) => o.id === orderId);
    if (!result.ok || !freshOrder) {
      await mechReply(chatId, messageId, MECH.saveFailed, mechanicMainKeyboard());
      return;
    }
    const detail = formatWorkOrderDetail(freshDb, freshOrder.number);
    await mechReply(
      chatId,
      messageId,
      `${MECH.saved}\n\n${detail ?? freshOrder.number}`,
      mechanicOrderKeyboard(freshOrder.id, freshOrder.status)
    );
    return;
  }

  await mechReply(chatId, messageId, MECH.unknown);
}

/** Shop load periods for admin «Загрузка цеха» */
export function mechanicDashKeyboard(): InlineKeyboardMarkup {
  const periods: { label: string; p: ReportPeriod }[] = [
    { label: "📅 День", p: "day" },
    { label: "📅 Неделя", p: "week" },
    { label: "📅 Месяц", p: "month" },
  ];
  return {
    inline_keyboard: [
      periods.map(({ label, p }) => ({ text: label, callback_data: `mech:dash:${p}` })),
      [{ text: "🏠 Меню", callback_data: "menu" }],
    ],
  };
}
