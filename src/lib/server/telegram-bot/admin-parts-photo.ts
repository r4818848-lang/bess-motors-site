import {
  createMonthlyPartEntry,
  currentMonthKey,
  formatMoneyPln,
  formatMonthLabel,
} from "@/lib/monthly-parts";
import {
  parsePartsOrderPhotoText,
  type ParsedPartsOrderRow,
} from "@/lib/parts-order-photo-parser";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { runPartsOcr } from "@/lib/server/ocr-import-image";
import {
  downloadTelegramFileBuffer,
  sendTelegramMessage,
  updateTelegramInlineScreen,
  type InlineKeyboardMarkup,
} from "@/lib/server/telegram-api";
import {
  getTelegramSession,
  setTelegramSession,
} from "@/lib/server/telegram-sessions";
import { BOT } from "./labels";
import { monthlyInvoicePartsMenuKeyboard } from "./admin-monthly-invoice-parts";
import { monthlyPartsMenuKeyboard } from "./admin-monthly-parts";
import { mainMenuKeyboard } from "./keyboards";

export type AdminPartsPhotoMessage = {
  photo?: { file_id: string }[];
  document?: {
    file_id: string;
    mime_type?: string;
    file_name?: string;
  };
};

export type PartsPhotoTarget = "parts" | "fpart";

function chatKey(chatId: number): string {
  return String(chatId);
}

function partsSessionMonth(data: Record<string, string> | undefined): string {
  return data?.partsMonth?.trim() || currentMonthKey();
}

function fpartSessionMonth(data: Record<string, string> | undefined): string {
  return data?.fpartMonth?.trim() || currentMonthKey();
}

function sessionMonth(data: Record<string, string> | undefined, target: PartsPhotoTarget): string {
  return target === "fpart" ? fpartSessionMonth(data) : partsSessionMonth(data);
}

function monthDataKey(target: PartsPhotoTarget): "fpartMonth" | "partsMonth" {
  return target === "fpart" ? "fpartMonth" : "partsMonth";
}

function menuKeyboard(month: string, target: PartsPhotoTarget): InlineKeyboardMarkup {
  return target === "fpart"
    ? monthlyInvoicePartsMenuKeyboard(month)
    : monthlyPartsMenuKeyboard(month);
}

function escapeKeyboard(target: PartsPhotoTarget): InlineKeyboardMarkup {
  const prefix = target === "fpart" ? "fpart" : "parts";
  return {
    inline_keyboard: [
      [{ text: BOT.cancel, callback_data: `${prefix}:photo:cancel` }],
      [{ text: BOT.menu, callback_data: "menu" }],
    ],
  };
}

async function clearPartsPhotoSession(
  chatKeyStr: string,
  target: PartsPhotoTarget,
  month: string
): Promise<void> {
  await setTelegramSession(chatKeyStr, {
    step: undefined,
    data: { [monthDataKey(target)]: month },
  });
}

function pickImageFromMessage(msg: AdminPartsPhotoMessage): {
  fileId: string;
  mime: string;
} | null {
  if (msg.document?.file_id) {
    const mime = msg.document.mime_type || "application/octet-stream";
    if (!mime.startsWith("image/")) return null;
    return { fileId: msg.document.file_id, mime };
  }
  const photos = msg.photo;
  if (photos?.length) {
    return { fileId: photos[photos.length - 1]!.file_id, mime: "image/jpeg" };
  }
  return null;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatPartsPhotoPreview(
  rows: ParsedPartsOrderRow[],
  month: string,
  target: PartsPhotoTarget
): string {
  const icon = target === "fpart" ? "🧾" : "📦";
  const listName = target === "fpart" ? "На фактуру" : "Запчасти";
  const lines = [
    `${icon} <b>Распознан заказ — ${listName}</b>`,
    `Месяц: <b>${formatMonthLabel(month)}</b>`,
    `Позиций: <b>${rows.length}</b>`,
    "",
    "Закуп = продажа (брутто с фото).",
    "",
  ];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    const num = r.partNumber ? `<code>${escapeHtml(r.partNumber)}</code> · ` : "";
    lines.push(
      `${i + 1}. ${num}<b>${escapeHtml(r.name)}</b> — ${formatMoneyPln(r.priceBrutto)} zł`
    );
  }

  lines.push("", "Подтвердите добавление в список месяца.");
  return lines.join("\n");
}

function previewKeyboard(count: number, target: PartsPhotoTarget): InlineKeyboardMarkup {
  const prefix = target === "fpart" ? "fpart" : "parts";
  return {
    inline_keyboard: [
      [{ text: `✅ Добавить все (${count})`, callback_data: `${prefix}:photo:ok` }],
      [{ text: BOT.cancel, callback_data: `${prefix}:photo:cancel` }],
      [{ text: BOT.menu, callback_data: "menu" }],
    ],
  };
}

export async function startPartsPhotoImport(
  chatId: number,
  messageId: number | undefined,
  target: PartsPhotoTarget
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data, target);
  const step = target === "fpart" ? "admin_fpart_photo" : "admin_parts_photo";

  await setTelegramSession(chatKeyStr, {
    step,
    data: { [monthDataKey(target)]: month, partsPhotoTarget: target },
  });

  const text =
    "📷 <b>Добавление запчастей с фото</b>\n\n" +
    "Отправьте скрин заказа поставщика (как <b>фото</b> или картинку <b>файлом</b>).\n\n" +
    "Распознаем номер, название и цену PLN.\n" +
    "Закуп = продажа (одна цена с фото).\n\n" +
    `Месяц: <b>${formatMonthLabel(month)}</b>\n\n` +
    "Чтобы выйти: <b>❌ Отмена</b>, кнопка «Меню» или команда /menu";

  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, escapeKeyboard(target));
  } else {
    await sendTelegramMessage(chatId, text, escapeKeyboard(target));
  }
}

async function saveParsedParts(
  month: string,
  rows: ParsedPartsOrderRow[],
  target: PartsPhotoTarget
): Promise<{ ok: boolean; count: number; error?: string }> {
  const entries = rows.map((r) =>
    createMonthlyPartEntry(
      month,
      {
        name: r.name,
        partNumber: r.partNumber,
        purchaseBrutto: r.priceBrutto,
        sellBrutto: r.priceBrutto,
      },
      target === "fpart"
        ? { idPrefix: "mip", source: "telegram-invoice" }
        : { source: "telegram" }
    )
  );

  const put = await cloudMutateCrmStore((db) => {
    if (target === "fpart") {
      if (!db.monthlyInvoiceParts) db.monthlyInvoiceParts = [];
      db.monthlyInvoiceParts.push(...entries);
    } else {
      if (!db.monthlyParts) db.monthlyParts = [];
      db.monthlyParts.push(...entries);
    }
  });

  if (!put.ok) return { ok: false, count: 0, error: put.error };
  return { ok: true, count: entries.length };
}

export async function handlePartsPhotoReviewHint(
  chatId: number,
  target: PartsPhotoTarget
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data, target);
  const json = session.data?.partsPhotoJson;
  let rows: ParsedPartsOrderRow[] = [];
  try {
    if (json) rows = JSON.parse(json) as ParsedPartsOrderRow[];
  } catch {
    rows = [];
  }

  if (!rows.length) {
    await clearPartsPhotoSession(chatKeyStr, target, month);
    await sendTelegramMessage(chatId, "Сессия сброшена.", menuKeyboard(month, target));
    return;
  }

  await sendTelegramMessage(
    chatId,
    formatPartsPhotoPreview(rows, month, target),
    previewKeyboard(rows.length, target)
  );
}

export async function handlePartsPhotoMediaMessage(
  chatId: number,
  msg: AdminPartsPhotoMessage
): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const step = session.step;
  if (step !== "admin_parts_photo" && step !== "admin_fpart_photo") return false;

  const target: PartsPhotoTarget =
    session.data?.partsPhotoTarget === "fpart" || step === "admin_fpart_photo"
      ? "fpart"
      : "parts";
  const month = sessionMonth(session.data, target);

  const picked = pickImageFromMessage(msg);
  if (!picked) {
    await sendTelegramMessage(
      chatId,
      "❌ Отправьте <b>фото</b> или изображение как <b>файл</b> (PNG/JPG).",
      escapeKeyboard(target)
    );
    return true;
  }

  await sendTelegramMessage(chatId, "⏳ Распознаю фото (до 1 мин)…", escapeKeyboard(target));

  try {
    const downloaded = await downloadTelegramFileBuffer(picked.fileId);
    if (!downloaded) {
      await clearPartsPhotoSession(chatKeyStr, target, month);
      await sendTelegramMessage(chatId, BOT.importDownloadFailed, menuKeyboard(month, target));
      return true;
    }

    let rawText = "";
    try {
      try {
        const pol = await runPartsOcr(downloaded.buffer, "pol+eng", 14_000);
        if (parsePartsOrderPhotoText(pol).length >= 2) {
          rawText = pol;
        }
      } catch {
        /* try rus below */
      }
      if (!rawText) {
        rawText = await runPartsOcr(downloaded.buffer, "rus+pol+eng", 38_000);
      }
    } catch (e) {
      const timeout = e instanceof Error && e.message === "ocr_timeout";
      await clearPartsPhotoSession(chatKeyStr, target, month);
      await sendTelegramMessage(
        chatId,
        timeout
          ? "❌ Распознавание заняло слишком долго. Попробуйте позже или добавьте вручную.\n\n/menu — главное меню"
          : "❌ Не удалось распознать фото.",
        mainMenuKeyboard()
      );
      return true;
    }

    const rows = parsePartsOrderPhotoText(rawText);
    if (!rows.length) {
      await clearPartsPhotoSession(chatKeyStr, target, month);
      await sendTelegramMessage(
        chatId,
        "❌ Не нашёл позиции на фото.\n\nСделайте скрин крупнее, с видимыми ценами PLN.\n\n/menu — главное меню",
        mainMenuKeyboard()
      );
      return true;
    }

    await setTelegramSession(chatKeyStr, {
      step: target === "fpart" ? "admin_fpart_photo_review" : "admin_parts_photo_review",
      data: {
        [monthDataKey(target)]: month,
        partsPhotoTarget: target,
        partsPhotoJson: JSON.stringify(rows),
      },
    });

    await sendTelegramMessage(
      chatId,
      formatPartsPhotoPreview(rows, month, target),
      previewKeyboard(rows.length, target)
    );
  } catch (e) {
    console.error("[parts photo]", e);
    await clearPartsPhotoSession(chatKeyStr, target, month);
    await sendTelegramMessage(
      chatId,
      "❌ Ошибка обработки фото. Сессия сброшена.\n\nОтправьте /menu",
      mainMenuKeyboard()
    );
  }

  return true;
}

export async function confirmPartsPhotoImport(chatId: number, target: PartsPhotoTarget): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data, target) || currentMonthKey();
  const json = session.data?.partsPhotoJson;

  if (!json) {
    await clearPartsPhotoSession(chatKeyStr, target, month);
    await sendTelegramMessage(chatId, BOT.saveFailed, menuKeyboard(month, target));
    return;
  }

  let rows: ParsedPartsOrderRow[] = [];
  try {
    rows = JSON.parse(json) as ParsedPartsOrderRow[];
  } catch {
    await clearPartsPhotoSession(chatKeyStr, target, month);
    await sendTelegramMessage(chatId, BOT.saveFailed, menuKeyboard(month, target));
    return;
  }

  const saved = await saveParsedParts(month, rows, target);
  await clearPartsPhotoSession(chatKeyStr, target, month);

  if (!saved.ok) {
    await sendTelegramMessage(chatId, BOT.saveFailed, menuKeyboard(month, target));
    return;
  }

  await sendTelegramMessage(
    chatId,
    `${BOT.saved}\n\nДобавлено позиций: <b>${saved.count}</b>\nМесяц: <b>${formatMonthLabel(month)}</b>`,
    menuKeyboard(month, target)
  );
}

export async function cancelPartsPhotoImport(
  chatId: number,
  messageId: number | undefined,
  target: PartsPhotoTarget
): Promise<void> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  const month = sessionMonth(session.data, target) || currentMonthKey();
  await clearPartsPhotoSession(chatKeyStr, target, month);

  const text =
    `✅ Распознавание отменено.\n\n` +
    `📦 Месяц: <b>${formatMonthLabel(month)}</b>`;
  const kb = menuKeyboard(month, target);
  if (messageId) {
    await updateTelegramInlineScreen(chatId, messageId, text, kb);
  } else {
    await sendTelegramMessage(chatId, text, kb);
  }
}

export function isPartsPhotoSessionStep(step: string | undefined): boolean {
  return (
    step === "admin_parts_photo" ||
    step === "admin_fpart_photo" ||
    step === "admin_parts_photo_review" ||
    step === "admin_fpart_photo_review"
  );
}

export function isPartsPhotoWaitingStep(step: string | undefined): boolean {
  return step === "admin_parts_photo" || step === "admin_fpart_photo";
}

export function partsPhotoTargetFromSession(
  data: Record<string, string> | undefined,
  step?: string
): PartsPhotoTarget {
  if (data?.partsPhotoTarget === "fpart" || step === "admin_fpart_photo" || step === "admin_fpart_photo_review") {
    return "fpart";
  }
  return "parts";
}

export async function handlePartsPhotoEscapeText(chatId: number, text: string): Promise<boolean> {
  const chatKeyStr = chatKey(chatId);
  const session = await getTelegramSession(chatKeyStr);
  if (!isPartsPhotoSessionStep(session.step)) return false;

  const target = partsPhotoTargetFromSession(session.data, session.step);
  const lower = text.toLowerCase();

  if (lower === "отмена" || lower === "cancel" || lower === "стоп" || lower === "stop") {
    await cancelPartsPhotoImport(chatId, undefined, target);
    return true;
  }

  if (isPartsPhotoWaitingStep(session.step)) {
    await sendTelegramMessage(
      chatId,
      "📷 Жду фото заказа.\n\n❌ Отмена — кнопкой ниже или команда /menu",
      escapeKeyboard(target)
    );
    return true;
  }

  await handlePartsPhotoReviewHint(chatId, target);
  return true;
}
