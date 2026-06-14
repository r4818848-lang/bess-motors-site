import {
  buildExpensesListMessages,
  computeExpensesTotals,
  sortExpensesNewest,
} from "@/lib/service-expenses";
import {
  sendTelegramMessage,
  updateTelegramInlineScreen,
  type InlineKeyboardMarkup,
} from "@/lib/server/telegram-api";
import { setTelegramSession } from "@/lib/server/telegram-sessions";
import type { Database } from "@/lib/store";
import { expenseMenuKeyboard } from "./keyboards";
import { EXPENSE_CATEGORY_RU } from "./labels";

function chatKey(chatId: number): string {
  return String(chatId);
}

function listBackKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [[{ text: "◀️ В меню расходов", callback_data: "exp:menu" }]],
  };
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
    `«Показать полный список» — все расходы целиком.`;

  await setTelegramSession(chatKey(chatId), { step: undefined, data: {} });

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, expenseMenuKeyboard());
  } else {
    await sendTelegramMessage(chatId, text, expenseMenuKeyboard());
  }
}

/** Full expense list — all rows, extra Telegram messages if needed (no month/page split). */
export async function showFullExpensesList(
  chatId: number,
  messageId: number | undefined,
  db: Database
): Promise<void> {
  const all = sortExpensesNewest(db.expenses);
  const messages = buildExpensesListMessages(all, {
    title: "Полный список расходов",
    categoryLabel: (c) => EXPENSE_CATEGORY_RU[c],
    emptyHint: "Расходов пока нет.",
  });

  await setTelegramSession(chatKey(chatId), { step: undefined, data: {} });

  if (!all.length) {
    const text = messages[0];
    if (messageId) {
      await updateTelegramInlineScreen(chatId, messageId, text, listBackKeyboard());
    } else {
      await sendTelegramMessage(chatId, text, listBackKeyboard());
    }
    return;
  }

  const lastIdx = messages.length - 1;
  const backKb = listBackKeyboard();

  if (messageId) {
    await updateTelegramInlineScreen(
      chatId,
      messageId,
      messages[0],
      messages.length === 1 ? backKb : undefined
    );
  } else {
    await sendTelegramMessage(
      chatId,
      messages[0],
      messages.length === 1 ? backKb : undefined
    );
  }

  for (let i = 1; i < lastIdx; i++) {
    await sendTelegramMessage(chatId, messages[i]);
  }

  if (lastIdx > 0) {
    await sendTelegramMessage(chatId, messages[lastIdx], backKb);
  }
}
