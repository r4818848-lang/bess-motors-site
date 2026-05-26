import type { ReportPeriod } from "@/lib/crm-analytics";
import { computeCrmAnalytics } from "@/lib/crm-analytics";
import { getWebsiteHotOrders } from "@/lib/hot-orders";
import { getPriceItem } from "@/lib/price-list";
import type { ExpenseCategory } from "@/lib/store";
import {
  answerCallbackQuery,
  editTelegramMessage,
  isAuthorizedChat,
  sendTelegramMessage,
} from "@/lib/server/telegram-api";
import {
  clearTelegramSession,
  getTelegramSession,
  setTelegramSession,
} from "@/lib/server/telegram-sessions";
import { addExpenseToCrm, isValidDateKey, loadCrmFromCloud, parseExpenseInput } from "./crm-actions";
import {
  formatAppointments,
  formatExpensesList,
  formatFinanceReport,
  formatHotOrders,
  formatMechanicsReport,
  formatTodaySummary,
  formatWarehouse,
  formatWorkOrderDetail,
  formatWorkOrderList,
  workOrderListKeyboard,
} from "./format";
import {
  backMenuRow,
  expenseCategoryKeyboard,
  expenseMenuKeyboard,
  financePeriodKeyboard,
  mainMenuKeyboard,
  mechanicPeriodKeyboard,
  workOrderDetailKeyboard,
} from "./keyboards";
import { BOT } from "./labels";

type TelegramMessage = {
  message_id: number;
  chat: { id: number };
  text?: string;
};

type TelegramCallback = {
  id: string;
  message?: TelegramMessage;
  data?: string;
  from?: { id: number };
};

function serviceLabel(id: string): string {
  return getPriceItem(id)?.nameRu ?? id;
}

async function replyOrEdit(
  chatId: number,
  messageId: number | undefined,
  text: string,
  keyboard = mainMenuKeyboard()
): Promise<void> {
  if (messageId) {
    const ok = await editTelegramMessage(chatId, messageId, text, keyboard);
    if (!ok) await sendTelegramMessage(chatId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

async function showMainMenu(chatId: number, messageId?: number): Promise<void> {
  await clearTelegramSession(String(chatId));
  await replyOrEdit(chatId, messageId, BOT.welcome, mainMenuKeyboard());
}

export async function handleTelegramUpdate(update: {
  message?: TelegramMessage;
  callback_query?: TelegramCallback;
}): Promise<void> {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }
  if (update.message?.text) {
    await handleMessage(update.message);
  }
}

async function handleMessage(msg: TelegramMessage): Promise<void> {
  const chatId = msg.chat.id;
  if (!isAuthorizedChat(chatId)) {
    await sendTelegramMessage(chatId, BOT.unauthorized);
    return;
  }

  const text = msg.text?.trim() ?? "";
  const chatKey = String(chatId);

  if (text === "/start" || text === "/menu") {
    await showMainMenu(chatId);
    return;
  }

  const session = await getTelegramSession(chatKey);

  if (session.step === "expense_input" && session.data?.category) {
    const parsed = parseExpenseInput(text, session.data.category as ExpenseCategory);
    if (!parsed.ok) {
      await sendTelegramMessage(chatId, BOT.invalidExpense, expenseCategoryKeyboard());
      return;
    }
    const result = await addExpenseToCrm(parsed.expense);
    await clearTelegramSession(chatKey);
    if (result.ok) {
      await sendTelegramMessage(
        chatId,
        `${BOT.saved}\n\n💸 ${parsed.expense.description}\n<b>${parsed.expense.amount.toFixed(2)} zł</b> · ${parsed.expense.date}`,
        expenseMenuKeyboard()
      );
    } else {
      await sendTelegramMessage(chatId, BOT.saveFailed, mainMenuKeyboard());
    }
    return;
  }

  if (session.step === "report_custom_from") {
    if (!isValidDateKey(text)) {
      await sendTelegramMessage(chatId, BOT.invalidDate);
      return;
    }
    await setTelegramSession(chatKey, { step: "report_custom_to", data: { from: text } });
    await sendTelegramMessage(chatId, BOT.customTo);
    return;
  }

  if (session.step === "report_custom_to" && session.data?.from) {
    if (!isValidDateKey(text)) {
      await sendTelegramMessage(chatId, BOT.invalidDate);
      return;
    }
    const from = session.data.from;
    const to = text;
    await clearTelegramSession(chatKey);

    const db = await loadCrmFromCloud();
    if (!db) {
      await sendTelegramMessage(chatId, BOT.cloudOff, mainMenuKeyboard());
      return;
    }
    const stats = computeCrmAnalytics(db, "custom", from, to);
    const report = formatFinanceReport(stats, "custom", `${from} — ${to}`);
    await sendTelegramMessage(chatId, report, financePeriodKeyboard());
    return;
  }

  if (text.startsWith("/")) {
    await sendTelegramMessage(chatId, "Используйте /start для меню CRM.", mainMenuKeyboard());
  }
}

async function handleCallback(cb: TelegramCallback): Promise<void> {
  const chatId = cb.message?.chat.id;
  const messageId = cb.message?.message_id;
  const data = cb.data ?? "";

  if (!chatId || !isAuthorizedChat(chatId)) {
    await answerCallbackQuery(cb.id, BOT.unauthorized);
    return;
  }

  if (data === "noop") {
    await answerCallbackQuery(cb.id);
    return;
  }

  await answerCallbackQuery(cb.id);

  if (data === "menu") {
    await showMainMenu(chatId, messageId);
    return;
  }

  const db = await loadCrmFromCloud();
  if (!db) {
    await replyOrEdit(chatId, messageId, BOT.cloudOff, mainMenuKeyboard());
    return;
  }

  const chatKey = String(chatId);

  if (data === "fin:menu") {
    await replyOrEdit(chatId, messageId, BOT.choosePeriod, financePeriodKeyboard());
    return;
  }

  if (data.startsWith("fin:")) {
    const period = data.slice(4) as ReportPeriod;
    if (period === "custom") {
      await setTelegramSession(chatKey, { step: "report_custom_from", data: {} });
      await replyOrEdit(chatId, messageId, BOT.customFrom, {
        inline_keyboard: [[{ text: BOT.back, callback_data: "fin:menu" }]],
      });
      return;
    }
    const stats = computeCrmAnalytics(db, period, "", "");
    const report = formatFinanceReport(stats, period);
    await replyOrEdit(chatId, messageId, report, financePeriodKeyboard());
    return;
  }

  if (data === "sum:day") {
    await replyOrEdit(chatId, messageId, formatTodaySummary(db), mainMenuKeyboard());
    return;
  }

  if (data.startsWith("wo:p:")) {
    const page = Number(data.slice(5)) || 0;
    const { text } = formatWorkOrderList(db, page);
    await replyOrEdit(chatId, messageId, text, workOrderListKeyboard(db, page));
    return;
  }

  if (data.startsWith("wo:n:")) {
    const number = data.slice(5);
    const detail = formatWorkOrderDetail(db, number);
    if (!detail) {
      await replyOrEdit(chatId, messageId, "Заказ-наряд не найден.", workOrderListKeyboard(db, 0));
      return;
    }
    await replyOrEdit(chatId, messageId, detail, workOrderDetailKeyboard(number));
    return;
  }

  if (data.startsWith("hot:")) {
    const page = Number(data.slice(4)) || 0;
    const rows = getWebsiteHotOrders(db, serviceLabel);
    const { text, totalPages } = formatHotOrders(rows, page);
    const nav = [];
    if (page > 0) nav.push({ text: "◀️", callback_data: `hot:${page - 1}` });
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
    if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `hot:${page + 1}` });
    await replyOrEdit(chatId, messageId, text, {
      inline_keyboard: [nav, backMenuRow()],
    });
    return;
  }

  if (data.startsWith("apt:")) {
    const page = Number(data.slice(4)) || 0;
    const { text, totalPages } = formatAppointments(db, page);
    const nav = [];
    if (page > 0) nav.push({ text: "◀️", callback_data: `apt:${page - 1}` });
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
    if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `apt:${page + 1}` });
    await replyOrEdit(chatId, messageId, text, {
      inline_keyboard: [nav, backMenuRow()],
    });
    return;
  }

  if (data.startsWith("mech:")) {
    const period = data.slice(5) as ReportPeriod;
    if (data === "mech:menu") {
      await replyOrEdit(chatId, messageId, BOT.choosePeriod, mechanicPeriodKeyboard());
      return;
    }
    const report = formatMechanicsReport(db, period);
    await replyOrEdit(chatId, messageId, report, mechanicPeriodKeyboard());
    return;
  }

  if (data === "exp:menu") {
    await replyOrEdit(chatId, messageId, "💸 <b>Расходы сервиса</b>", expenseMenuKeyboard());
    return;
  }

  if (data === "exp:list") {
    await replyOrEdit(chatId, messageId, formatExpensesList(db), expenseMenuKeyboard());
    return;
  }

  if (data === "exp:add") {
    await replyOrEdit(chatId, messageId, BOT.chooseCategory, expenseCategoryKeyboard());
    return;
  }

  if (data.startsWith("exp:cat:")) {
    const category = data.slice(8) as ExpenseCategory;
    await setTelegramSession(chatKey, { step: "expense_input", data: { category } });
    await replyOrEdit(chatId, messageId, BOT.expensePrompt, {
      inline_keyboard: [[{ text: "❌ Отмена", callback_data: "exp:menu" }]],
    });
    return;
  }

  if (data === "wh:0") {
    await replyOrEdit(chatId, messageId, formatWarehouse(db), mainMenuKeyboard());
    return;
  }

  await showMainMenu(chatId, messageId);
}
