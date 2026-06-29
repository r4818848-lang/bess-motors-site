import {
  createMonthlyInvoicePartEntry,
  currentMonthKey,
  formatMoneyPln,
  formatMonthLabel,
  formatMonthlyInvoicePartsTable,
  MONTHLY_PARTS_VAT_RATE,
  normalizePartPrices,
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
  getTelegramSession,
  setTelegramSession,
} from "@/lib/server/telegram-sessions";
import type { Database } from "@/lib/store";
import { BOT } from "./labels";

const FPART_STEPS = ["name", "number", "purchase", "sell"] as const;
type FpartWizardStep = (typeof FPART_STEPS)[number];

const DELETE_PAGE_SIZE = 8;

function chatKey(chatId: number): string {
  return String(chatId);
}

function sessionMonth(data: Record<string, string> | undefined): string {
  return data?.fpartMonth?.trim() || currentMonthKey();
}

function wizardStep(data: Record<string, string> | undefined): FpartWizardStep {
  const s = data?.fpartStep as FpartWizardStep | undefined;
  return s && FPART_STEPS.includes(s) ? s : "name";
}

function prevStep(current: FpartWizardStep): FpartWizardStep {
  const idx = FPART_STEPS.indexOf(current);
  return idx > 0 ? FPART_STEPS[idx - 1] : "name";
}

function stepPrompt(step: FpartWizardStep, month: string): string {
  const vat = Math.round(MONTHLY_PARTS_VAT_RATE * 100);
  const map: Record<FpartWizardStep, string> = {
    name: "🧾 <b>Шаг 1/4 — Название (на фактуру)</b>\n\nВведите название запчасти:",
    number:
      "🔢 <b>Шаг 2/4 — Номер (артикул)</b>\n\nВведите номер детали или нажмите «Пропустить»:",
    purchase:
      `💰 <b>Шаг 3/4 — Цена закупки</b>\n\nВведите цену закупки <b>брутто</b> (zł).\nНетто (−${vat}% VAT) посчитается автоматически.`,
    sell:
      `💵 <b>Шаг 4/4 — Цена продажи</b>\n\nВведите цену продажи <b>брутто</b> (zł).\nМесяц: <b>${formatMonthLabel(month)}</b>`,
  };
  return map[step];
}

function wizardKeyboard(step: FpartWizardStep): InlineKeyboardMarkup {
  const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [
    { text: "◀️ Назад", callback_data: "fpart:back" },
    { text: BOT.cancel, callback_data: "menu" },
  ];
  if (step === "number") {
    return {
      inline_keyboard: [
        [{ text: "⏭ Пропустить", callback_data: "fpart:skip" }],
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
      [{ text: "➕ Ещё одна позиция", callback_data: "fpart:add" }],
      [{ text: "📋 Список месяца", callback_data: "fpart:list" }],
      [{ text: BOT.menu, callback_data: "fpart:menu" }],
    ],
  };
}

export function monthlyInvoicePartsMenuKeyboard(month: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "➕ Добавить", callback_data: "fpart:add" }],
      [{ text: "📋 Показать список", callback_data: "fpart:list" }],
      [{ text: "🗑 Удалить позицию", callback_data: "fpart:del" }],
      [
        { text: "◀️", callback_data: "fpart:prev" },
        { text: formatMonthLabel(month), callback_data: "noop" },
        { text: "▶️", callback_data: "fpart:next" },
      ],
      [{ text: BOT.menu, callback_data: "menu" }],
    ],
  };
}

async function persistWizardStep(
  chatId: number,
  messageId: number | undefined,
  data: Record<string, string>,
  step: FpartWizardStep
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const month = sessionMonth(data);
  await setTelegramSession(chatKeyStr, {
    step: "admin_fpart_wizard",
    data: { ...data, fpartMonth: month, fpartStep: step },
  });
  const text = stepPrompt(step, month);
  const keyboard = wizardKeyboard(step);
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function showMonthlyInvoicePartsMenu(
  chatId: number,
  messageId: number | undefined,
  month?: string
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const m = month ?? sessionMonth(session.data);
  await setTelegramSession(chatKeyStr, {
    step: undefined,
    data: { fpartMonth: m, fpartView: "menu" },
  });

  const text =
    `🧾 <b>Запчасти на фактуру</b>\n\n` +
    `Месяц: <b>${formatMonthLabel(m)}</b>\n\n` +
    `Отдельный список для позиций, которые идут на фактуру.\n` +
    `Пошагово: название → номер → закуп (брутто) → продажа (брутто).\n` +
    `Нетто с VAT ${Math.round(MONTHLY_PARTS_VAT_RATE * 100)}% считается автоматически.`;

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, monthlyInvoicePartsMenuKeyboard(m));
  } else {
    await sendTelegramMessage(chatId, text, monthlyInvoicePartsMenuKeyboard(m));
  }
}

export async function startMonthlyInvoicePartsAdd(
  chatId: number,
  messageId?: number
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data);
  await persistWizardStep(chatId, messageId, { fpartMonth: month }, "name");
}

export async function showMonthlyInvoicePartsList(
  chatId: number,
  messageId: number | undefined,
  db: Database,
  month: string
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  await setTelegramSession(chatKeyStr, {
    step: undefined,
    data: { fpartMonth: month, fpartView: "list" },
  });
  const text = formatMonthlyInvoicePartsTable(db.monthlyInvoiceParts ?? [], month);
  const keyboard = monthlyInvoicePartsMenuKeyboard(month);
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function shiftMonthlyInvoicePartsMonth(
  chatId: number,
  messageId: number | undefined,
  delta: number,
  db?: Database
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = shiftMonthKey(sessionMonth(session.data), delta);
  const view = session.data?.fpartView ?? "menu";
  const delPage = Number.parseInt(session.data?.fpartDelPage ?? "0", 10) || 0;

  await setTelegramSession(chatKeyStr, {
    step: session.step,
    data: { ...(session.data ?? {}), fpartMonth: month, fpartView: view },
  });

  if (view === "list" && db) {
    await showMonthlyInvoicePartsList(chatId, messageId, db, month);
    return;
  }
  if (view === "delete" && db) {
    await showMonthlyInvoicePartsDeleteMenu(chatId, messageId, db, month, delPage);
    return;
  }
  await showMonthlyInvoicePartsMenu(chatId, messageId, month);
}

async function saveWizardPart(
  data: Record<string, string>
): Promise<{ ok: boolean; entry?: ReturnType<typeof createMonthlyInvoicePartEntry>; error?: string }> {
  const month = sessionMonth(data);
  const name = data.fpartName?.trim();
  const purchaseBrutto = parsePartMoneyInput(data.fpartPurchase ?? "");
  const sellBrutto = parsePartMoneyInput(data.fpartSell ?? "");

  if (!name || purchaseBrutto == null || sellBrutto == null) {
    return { ok: false };
  }

  const entry = createMonthlyInvoicePartEntry(month, {
    name,
    partNumber: data.fpartNumber?.trim() ?? "",
    purchaseBrutto,
    sellBrutto,
  });

  const put = await cloudMutateCrmStore((db) => {
    if (!db.monthlyInvoiceParts) db.monthlyInvoiceParts = [];
    db.monthlyInvoiceParts.push(entry);
  });

  if (!put.ok) return { ok: false, error: put.error };
  return { ok: true, entry };
}

function formatSavedSummary(entry: ReturnType<typeof createMonthlyInvoicePartEntry>): string {
  const p = normalizePartPrices(entry);
  const num = entry.partNumber ? `\n🔢 <code>${entry.partNumber}</code>` : "";
  return (
    `${BOT.saved}\n\n` +
    `<b>${entry.name}</b>${num}\n\n` +
    `Закуп: <b>${formatMoneyPln(p.purchaseBrutto)}</b> брут / <b>${formatMoneyPln(p.purchaseNetto)}</b> нет\n` +
    `Продажа: <b>${formatMoneyPln(p.sellBrutto)}</b> брут / <b>${formatMoneyPln(p.sellNetto)}</b> нет\n` +
    `Маржа: <b>${formatMoneyPln(p.sellNetto - p.purchaseNetto)}</b> нет / ` +
    `<b>${formatMoneyPln(p.sellBrutto - p.purchaseBrutto)}</b> брут`
  );
}

export async function handleMonthlyInvoicePartsWizardText(
  chatId: number,
  text: string
): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  if (session.step !== "admin_fpart_wizard") return false;

  const data = { ...(session.data ?? {}) };
  const step = wizardStep(data);
  const trimmed = text.trim();

  if (step === "name") {
    if (trimmed.length < 2) {
      await sendTelegramMessage(chatId, "❌ Введите название (мин. 2 символа).", wizardKeyboard("name"));
      return true;
    }
    data.fpartName = trimmed;
    await persistWizardStep(chatId, undefined, data, "number");
    return true;
  }

  if (step === "number") {
    data.fpartNumber = trimmed;
    await persistWizardStep(chatId, undefined, data, "purchase");
    return true;
  }

  if (step === "purchase") {
    const price = parsePartMoneyInput(trimmed);
    if (price == null) {
      await sendTelegramMessage(
        chatId,
        "❌ Неверная цена (брутто). Пример: <code>27,06</code> или <code>45</code>",
        wizardKeyboard("purchase")
      );
      return true;
    }
    data.fpartPurchase = String(price);
    await persistWizardStep(chatId, undefined, data, "sell");
    return true;
  }

  if (step === "sell") {
    const price = parsePartMoneyInput(trimmed);
    if (price == null) {
      await sendTelegramMessage(
        chatId,
        "❌ Неверная цена (брутто). Пример: <code>45</code> или <code>45,90</code>",
        wizardKeyboard("sell")
      );
      return true;
    }
    data.fpartSell = String(price);

    const saved = await saveWizardPart(data);
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
      data: { fpartMonth: sessionMonth(data), fpartView: "menu" },
    });
    await sendTelegramMessage(chatId, formatSavedSummary(saved.entry), afterSaveKeyboard());
    return true;
  }

  return false;
}

export async function handleMonthlyInvoicePartsWizardCallback(
  chatId: number,
  messageId: number | undefined,
  action: "skip" | "back"
): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  if (session.step !== "admin_fpart_wizard") return false;

  const data = { ...(session.data ?? {}) };
  const current = wizardStep(data);

  if (action === "back") {
    const prev = prevStep(current);
    await persistWizardStep(chatId, messageId, data, prev);
    return true;
  }

  if (action === "skip" && current === "number") {
    data.fpartNumber = "";
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
    { text: `🗑 ${r.label}`, callback_data: `fpart:rm:${r.id}` },
  ]);

  if (totalPages > 1) {
    const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [];
    if (page > 0) nav.push({ text: "◀️", callback_data: `fpart:delp:${page - 1}` });
    nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
    if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `fpart:delp:${page + 1}` });
    keyboard.push(nav);
  }

  keyboard.push([{ text: BOT.back, callback_data: "fpart:menu" }]);
  return { inline_keyboard: keyboard };
}

export async function showMonthlyInvoicePartsDeleteMenu(
  chatId: number,
  messageId: number | undefined,
  db: Database,
  month: string,
  page = 0
): Promise<void> {
  const rows = filterMonthlyParts(db.monthlyInvoiceParts, month);
  if (!rows.length) {
    const text = `🗑 <b>Удаление</b>\n\nВ ${formatMonthLabel(month)} нет позиций на фактуру.`;
    const keyboard = monthlyInvoicePartsMenuKeyboard(month);
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
    `🗑 <b>Удалить позицию (на фактуру)</b>\n` +
    `Месяц: <b>${formatMonthLabel(month)}</b>\n\n` +
    `Нажмите на позицию для удаления:`;

  const keyboard = deleteMenuKeyboard(month, buttons, safePage, totalPages);
  const chatKeyStr = chatKey(chatId);
  await setTelegramSession(chatKeyStr, {
    step: undefined,
    data: { fpartMonth: month, fpartView: "delete", fpartDelPage: String(safePage) },
  });

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function deleteMonthlyInvoicePart(
  chatId: number,
  messageId: number | undefined,
  partId: string
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data);
  const page = Number.parseInt(session.data?.fpartDelPage ?? "0", 10) || 0;

  let removedName = "";
  const put = await cloudMutateCrmStore((db) => {
    const idx = (db.monthlyInvoiceParts ?? []).findIndex((p) => p.id === partId);
    if (idx < 0) return false;
    removedName = db.monthlyInvoiceParts![idx].name;
    db.monthlyInvoiceParts!.splice(idx, 1);
    return partId;
  });

  if (!put.ok) {
    await sendTelegramMessage(chatId, BOT.saveFailed, monthlyInvoicePartsMenuKeyboard(month));
    return;
  }

  const snap = await cloudGetCrmStore();
  const db = snap?.doc as Database | undefined;
  if (!db) {
    await showMonthlyInvoicePartsMenu(chatId, messageId, month);
    return;
  }

  const remaining = filterMonthlyParts(db.monthlyInvoiceParts, month);
  if (!remaining.length) {
    await sendTelegramMessage(
      chatId,
      `✅ Удалено: <b>${removedName || "позиция"}</b>\n\nВ месяце больше нет позиций.`,
      monthlyInvoicePartsMenuKeyboard(month)
    );
    return;
  }

  const text =
    `🗑 <b>Удалить позицию (на фактуру)</b>\n` +
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
