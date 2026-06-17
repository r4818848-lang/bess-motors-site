import {
  createMonthlyConsumableEntry,
  filterMonthlyConsumables,
  formatMonthlyConsumablesTable,
  type MonthlyConsumableEntry,
} from "@/lib/monthly-consumables";
import {
  currentMonthKey,
  formatMoneyPln,
  formatMonthLabel,
  MONTHLY_PARTS_VAT_RATE,
  parsePartMoneyInput,
  shiftMonthKey,
} from "@/lib/monthly-parts";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
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
import { BOT } from "./labels";

const CONS_STEPS = ["name", "number", "purchase"] as const;
type ConsWizardStep = (typeof CONS_STEPS)[number];
const DELETE_PAGE_SIZE = 8;

function chatKey(chatId: number): string {
  return String(chatId);
}

function sessionMonth(data: Record<string, string> | undefined): string {
  return data?.consMonth?.trim() || currentMonthKey();
}

function wizardStep(data: Record<string, string> | undefined): ConsWizardStep {
  const s = data?.consStep as ConsWizardStep | undefined;
  return s && CONS_STEPS.includes(s) ? s : "name";
}

function prevStep(current: ConsWizardStep): ConsWizardStep {
  const idx = CONS_STEPS.indexOf(current);
  return idx > 0 ? CONS_STEPS[idx - 1] : "name";
}

function stepPrompt(step: ConsWizardStep, month: string): string {
  const vat = Math.round(MONTHLY_PARTS_VAT_RATE * 100);
  const map: Record<ConsWizardStep, string> = {
    name: "🧴 <b>Шаг 1/3 — Название</b>\n\nВведите название расходника:",
    number:
      "🔢 <b>Шаг 2/3 — Номер (артикул)</b>\n\nВведите номер или нажмите «Пропустить»:",
    purchase:
      `💰 <b>Шаг 3/3 — Цена закупки</b>\n\nВведите цену закупки <b>брутто</b> (zł).\nНетто (−${vat}% VAT) посчитается автоматически.\nМесяц: <b>${formatMonthLabel(month)}</b>`,
  };
  return map[step];
}

function wizardKeyboard(step: ConsWizardStep): InlineKeyboardMarkup {
  const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [
    { text: "◀️ Назад", callback_data: "cons:back" },
    { text: BOT.cancel, callback_data: "menu" },
  ];
  if (step === "number") {
    return {
      inline_keyboard: [
        [{ text: "⏭ Пропустить", callback_data: "cons:skip" }],
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
      [{ text: "➕ Ещё позиция", callback_data: "cons:add" }],
      [{ text: "📋 Список месяца", callback_data: "cons:list" }],
      [{ text: BOT.menu, callback_data: "cons:menu" }],
    ],
  };
}

export function monthlyConsumablesMenuKeyboard(month: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "➕ Добавить", callback_data: "cons:add" }],
      [{ text: "📋 Показать список", callback_data: "cons:list" }],
      [{ text: "🗑 Удалить позицию", callback_data: "cons:del" }],
      [
        { text: "◀️", callback_data: "cons:prev" },
        { text: formatMonthLabel(month), callback_data: "noop" },
        { text: "▶️", callback_data: "cons:next" },
      ],
      [{ text: BOT.menu, callback_data: "menu" }],
    ],
  };
}

async function persistWizardStep(
  chatId: number,
  messageId: number | undefined,
  data: Record<string, string>,
  step: ConsWizardStep
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const month = sessionMonth(data);
  await setTelegramSession(chatKeyStr, {
    step: "admin_cons_wizard",
    data: { ...data, consMonth: month, consStep: step },
  });
  const text = stepPrompt(step, month);
  const keyboard = wizardKeyboard(step);
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function showMonthlyConsumablesMenu(
  chatId: number,
  messageId: number | undefined,
  month?: string
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const m = month ?? sessionMonth(session.data);
  await setTelegramSession(chatKeyStr, {
    step: undefined,
    data: { consMonth: m, consView: "menu" },
  });

  const text =
    `🧴 <b>Месячный список расходников</b>\n\n` +
    `Месяц: <b>${formatMonthLabel(m)}</b>\n\n` +
    `Пошагово: название → номер → закуп <b>брутто</b>.\n` +
    `Нетто с VAT ${Math.round(MONTHLY_PARTS_VAT_RATE * 100)}% считается автоматически.`;

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, monthlyConsumablesMenuKeyboard(m));
  } else {
    await sendTelegramMessage(chatId, text, monthlyConsumablesMenuKeyboard(m));
  }
}

export async function startMonthlyConsumablesAdd(
  chatId: number,
  messageId?: number
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data);
  await persistWizardStep(chatId, messageId, { consMonth: month }, "name");
}

export async function showMonthlyConsumablesList(
  chatId: number,
  messageId: number | undefined,
  db: Database,
  month: string
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  await setTelegramSession(chatKeyStr, {
    step: undefined,
    data: { consMonth: month, consView: "list" },
  });
  const text = formatMonthlyConsumablesTable(db.monthlyConsumables ?? [], month);
  const keyboard = monthlyConsumablesMenuKeyboard(month);
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function shiftMonthlyConsumablesMonth(
  chatId: number,
  messageId: number | undefined,
  delta: number,
  db?: Database
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = shiftMonthKey(sessionMonth(session.data), delta);
  const view = session.data?.consView ?? "menu";
  const delPage = Number.parseInt(session.data?.consDelPage ?? "0", 10) || 0;

  await setTelegramSession(chatKeyStr, {
    step: session.step,
    data: { ...(session.data ?? {}), consMonth: month, consView: view },
  });

  if (view === "list" && db) {
    await showMonthlyConsumablesList(chatId, messageId, db, month);
    return;
  }
  if (view === "delete" && db) {
    await showMonthlyConsumablesDeleteMenu(chatId, messageId, db, month, delPage);
    return;
  }
  await showMonthlyConsumablesMenu(chatId, messageId, month);
}

async function saveWizardConsumable(
  data: Record<string, string>
): Promise<{ ok: boolean; entry?: MonthlyConsumableEntry; error?: string }> {
  const month = sessionMonth(data);
  const name = data.consName?.trim();
  const purchaseBrutto = parsePartMoneyInput(data.consPurchase ?? "");

  if (!name || purchaseBrutto == null) {
    return { ok: false, error: "invalid" };
  }

  const entry = createMonthlyConsumableEntry(month, {
    name,
    partNumber: data.consNumber?.trim() ?? "",
    purchaseBrutto,
  });

  const put = await cloudMutateCrmStore((db) => {
    if (!db.monthlyConsumables) db.monthlyConsumables = [];
    db.monthlyConsumables.push(entry);
  });

  if (!put.ok) return { ok: false, error: put.error };
  return { ok: true, entry };
}

export async function handleMonthlyConsumablesWizardText(
  chatId: number,
  text: string
): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  if (session.step !== "admin_cons_wizard") return false;

  const data = { ...(session.data ?? {}) };
  const step = wizardStep(data);
  const trimmed = text.trim();

  if (step === "name") {
    if (trimmed.length < 2) {
      await sendTelegramMessage(chatId, "❌ Введите название (мин. 2 символа).", wizardKeyboard("name"));
      return true;
    }
    data.consName = trimmed;
    await persistWizardStep(chatId, undefined, data, "number");
    return true;
  }

  if (step === "number") {
    data.consNumber = trimmed;
    await persistWizardStep(chatId, undefined, data, "purchase");
    return true;
  }

  if (step === "purchase") {
    const price = parsePartMoneyInput(trimmed);
    if (price == null) {
      await sendTelegramMessage(
        chatId,
        "❌ Неверная цена. Пример: <code>123</code> или <code>49,99</code> (брутто)",
        wizardKeyboard("purchase")
      );
      return true;
    }
    data.consPurchase = String(price);

    const saved = await saveWizardConsumable(data);
    if (!saved.ok || !saved.entry) {
      await sendTelegramMessage(chatId, `${BOT.saveFailed}\n\n${saved.error ?? ""}`, wizardKeyboard("purchase"));
      return true;
    }

    const e = saved.entry;
    await setTelegramSession(chatKeyStr, {
      step: undefined,
      data: { consMonth: sessionMonth(data) },
    });
    await sendTelegramMessage(
      chatId,
      `${BOT.saved}\n\n` +
        `<b>${e.name}</b>` +
        (e.partNumber ? `\n🔢 <code>${e.partNumber}</code>` : "") +
        `\n\nЗакуп: <b>${formatMoneyPln(e.purchaseBrutto)}</b> брут / ` +
        `<b>${formatMoneyPln(e.purchaseNetto)}</b> нет`,
      afterSaveKeyboard()
    );
    return true;
  }

  return false;
}

export async function handleMonthlyConsumablesWizardCallback(
  chatId: number,
  messageId: number | undefined,
  action: "skip" | "back"
): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  if (session.step !== "admin_cons_wizard") return false;

  const data = { ...(session.data ?? {}) };
  const current = wizardStep(data);

  if (action === "back") {
    await persistWizardStep(chatId, messageId, data, prevStep(current));
    return true;
  }

  if (action === "skip" && current === "number") {
    data.consNumber = "";
    await persistWizardStep(chatId, messageId, data, "purchase");
    return true;
  }

  return false;
}

function deleteMenuKeyboard(
  month: string,
  rows: { id: string; label: string }[],
  page: number,
  totalPages: number
): InlineKeyboardMarkup {
  const keyboard: InlineKeyboardMarkup["inline_keyboard"] = rows.map((r) => [
    { text: `🗑 ${r.label}`, callback_data: `cons:rm:${r.id}` },
  ]);

  if (totalPages > 1) {
    const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [];
    if (page > 0) nav.push({ text: "◀️", callback_data: `cons:delp:${page - 1}` });
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
    if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `cons:delp:${page + 1}` });
    keyboard.push(nav);
  }

  keyboard.push([{ text: BOT.back, callback_data: "cons:menu" }]);
  return { inline_keyboard: keyboard };
}

export async function showMonthlyConsumablesDeleteMenu(
  chatId: number,
  messageId: number | undefined,
  db: Database,
  month: string,
  page = 0
): Promise<void> {
  const rows = filterMonthlyConsumables(db.monthlyConsumables, month);
  if (!rows.length) {
    const text = `🗑 <b>Удаление</b>\n\nВ ${formatMonthLabel(month)} нет расходников.`;
    if (messageId) {
      await updateTelegramInlineScreen(chatId, messageId, text, monthlyConsumablesMenuKeyboard(month));
    } else {
      await sendTelegramMessage(chatId, text, monthlyConsumablesMenuKeyboard(month));
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
    `🗑 <b>Удалить расходник</b>\n` +
    `Месяц: <b>${formatMonthLabel(month)}</b>\n\n` +
    `Нажмите на позицию:`;

  const keyboard = deleteMenuKeyboard(month, buttons, safePage, totalPages);
  await setTelegramSession(chatKey(chatId), {
    step: undefined,
    data: { consMonth: month, consView: "delete", consDelPage: String(safePage) },
  });

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function deleteMonthlyConsumable(
  chatId: number,
  messageId: number | undefined,
  partId: string
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data);
  const page = Number.parseInt(session.data?.consDelPage ?? "0", 10) || 0;

  let removedName = "";
  const put = await cloudMutateCrmStore((db) => {
    const idx = (db.monthlyConsumables ?? []).findIndex((p) => p.id === partId);
    if (idx < 0) return false;
    removedName = db.monthlyConsumables![idx].name;
    db.monthlyConsumables!.splice(idx, 1);
    return partId;
  });

  if (!put.ok) {
    await sendTelegramMessage(chatId, BOT.saveFailed, monthlyConsumablesMenuKeyboard(month));
    return;
  }

  const snap = await cloudGetCrmStore();
  const db = snap?.doc as Database | undefined;
  if (!db) {
    await showMonthlyConsumablesMenu(chatId, messageId, month);
    return;
  }

  const remaining = filterMonthlyConsumables(db.monthlyConsumables, month);
  if (!remaining.length) {
    await sendTelegramMessage(
      chatId,
      `✅ Удалено: <b>${removedName}</b>\n\nВ месяце больше нет расходников.`,
      monthlyConsumablesMenuKeyboard(month)
    );
    return;
  }

  const text =
    `🗑 <b>Удалить расходник</b>\n` +
    `Месяц: <b>${formatMonthLabel(month)}</b>\n\n` +
    `✅ Удалено: <b>${removedName}</b>\n\n` +
    `Нажмите на позицию:`;

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
