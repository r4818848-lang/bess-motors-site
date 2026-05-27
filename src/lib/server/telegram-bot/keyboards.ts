import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import type { ReportPeriod } from "@/lib/crm-analytics";
import type { ExpenseCategory, RepairStatus } from "@/lib/store";
import type { HotOrderRow } from "@/lib/hot-orders";
import { REPAIR_STATUS_RU } from "./labels";
import { BOT } from "./labels";

const STATUSES: RepairStatus[] = [
  "received",
  "diagnostic",
  "repair",
  "waitingParts",
  "ready",
  "delivered",
];

export function mainMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: BOT.todaySummary, callback_data: "sum:day" }],
      [
        { text: BOT.finance, callback_data: "fin:menu" },
        { text: BOT.workOrders, callback_data: "wo:p:0" },
      ],
      [
        { text: BOT.hotOrders, callback_data: "hot:0" },
        { text: BOT.appointments, callback_data: "apt:0" },
      ],
      [
        { text: BOT.unpaid, callback_data: "unpaid:0" },
        { text: BOT.search, callback_data: "search:menu" },
      ],
      [
        { text: BOT.mechanics, callback_data: "mech:menu" },
        { text: BOT.expenses, callback_data: "exp:menu" },
      ],
      [
        { text: BOT.analytics, callback_data: "an:menu" },
        { text: BOT.warehouse, callback_data: "wh:0" },
      ],
      [{ text: BOT.help, callback_data: "help" }],
    ],
  };
}

export function backMenuRow(): InlineKeyboardMarkup["inline_keyboard"][number] {
  return [{ text: BOT.menu, callback_data: "menu" }];
}

export function financePeriodKeyboard(): InlineKeyboardMarkup {
  const periods: ReportPeriod[] = ["day", "week", "month", "year", "2years", "custom"];
  const rows: InlineKeyboardMarkup["inline_keyboard"] = periods.map((p) => [
    { text: PERIOD_LABEL(p), callback_data: `fin:${p}` },
  ]);
  rows.push(backMenuRow());
  return { inline_keyboard: rows };
}

function PERIOD_LABEL(p: ReportPeriod): string {
  const map: Record<ReportPeriod, string> = {
    day: "📅 За день",
    week: "📅 За неделю",
    month: "📅 За месяц",
    year: "📅 За год",
    "2years": "📅 За 2 года",
    custom: "📅 Свой период",
  };
  return map[p];
}

export function expenseMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "➕ Добавить расход", callback_data: "exp:add" }],
      [{ text: "📋 Последние расходы", callback_data: "exp:list" }],
      backMenuRow(),
    ],
  };
}

export function expenseCategoryKeyboard(): InlineKeyboardMarkup {
  const cats: ExpenseCategory[] = [
    "rent",
    "tax",
    "purchase",
    "tools",
    "utilities",
    "marketing",
    "salary",
    "other",
  ];
  const rows = cats.map((c) => [
    { text: EXPENSE_CAT_LABEL(c), callback_data: `exp:cat:${c}` },
  ]);
  rows.push([{ text: BOT.back, callback_data: "exp:menu" }]);
  return { inline_keyboard: rows };
}

function EXPENSE_CAT_LABEL(c: ExpenseCategory): string {
  const map: Record<ExpenseCategory, string> = {
    rent: "🏠 Аренда",
    tax: "📑 Налоги",
    purchase: "📦 Закупки",
    tools: "🔧 Инструмент",
    utilities: "💡 Коммунальные",
    marketing: "📣 Реклама",
    salary: "💰 Зарплаты",
    other: "📎 Прочее",
  };
  return map[c];
}

export function mechanicPeriodKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "За день", callback_data: "mech:day" },
        { text: "За неделю", callback_data: "mech:week" },
      ],
      [
        { text: "За месяц", callback_data: "mech:month" },
        { text: "За год", callback_data: "mech:year" },
      ],
      backMenuRow(),
    ],
  };
}

export function paginateRow(prefix: string, page: number, totalPages: number): InlineKeyboardMarkup["inline_keyboard"][0] {
  const row: InlineKeyboardMarkup["inline_keyboard"][0] = [];
  if (page > 0) row.push({ text: "◀️", callback_data: `${prefix}:${page - 1}` });
  row.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
  if (page < totalPages - 1) row.push({ text: "▶️", callback_data: `${prefix}:${page + 1}` });
  return row;
}

export function workOrderDetailKeyboard(
  orderNumber: string,
  isPaid: boolean
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: BOT.changeStatus, callback_data: `wo:chg:${orderNumber}` }],
      [
        {
          text: isPaid ? BOT.markUnpaid : BOT.markPaid,
          callback_data: isPaid ? `wo:unpay:${orderNumber}` : `wo:pay:${orderNumber}`,
        },
      ],
      [{ text: "◀️ К списку", callback_data: "wo:p:0" }],
      backMenuRow(),
    ],
  };
}

export function workOrderStatusPickKeyboard(orderNumber: string): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  for (let i = 0; i < STATUSES.length; i += 2) {
    const chunk = STATUSES.slice(i, i + 2);
    rows.push(
      chunk.map((s) => ({
        text: REPAIR_STATUS_RU[s],
        callback_data: `wo:pre:${orderNumber}:${s}`,
      }))
    );
  }
  rows.push([{ text: BOT.back, callback_data: `wo:n:${orderNumber}` }]);
  return { inline_keyboard: rows };
}

export function workOrderStatusConfirmKeyboard(
  orderNumber: string,
  status: RepairStatus
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: BOT.confirmStatus,
          callback_data: `wo:cf:${orderNumber}:${status}`,
        },
      ],
      [
        { text: BOT.cancel, callback_data: `wo:n:${orderNumber}` },
      ],
    ],
  };
}

export function hotOrdersListKeyboard(rows: HotOrderRow[], page: number, pageSize = 5): InlineKeyboardMarkup {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const slice = rows.slice(page * pageSize, page * pageSize + pageSize);

  const kb: InlineKeyboardMarkup["inline_keyboard"] = slice.map((r) => {
    const prefix = r.kind === "booking" ? "b" : "c";
    const label =
      r.kind === "booking"
        ? `📅 ${r.clientName.slice(0, 12)} · ${r.date ?? ""}`
        : `📞 ${r.clientName.slice(0, 12)}`;
    return [{ text: label, callback_data: `hot:d:${prefix}:${r.id}` }];
  });

  const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [];
  if (page > 0) nav.push({ text: "◀️", callback_data: `hot:${page - 1}` });
  nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
  if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `hot:${page + 1}` });
  if (nav.length) kb.push(nav);
  kb.push(backMenuRow());
  return { inline_keyboard: kb };
}

export function hotBookingDetailKeyboard(aptId: string, hasWorkOrder: boolean): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  if (!hasWorkOrder) {
    rows.push([{ text: BOT.confirmBooking, callback_data: `hot:cb:${aptId}` }]);
  }
  rows.push(backMenuRow());
  return { inline_keyboard: rows };
}

export function hotCallDetailKeyboard(callId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: BOT.markCalled, callback_data: `hot:cl:${callId}` }],
      backMenuRow(),
    ],
  };
}

export function unpaidOrdersKeyboard(
  orders: { number: string }[],
  page: number,
  pageSize = 5
): InlineKeyboardMarkup {
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const slice = orders.slice(page * pageSize, page * pageSize + pageSize);

  const kb: InlineKeyboardMarkup["inline_keyboard"] = slice.map((o) => [
    { text: o.number, callback_data: `wo:n:${o.number}` },
  ]);

  const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [];
  if (page > 0) nav.push({ text: "◀️", callback_data: `unpaid:${page - 1}` });
  nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
  if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `unpaid:${page + 1}` });
  if (nav.length) kb.push(nav);
  kb.push(backMenuRow());
  return { inline_keyboard: kb };
}

export function analyticsKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "👥 Топ клиентов (месяц)", callback_data: "an:clients" }],
      [{ text: "📣 Маркетинг (месяц)", callback_data: "an:marketing" }],
      [{ text: "📊 Сравнение месяцев", callback_data: "an:compare" }],
      backMenuRow(),
    ],
  };
}

export function searchResultsKeyboard(numbers: string[]): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup["inline_keyboard"] = numbers.slice(0, 8).map((n) => [
    { text: n, callback_data: `wo:n:${n}` },
  ]);
  rows.push(backMenuRow());
  return { inline_keyboard: rows };
}
