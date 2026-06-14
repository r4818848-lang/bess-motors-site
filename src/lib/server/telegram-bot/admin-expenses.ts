import {
  computeExpensesTotals,
  currentMonthKey,
  filterExpensesByMonth,
  formatExpensesTable,
  formatMonthLabel,
  shiftMonthKey,
  sortExpensesNewest,
} from "@/lib/service-expenses";
import {
  sendTelegramMessage,
  updateTelegramInlineScreen,
  type InlineKeyboardMarkup,
} from "@/lib/server/telegram-api";
import {
  getTelegramSession,
  setTelegramSession,
} from "@/lib/server/telegram-sessions";
import type { Database } from "@/lib/store";
import { expenseMenuKeyboard } from "./keyboards";
import { EXPENSE_CATEGORY_RU } from "./labels";

const ALL_PAGE_SIZE = 18;

function chatKey(chatId: number): string {
  return String(chatId);
}

function sessionMonth(data: Record<string, string> | undefined): string {
  return data?.expMonth?.trim() || currentMonthKey();
}

function sessionAllPage(data: Record<string, string> | undefined): number {
  return Number.parseInt(data?.expAllPage ?? "0", 10) || 0;
}

export function expensesMonthKeyboard(month: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "◀️", callback_data: "exp:prev" },
        { text: formatMonthLabel(month), callback_data: "noop" },
        { text: "▶️", callback_data: "exp:next" },
      ],
      [{ text: "📚 Вся история", callback_data: "exp:all:0" }],
      [{ text: "◀️ В меню расходов", callback_data: "exp:menu" }],
    ],
  };
}

function expensesAllKeyboard(page: number, totalPages: number): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  if (totalPages > 1) {
    const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [];
    if (page > 0) nav.push({ text: "◀️", callback_data: `exp:all:${page - 1}` });
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
    if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `exp:all:${page + 1}` });
    rows.push(nav);
  }
  rows.push([{ text: "📅 По месяцам", callback_data: "exp:list" }]);
  rows.push([{ text: "◀️ В меню расходов", callback_data: "exp:menu" }]);
  return { inline_keyboard: rows };
}

export async function showExpensesMenu(
  chatId: number,
  messageId: number | undefined,
  db: Database
): Promise<void> {
  const total = computeExpensesTotals(db.expenses ?? []);
  const text =
    `💸 <b>Расходы сервиса</b>\n\n` +
    `Всего записей: <b>${total.count}</b>\n` +
    `Сумма: <b>${total.amount.toFixed(2)} zł</b>\n\n` +
    `«Полный список» — все расходы за выбранный месяц.\n` +
    `«Вся история» — все расходы с листанием.`;

  await setTelegramSession(chatKey(chatId), { step: undefined, data: {} });

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, expenseMenuKeyboard());
  } else {
    await sendTelegramMessage(chatId, text, expenseMenuKeyboard());
  }
}

export async function showExpensesMonthList(
  chatId: number,
  messageId: number | undefined,
  db: Database,
  month?: string
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const m = month ?? sessionMonth(session.data);
  const rows = filterExpensesByMonth(db.expenses, m);

  await setTelegramSession(chatKeyStr, {
    step: undefined,
    data: { expMonth: m },
  });

  const text = formatExpensesTable(rows, {
    title: `Расходы — ${formatMonthLabel(m)}`,
    categoryLabel: (c) => EXPENSE_CATEGORY_RU[c],
    emptyHint: "В этом месяце расходов нет.",
  });
  const keyboard = expensesMonthKeyboard(m);

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function shiftExpensesMonth(
  chatId: number,
  messageId: number | undefined,
  db: Database,
  delta: number
): Promise<void> {
  const session = await getTelegramSession(chatKey(chatId));
  const month = shiftMonthKey(sessionMonth(session.data), delta);
  await showExpensesMonthList(chatId, messageId, db, month);
}

export async function showExpensesAllList(
  chatId: number,
  messageId: number | undefined,
  db: Database,
  page = 0
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const all = sortExpensesNewest(db.expenses);
  const totalPages = Math.max(1, Math.ceil(all.length / ALL_PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = all.slice(safePage * ALL_PAGE_SIZE, (safePage + 1) * ALL_PAGE_SIZE);

  await setTelegramSession(chatKeyStr, {
    step: undefined,
    data: { expAllPage: String(safePage) },
  });

  const grand = computeExpensesTotals(all);
  const text = formatExpensesTable(slice, {
    title:
      totalPages > 1
        ? `Все расходы (${safePage + 1}/${totalPages})`
        : "Все расходы",
    subtitle: `Всего в CRM: <b>${grand.count}</b> · <b>${grand.amount.toFixed(2)} zł</b>`,
    categoryLabel: (c) => EXPENSE_CATEGORY_RU[c],
    emptyHint: "Расходов пока нет.",
  });

  const keyboard = expensesAllKeyboard(safePage, totalPages);

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}
