import {
  createMonthlyPartEntry,
  currentMonthKey,
  formatMonthLabel,
  formatMonthlyPartsList,
  parseMonthlyPartLines,
  shiftMonthKey,
  type MonthlyPartEntry,
} from "@/lib/monthly-parts";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import {
  sendTelegramMessage,
  updateTelegramInlineScreen,
  type InlineKeyboardMarkup,
} from "@/lib/server/telegram-api";
import {
  clearTelegramSession,
  getTelegramSession,
  setTelegramSession,
} from "@/lib/server/telegram-sessions";
import type { Database } from "@/lib/store";
import { BOT } from "./labels";
import { mainMenuKeyboard } from "./keyboards";

function chatKey(chatId: number): string {
  return String(chatId);
}

function sessionMonth(data: Record<string, string> | undefined): string {
  return data?.partsMonth?.trim() || currentMonthKey();
}

export function monthlyPartsMenuKeyboard(month: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "➕ Добавить позиции", callback_data: "parts:add" }],
      [{ text: "📋 Показать список", callback_data: "parts:list" }],
      [
        { text: "◀️", callback_data: "parts:prev" },
        { text: formatMonthLabel(month), callback_data: "noop" },
        { text: "▶️", callback_data: "parts:next" },
      ],
      [{ text: BOT.menu, callback_data: "menu" }],
    ],
  };
}

function addModeKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "📋 Список месяца", callback_data: "parts:list" }],
      [{ text: "✅ Готово", callback_data: "parts:done" }],
      [{ text: BOT.cancel, callback_data: "menu" }],
    ],
  };
}

const ADD_PROMPT =
  "➕ <b>Добавить запчасти</b>\n\n" +
  "Одна строка = одна позиция. Можно несколько строк сразу.\n\n" +
  "<b>Формат:</b>\n" +
  "<code>Название; номер; закуп; продажа</code>\n\n" +
  "Примеры:\n" +
  "<code>Filtr oleju Mann; HU7008z; 22; 45</code>\n" +
  "<code>Klocki hamulcowe; 120; 280</code> (без номера)\n\n" +
  "Месяц: <b>{month}</b>";

export async function showMonthlyPartsMenu(
  chatId: number,
  messageId: number | undefined,
  month?: string
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const m = month ?? sessionMonth(session.data);
  await setTelegramSession(chatKeyStr, {
    step: undefined,
    data: { partsMonth: m },
  });

  const text =
    `📦 <b>Месячный список запчастей</b>\n\n` +
    `Месяц: <b>${formatMonthLabel(m)}</b>\n\n` +
    `Добавляйте название, номер, цену закупки и продажи — данные сохраняются в CRM.`;

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, monthlyPartsMenuKeyboard(m));
  } else {
    await sendTelegramMessage(chatId, text, monthlyPartsMenuKeyboard(m));
  }
}

export async function startMonthlyPartsAdd(
  chatId: number,
  messageId?: number
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data);
  await setTelegramSession(chatKeyStr, {
    step: "admin_parts_input",
    data: { partsMonth: month },
  });
  const text = ADD_PROMPT.replace("{month}", formatMonthLabel(month));
  const keyboard = addModeKeyboard();
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function showMonthlyPartsList(
  chatId: number,
  messageId: number | undefined,
  db: Database,
  month: string
): Promise<void> {
  const text = formatMonthlyPartsList(db.monthlyParts ?? [], month);
  const keyboard = monthlyPartsMenuKeyboard(month);
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function shiftMonthlyPartsMonth(
  chatId: number,
  messageId: number | undefined,
  delta: number
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = shiftMonthKey(sessionMonth(session.data), delta);
  await setTelegramSession(chatKeyStr, {
    step: session.step,
    data: { ...(session.data ?? {}), partsMonth: month },
  });
  await showMonthlyPartsMenu(chatId, messageId, month);
}

export async function handleMonthlyPartsStepText(
  chatId: number,
  text: string
): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  if (session.step !== "admin_parts_input") return false;

  const month = sessionMonth(session.data);
  const { entries, invalidLines } = parseMonthlyPartLines(text);

  if (!entries.length) {
    await sendTelegramMessage(
      chatId,
      `${BOT.partsInvalid}\n\n${ADD_PROMPT.replace("{month}", formatMonthLabel(month))}`,
      addModeKeyboard()
    );
    return true;
  }

  const toAdd: MonthlyPartEntry[] = [];
  for (const e of entries) {
    if (e.ok) toAdd.push(createMonthlyPartEntry(month, e));
  }

  const put = await cloudMutateCrmStore((db) => {
    if (!db.monthlyParts) db.monthlyParts = [];
    db.monthlyParts.push(...toAdd);
  });

  if (!put.ok) {
    await sendTelegramMessage(chatId, BOT.saveFailed, addModeKeyboard());
    return true;
  }

  let totalBuy = 0;
  let totalSell = 0;
  for (const e of toAdd) {
    totalBuy += e.purchasePrice;
    totalSell += e.sellPrice;
  }

  const summary = toAdd
    .slice(0, 5)
    .map(
      (e) =>
        `• ${e.name}${e.partNumber ? ` (${e.partNumber})` : ""} — ${e.purchasePrice}→${e.sellPrice} zł`
    )
    .join("\n");
  const more = toAdd.length > 5 ? `\n… +${toAdd.length - 5} поз.` : "";

  await sendTelegramMessage(
    chatId,
    `${BOT.saved}\n\n` +
      `Добавлено: <b>${toAdd.length}</b>` +
      (invalidLines ? ` (пропущено строк: ${invalidLines})` : "") +
      `\nΣ закуп: ${totalBuy.toFixed(2)} zł · Σ продажа: ${totalSell.toFixed(2)} zł\n\n` +
      summary +
      more +
      `\n\nОтправьте ещё строки или «Готово».`,
    addModeKeyboard()
  );
  return true;
}

export async function finishMonthlyPartsInput(
  chatId: number,
  messageId?: number
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data);
  await setTelegramSession(chatKeyStr, { step: undefined, data: { partsMonth: month } });
  await showMonthlyPartsMenu(chatId, messageId, month);
}
