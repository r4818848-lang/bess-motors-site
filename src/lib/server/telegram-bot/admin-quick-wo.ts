import { normalizePhone } from "@/lib/auth";
import {
  buildClientDisplayName,
  createQuickWorkOrderFromTelegram,
  parseMakeModelLine,
  type QuickWorkOrderDraft,
} from "@/lib/create-work-order-telegram-quick";
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
import { BOT } from "./labels";
import { mainMenuKeyboard } from "./keyboards";

const WO_STEPS = [
  "firstName",
  "lastName",
  "phone",
  "plate",
  "makeModel",
  "mileage",
  "work",
  "internalNotes",
] as const;

export type QuickWoField = (typeof WO_STEPS)[number];

type QuickWoSessionData = Record<string, string> & {
  woStep?: QuickWoField | "confirm";
};

function chatKey(chatId: number): string {
  return String(chatId);
}

function parseDraft(data: QuickWoSessionData): QuickWorkOrderDraft {
  const mileageRaw = data.mileage?.trim();
  const mileage = mileageRaw ? Number.parseInt(mileageRaw.replace(/\s/g, ""), 10) : undefined;
  return {
    firstName: data.firstName?.trim() || undefined,
    lastName: data.lastName?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    plate: data.plate?.trim() || undefined,
    make: data.make?.trim() || undefined,
    model: data.model?.trim() || undefined,
    mileage: mileage != null && Number.isFinite(mileage) && mileage > 0 ? mileage : undefined,
    work: data.work?.trim() || undefined,
    internalNotes: data.internalNotes?.trim() || undefined,
  };
}

function nextStep(current: QuickWoField | "confirm" | undefined): QuickWoField | "confirm" {
  if (!current || current === "confirm") return "confirm";
  const idx = WO_STEPS.indexOf(current);
  if (idx === -1 || idx >= WO_STEPS.length - 1) return "confirm";
  return WO_STEPS[idx + 1];
}

function prevStep(current: QuickWoField | "confirm" | undefined): QuickWoField | "confirm" {
  if (current === "confirm") return WO_STEPS[WO_STEPS.length - 1];
  const idx = WO_STEPS.indexOf(current ?? "firstName");
  if (idx <= 0) return WO_STEPS[0];
  return WO_STEPS[idx - 1];
}

function stepPrompt(step: QuickWoField | "confirm"): string {
  const map: Record<QuickWoField | "confirm", string> = {
    firstName: "👤 <b>Шаг 1/8 — Имя</b>\n\nВведите имя клиента:",
    lastName: "👤 <b>Шаг 2/8 — Фамилия</b>\n\nВведите фамилию:",
    phone: "📱 <b>Шаг 3/8 — Телефон</b>\n\nПример: <code>+48123456789</code>\n\n<i>Нужен для сохранения в CRM.</i>",
    plate: "🚗 <b>Шаг 4/8 — Госномер</b>\n\nПример: <code>WA12345</code>",
    makeModel: "🚙 <b>Шаг 5/8 — Марка и модель</b>\n\nОдной строкой, например: <code>Toyota Corolla</code>",
    mileage: "🛣 <b>Шаг 6/8 — Пробег</b>\n\nТолько число в км, например: <code>125000</code>",
    work: "🔧 <b>Шаг 7/8 — Работы</b>\n\nКратко: диагностика, замена масла и т.д.",
    internalNotes: "📝 <b>Шаг 8/8 — Внутренняя заметка</b>\n\nТолько для сотрудников (клиент не видит).",
    confirm: "📋 <b>Проверьте данные</b>",
  };
  return map[step];
}

function formatConfirmSummary(data: QuickWoSessionData): string {
  const draft = parseDraft(data);
  const name = buildClientDisplayName(draft);
  const vehicle =
    [draft.make, draft.model].filter(Boolean).join(" ").trim() ||
    (data.makeModel?.trim() ? data.makeModel.trim() : "—");
  const lines = [
    stepPrompt("confirm"),
    "",
    `👤 <b>${name}</b>`,
    `📱 ${draft.phone?.trim() || "—"}`,
    `🚗 ${draft.plate?.trim() || "—"} · ${vehicle}`,
    `🛣 ${draft.mileage != null ? `${draft.mileage} км` : "—"}`,
    `🔧 ${draft.work?.trim() || "—"}`,
    `📝 ${draft.internalNotes?.trim() || "—"}`,
  ];
  if (!draft.phone?.trim()) {
    lines.push("", "⚠️ <b>Телефон не указан</b> — без него заказ не сохранится.");
  }
  return lines.join("\n");
}

function stepKeyboard(step: QuickWoField | "confirm"): InlineKeyboardMarkup {
  if (step === "confirm") {
    return {
      inline_keyboard: [
        [{ text: "✅ Создать заказ-наряд", callback_data: "qwo:save" }],
        [
          { text: "◀️ Назад", callback_data: "qwo:back" },
          { text: BOT.cancel, callback_data: "menu" },
        ],
      ],
    };
  }

  const skipRow =
    step === "phone"
      ? [{ text: "⏭ Пропустить (нельзя сохранить без телефона)", callback_data: "qwo:skip" }]
      : [{ text: "⏭ Пропустить", callback_data: "qwo:skip" }];

  const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [
    { text: "◀️ Назад", callback_data: "qwo:back" },
    { text: BOT.cancel, callback_data: "menu" },
  ];
  if (step === "firstName") {
    return { inline_keyboard: [skipRow, [{ text: BOT.cancel, callback_data: "menu" }]] };
  }
  return { inline_keyboard: [skipRow, nav] };
}

async function showStep(
  chatId: number,
  messageId: number | undefined,
  data: QuickWoSessionData,
  step: QuickWoField | "confirm"
): Promise<void> {
  const text = step === "confirm" ? formatConfirmSummary(data) : stepPrompt(step);
  const keyboard = stepKeyboard(step);
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

async function persistStep(
  chatId: number,
  messageId: number | undefined,
  data: QuickWoSessionData,
  step: QuickWoField | "confirm"
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  await setTelegramSession(chatKeyStr, {
    step: "admin_quick_wo",
    data: { ...data, woStep: step },
  });
  await showStep(chatId, messageId, { ...data, woStep: step }, step);
}

export async function startQuickWorkOrderFlow(
  chatId: number,
  messageId?: number
): Promise<void> {
  const data: QuickWoSessionData = { woStep: "firstName" };
  const intro = `${BOT.quickWoIntro}\n\n${stepPrompt("firstName")}`;
  const keyboard = stepKeyboard("firstName");
  const chatKeyStr = chatKey(chatId);
  await setTelegramSession(chatKeyStr, { step: "admin_quick_wo", data });
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, intro, keyboard);
  } else {
    await sendTelegramMessage(chatId, intro, keyboard);
  }
}

export async function handleQuickWoCallback(
  chatId: number,
  messageId: number | undefined,
  action: "skip" | "back" | "save"
): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  if (session.step !== "admin_quick_wo") return false;

  const data = { ...(session.data ?? {}) } as QuickWoSessionData;
  const current = data.woStep ?? "firstName";

  if (action === "back") {
    const prev = prevStep(current);
    await persistStep(chatId, messageId, data, prev);
    return true;
  }

  if (action === "skip") {
    const next = nextStep(current);
    await persistStep(chatId, messageId, data, next);
    return true;
  }

  if (action === "save") {
    const draft = parseDraft(data);
    if (!normalizePhone(draft.phone ?? "")) {
      await persistStep(chatId, messageId, data, "phone");
      await sendTelegramMessage(chatId, BOT.quickWoPhoneRequired, stepKeyboard("phone"));
      return true;
    }

    let orderNumber = "";
    let createError = "";
    const put = await cloudMutateCrmStore(async (db) => {
      const result = await createQuickWorkOrderFromTelegram(db, draft);
      if (!result.ok) {
        createError = result.error;
        return false;
      }
      orderNumber = result.orderNumber;
      return result.orderNumber;
    });

    if (createError) {
      const err =
        createError === "phone_required"
          ? BOT.quickWoPhoneRequired
          : createError === "name_required"
            ? "❌ Укажите имя клиента."
            : createError === "client_vehicle_required"
              ? "❌ Не удалось привязать авто."
              : BOT.saveFailed;
      await sendTelegramMessage(chatId, err, stepKeyboard("confirm"));
      return true;
    }

    if (!put.ok) {
      await sendTelegramMessage(
        chatId,
        `${BOT.saveFailed}\n\nПопробуйте «Создать заказ-наряд» ещё раз.`,
        stepKeyboard("confirm")
      );
      return true;
    }

    await clearTelegramSession(chatKeyStr);
    await replyDone(
      chatId,
      messageId,
      `${BOT.saved}\n📋 <b>${orderNumber}</b>\n\nОткройте в CRM на сайте.`
    );
    return true;
  }

  return false;
}

async function replyDone(
  chatId: number,
  messageId: number | undefined,
  text: string
): Promise<void> {
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, mainMenuKeyboard());
  } else {
    await sendTelegramMessage(chatId, text, mainMenuKeyboard());
  }
}

function applyFieldValue(
  step: QuickWoField,
  data: QuickWoSessionData,
  text: string
): { ok: true; data: QuickWoSessionData } | { ok: false; message: string } {
  const trimmed = text.trim();
  if (step === "phone") {
    const phone = normalizePhone(trimmed);
    if (!phone) {
      return { ok: false, message: BOT.importPhoneInvalid };
    }
    return { ok: true, data: { ...data, phone } };
  }
  if (step === "mileage") {
    const n = Number.parseInt(trimmed.replace(/\s/g, ""), 10);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, message: "❌ Введите пробег числом, например <code>125000</code>." };
    }
    return { ok: true, data: { ...data, mileage: String(n) } };
  }
  if (step === "makeModel") {
    const { make, model } = parseMakeModelLine(trimmed);
    return {
      ok: true,
      data: { ...data, makeModel: trimmed, make: make ?? "", model: model ?? "" },
    };
  }
  return { ok: true, data: { ...data, [step]: trimmed } };
}

export async function handleQuickWoStepText(chatId: number, text: string): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  if (session.step !== "admin_quick_wo") return false;

  const data = { ...(session.data ?? {}) } as QuickWoSessionData;
  const current = data.woStep ?? "firstName";
  if (current === "confirm") {
    await sendTelegramMessage(chatId, "Нажмите «Создать заказ-наряд» или «Назад».", stepKeyboard("confirm"));
    return true;
  }

  const applied = applyFieldValue(current, data, text);
  if (!applied.ok) {
    await sendTelegramMessage(chatId, applied.message, stepKeyboard(current));
    return true;
  }

  const next = nextStep(current);
  await persistStep(chatId, undefined, applied.data, next);
  return true;
}
