import {
  createMonthlyPartEntry,
  currentMonthKey,
  formatMoneyPln,
  formatMonthLabel,
  formatMonthlyPartsTable,
  MONTHLY_PARTS_VAT_RATE,
  nettoToBrutto,
  parsePartMoneyInput,
  shiftMonthKey,
  filterMonthlyParts,
} from "@/lib/monthly-parts";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
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

const PARTS_STEPS = ["name", "number", "purchase", "sell"] as const;
type PartsWizardStep = (typeof PARTS_STEPS)[number];

const DELETE_PAGE_SIZE = 8;

function chatKey(chatId: number): string {
  return String(chatId);
}

function sessionMonth(data: Record<string, string> | undefined): string {
  return data?.partsMonth?.trim() || currentMonthKey();
}

function wizardStep(data: Record<string, string> | undefined): PartsWizardStep {
  const s = data?.partsStep as PartsWizardStep | undefined;
  return s && PARTS_STEPS.includes(s) ? s : "name";
}

function nextStep(current: PartsWizardStep): PartsWizardStep {
  const idx = PARTS_STEPS.indexOf(current);
  return idx < PARTS_STEPS.length - 1 ? PARTS_STEPS[idx + 1] : "sell";
}

function prevStep(current: PartsWizardStep): PartsWizardStep {
  const idx = PARTS_STEPS.indexOf(current);
  return idx > 0 ? PARTS_STEPS[idx - 1] : "name";
}

function stepPrompt(step: PartsWizardStep, month: string): string {
  const vat = Math.round(MONTHLY_PARTS_VAT_RATE * 100);
  const map: Record<PartsWizardStep, string> = {
    name: "📦 <b>Шаг 1/4 — Название</b>\n\nВведите название запчасти:",
    number:
      "🔢 <b>Шаг 2/4 — Номер (артикул)</b>\n\nВведите номер детали или нажмите «Пропустить»:",
    purchase:
      `💰 <b>Шаг 3/4 — Цена закупки</b>\n\nВведите цену закупки <b>нетто</b> (zł).\nБрутто (+${vat}% VAT) посчитается автоматически.`,
    sell:
      `💵 <b>Шаг 4/4 — Цена продажи</b>\n\nВведите цену продажи <b>нетто</b> (zł).\nМесяц: <b>${formatMonthLabel(month)}</b>`,
  };
  return map[step];
}

function wizardKeyboard(step: PartsWizardStep): InlineKeyboardMarkup {
  const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [
    { text: "◀️ Назад", callback_data: "parts:back" },
    { text: BOT.cancel, callback_data: "menu" },
  ];
  if (step === "number") {
    return {
      inline_keyboard: [
        [{ text: "⏭ Пропустить", callback_data: "parts:skip" }],
        nav,
      ],
    };
  }
  if (step === "name") {
    return { inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]] };
  }
  return { inline_keyboard: [nav] };
}

function afterSaveKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "➕ Ещё одна позиция", callback_data: "parts:add" }],
      [{ text: "📋 Список месяца", callback_data: "parts:list" }],
      [{ text: BOT.menu, callback_data: "parts:menu" }],
    ],
  };
}

export function monthlyPartsMenuKeyboard(month: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "➕ Добавить", callback_data: "parts:add" }],
      [{ text: "📋 Показать список", callback_data: "parts:list" }],
      [{ text: "🗑 Удалить позицию", callback_data: "parts:del" }],
      [
        { text: "◀️", callback_data: "parts:prev" },
        { text: formatMonthLabel(month), callback_data: "noop" },
        { text: "▶️", callback_data: "parts:next" },
      ],
      [{ text: BOT.menu, callback_data: "menu" }],
    ],
  };
}

async function persistWizardStep(
  chatId: number,
  messageId: number | undefined,
  data: Record<string, string>,
  step: PartsWizardStep
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const month = sessionMonth(data);
  await setTelegramSession(chatKeyStr, {
    step: "admin_parts_wizard",
    data: { ...data, partsMonth: month, partsStep: step },
  });
  const text = stepPrompt(step, month);
  const keyboard = wizardKeyboard(step);
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

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
    `Пошагово: название → номер → закуп (нетто) → продажа (нетто).\n` +
    `Брутто с VAT ${Math.round(MONTHLY_PARTS_VAT_RATE * 100)}% считается автоматически.`;

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
  await persistWizardStep(
    chatId,
    messageId,
    { partsMonth: month },
    "name"
  );
}

export async function showMonthlyPartsList(
  chatId: number,
  messageId: number | undefined,
  db: Database,
  month: string
): Promise<void> {
  const text = formatMonthlyPartsTable(db.monthlyParts ?? [], month);
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

async function saveWizardPart(
  _chatId: number,
  data: Record<string, string>
): Promise<{ ok: boolean; entry?: ReturnType<typeof createMonthlyPartEntry>; error?: string }> {
  const month = sessionMonth(data);
  const name = data.partsName?.trim();
  const purchase = parsePartMoneyInput(data.partsPurchase ?? "");
  const sell = parsePartMoneyInput(data.partsSell ?? "");

  if (!name || purchase == null || sell == null) {
    return { ok: false };
  }

  const entry = createMonthlyPartEntry(month, {
    name,
    partNumber: data.partsNumber?.trim() ?? "",
    purchasePrice: purchase,
    sellPrice: sell,
  });

  const put = await cloudMutateCrmStore((db) => {
    if (!db.monthlyParts) db.monthlyParts = [];
    db.monthlyParts.push(entry);
  });

  if (!put.ok) return { ok: false, error: put.error };
  return { ok: true, entry };
}

function formatSavedSummary(entry: ReturnType<typeof createMonthlyPartEntry>): string {
  const buyB = nettoToBrutto(entry.purchasePrice);
  const sellB = nettoToBrutto(entry.sellPrice);
  const num = entry.partNumber ? `\n🔢 <code>${entry.partNumber}</code>` : "";
  return (
    `${BOT.saved}\n\n` +
    `<b>${entry.name}</b>${num}\n\n` +
    `Закуп: <b>${formatMoneyPln(entry.purchasePrice)}</b> нет / <b>${formatMoneyPln(buyB)}</b> брут\n` +
    `Продажа: <b>${formatMoneyPln(entry.sellPrice)}</b> нет / <b>${formatMoneyPln(sellB)}</b> брут\n` +
    `Маржа: <b>${formatMoneyPln(entry.sellPrice - entry.purchasePrice)}</b> нет / ` +
    `<b>${formatMoneyPln(sellB - buyB)}</b> брут`
  );
}

export async function handleMonthlyPartsWizardText(
  chatId: number,
  text: string
): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  if (session.step !== "admin_parts_wizard") return false;

  const data = { ...(session.data ?? {}) };
  const step = wizardStep(data);
  const trimmed = text.trim();

  if (step === "name") {
    if (trimmed.length < 2) {
      await sendTelegramMessage(chatId, "❌ Введите название (мин. 2 символа).", wizardKeyboard("name"));
      return true;
    }
    data.partsName = trimmed;
    await persistWizardStep(chatId, undefined, data, "number");
    return true;
  }

  if (step === "number") {
    data.partsNumber = trimmed;
    await persistWizardStep(chatId, undefined, data, "purchase");
    return true;
  }

  if (step === "purchase") {
    const price = parsePartMoneyInput(trimmed);
    if (price == null) {
      await sendTelegramMessage(
        chatId,
        "❌ Неверная цена. Пример: <code>22</code> или <code>22,50</code>",
        wizardKeyboard("purchase")
      );
      return true;
    }
    data.partsPurchase = String(price);
    await persistWizardStep(chatId, undefined, data, "sell");
    return true;
  }

  if (step === "sell") {
    const price = parsePartMoneyInput(trimmed);
    if (price == null) {
      await sendTelegramMessage(
        chatId,
        "❌ Неверная цена. Пример: <code>45</code> или <code>45,90</code>",
        wizardKeyboard("sell")
      );
      return true;
    }
    data.partsSell = String(price);

    const saved = await saveWizardPart(chatId, data);
    if (!saved.ok || !saved.entry) {
      const hint =
        saved.ok === false
          ? "\n\nПроверьте интернет и попробуйте ещё раз."
          : "";
      await sendTelegramMessage(chatId, `${BOT.saveFailed}${hint}`, wizardKeyboard("sell"));
      return true;
    }

    await setTelegramSession(chatKeyStr, {
      step: undefined,
      data: { partsMonth: sessionMonth(data) },
    });
    await sendTelegramMessage(chatId, formatSavedSummary(saved.entry), afterSaveKeyboard());
    return true;
  }

  return false;
}

export async function handleMonthlyPartsWizardCallback(
  chatId: number,
  messageId: number | undefined,
  action: "skip" | "back"
): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  if (session.step !== "admin_parts_wizard") return false;

  const data = { ...(session.data ?? {}) };
  const current = wizardStep(data);

  if (action === "back") {
    const prev = prevStep(current);
    await persistWizardStep(chatId, messageId, data, prev);
    return true;
  }

  if (action === "skip" && current === "number") {
    data.partsNumber = "";
    await persistWizardStep(chatId, messageId, data, "purchase");
    return true;
  }

  return false;
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

function deleteMenuKeyboard(
  month: string,
  rows: { id: string; label: string }[],
  page: number,
  totalPages: number
): InlineKeyboardMarkup {
  const keyboard: InlineKeyboardMarkup["inline_keyboard"] = rows.map((r) => [
    { text: `🗑 ${r.label}`, callback_data: `parts:rm:${r.id}` },
  ]);

  if (totalPages > 1) {
    const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [];
    if (page > 0) nav.push({ text: "◀️", callback_data: `parts:delp:${page - 1}` });
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
    if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `parts:delp:${page + 1}` });
    keyboard.push(nav);
  }

  keyboard.push([{ text: BOT.back, callback_data: "parts:menu" }]);
  return { inline_keyboard: keyboard };
}

export async function showMonthlyPartsDeleteMenu(
  chatId: number,
  messageId: number | undefined,
  db: Database,
  month: string,
  page = 0
): Promise<void> {
  const rows = filterMonthlyParts(db.monthlyParts, month);
  if (!rows.length) {
    const text = `🗑 <b>Удаление</b>\n\nВ ${formatMonthLabel(month)} нет позиций.`;
    const keyboard = monthlyPartsMenuKeyboard(month);
    if (messageId) {
      await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
    } else {
      await sendTelegramMessage(chatId, text, keyboard);
    }
    return;
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / DELETE_PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = rows.slice(safePage * DELETE_PAGE_SIZE, (safePage + 1) * DELETE_PAGE_SIZE);

  const buttons = slice.map((r, i) => ({
    id: r.id,
    label: `${safePage * DELETE_PAGE_SIZE + i + 1}. ${r.name}`.slice(0, 60),
  }));

  const text =
    `🗑 <b>Удалить позицию</b>\n` +
    `Месяц: <b>${formatMonthLabel(month)}</b>\n\n` +
    `Нажмите на позицию для удаления:`;

  const keyboard = deleteMenuKeyboard(month, buttons, safePage, totalPages);
  const chatKeyStr = chatKey(chatId);
  await setTelegramSession(chatKeyStr, {
    step: undefined,
    data: { partsMonth: month, partsDelPage: String(safePage) },
  });

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function deleteMonthlyPart(
  chatId: number,
  messageId: number | undefined,
  partId: string
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data);
  const page = Number.parseInt(session.data?.partsDelPage ?? "0", 10) || 0;

  let removedName = "";
  const put = await cloudMutateCrmStore((db) => {
    const idx = (db.monthlyParts ?? []).findIndex((p) => p.id === partId);
    if (idx < 0) return false;
    removedName = db.monthlyParts![idx].name;
    db.monthlyParts!.splice(idx, 1);
    return partId;
  });

  if (!put.ok) {
    await sendTelegramMessage(chatId, BOT.saveFailed, monthlyPartsMenuKeyboard(month));
    return;
  }

  const snap = await cloudGetCrmStore();
  const db = snap?.doc as Database | undefined;
  if (!db) {
    await showMonthlyPartsMenu(chatId, messageId, month);
    return;
  }

  const remaining = filterMonthlyParts(db.monthlyParts, month);
  if (!remaining.length) {
    await sendTelegramMessage(
      chatId,
      `✅ Удалено: <b>${removedName || "позиция"}</b>\n\nВ месяце больше нет позиций.`,
      monthlyPartsMenuKeyboard(month)
    );
    return;
  }

  const text =
    `🗑 <b>Удалить позицию</b>\n` +
    `Месяц: <b>${formatMonthLabel(month)}</b>\n\n` +
    `✅ Удалено: <b>${removedName || "позиция"}</b>\n\n` +
    `Нажмите на позицию для удаления:`;

  const totalPages = Math.max(1, Math.ceil(remaining.length / DELETE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = remaining.slice(safePage * DELETE_PAGE_SIZE, (safePage + 1) * DELETE_PAGE_SIZE);
  const buttons = slice.map((r, i) => ({
    id: r.id,
    label: `${safePage * DELETE_PAGE_SIZE + i + 1}. ${r.name}`.slice(0, 60),
  }));
  const keyboard = deleteMenuKeyboard(month, buttons, safePage, totalPages);

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

/** @deprecated bulk line input — use wizard */
export async function handleMonthlyPartsStepText(
  chatId: number,
  _text: string
): Promise<boolean> {
  return handleMonthlyPartsWizardText(chatId, _text);
}
