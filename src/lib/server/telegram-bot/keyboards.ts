import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import type { ReportPeriod } from "@/lib/crm-analytics";
import type { ExpenseCategory } from "@/lib/store";
import { BOT } from "./labels";

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
        { text: BOT.mechanics, callback_data: "mech:month" },
        { text: BOT.expenses, callback_data: "exp:menu" },
      ],
      [{ text: BOT.warehouse, callback_data: "wh:0" }],
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

export function workOrderDetailKeyboard(orderNumber: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "◀️ К списку", callback_data: "wo:p:0" }],
      backMenuRow(),
    ],
  };
}
