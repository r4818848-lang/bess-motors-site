import { normalizePhone } from "@/lib/auth";
import { knownScreenshotForOrder } from "@/lib/apply-known-screenshot-to-order";
import {
  createWorkOrderFromImport,
  type CreateFromImportInput,
} from "@/lib/create-work-order-from-import";
import {
  bufferToImportDataUrl,
  importOrderExists,
  normalizeImportOrderKey,
  prepareImportDraft,
} from "@/lib/import-work-order-helpers";
import { extractTextFromImportFile } from "@/lib/server/extract-import-document-text";
import {
  downloadTelegramFileBuffer,
  sendTelegramMessage,
  type InlineKeyboardMarkup,
} from "@/lib/server/telegram-api";
import {
  clearTelegramSession,
  getTelegramSession,
  setTelegramSession,
} from "@/lib/server/telegram-sessions";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import {
  parseWorkOrderImportText,
  type ImportWorkOrderDraft,
} from "@/lib/motowarsztat-import-parser";
import { isOcrTextLikelyUseful, isOcrTextMaybeUseful } from "@/lib/server/ocr-import-image";
import { BOT } from "./labels";

export type AdminTelegramFileMessage = {
  message_id: number;
  chat: { id: number };
  photo?: { file_id: string; file_size?: number }[];
  document?: {
    file_id: string;
    mime_type?: string;
    file_name?: string;
    file_size?: number;
  };
};

type PickedFile = {
  fileId: string;
  mime: string;
  fileName: string;
};

function importPreviewKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: BOT.importConfirm, callback_data: "imp:confirm" }],
      [{ text: BOT.importEditPhone, callback_data: "imp:phone" }],
      [{ text: BOT.cancel, callback_data: "menu" }],
    ],
  };
}

function importBulkContinueKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatImportPreview(draft: ImportWorkOrderDraft): string {
  const lines = ["📄 <b>Распознан документ</b>"];
  if (draft.orderNumber?.trim()) {
    lines.push(`📋 ${escapeHtml(draft.orderNumber.trim())}`);
  }
  lines.push(
    "",
    `👤 ${escapeHtml(draft.clientName || "—")}`,
    `📱 <b>${escapeHtml(draft.phone || "—")}</b>`,
    `🚗 ${escapeHtml(draft.plate || "—")}`
  );
  if (draft.vin) lines.push(`VIN: <code>${escapeHtml(draft.vin)}</code>`);
  if (draft.make || draft.model) {
    lines.push(`🚙 ${escapeHtml([draft.make, draft.model].filter(Boolean).join(" "))}`);
  }
  lines.push(`🔧 Работ: ${draft.services.length} · 🔩 Частей: ${draft.parts.length}`);

  if (draft.services.length > 0) {
    for (const s of draft.services.slice(0, 4)) {
      lines.push(`• ${escapeHtml(s.name)} — ${s.price.toFixed(2)} zł`);
    }
    if (draft.services.length > 4) lines.push(`… работ +${draft.services.length - 4}`);
  }
  if (draft.parts.length > 0) {
    for (const p of draft.parts.slice(0, 4)) {
      const sell = p.sellPrice.toFixed(2);
      if (p.purchasePrice > 0) {
        lines.push(
          `• ${escapeHtml(p.name)} — zakup ${p.purchasePrice.toFixed(2)} / sprz. ${sell} zł`
        );
      } else {
        lines.push(`• ${escapeHtml(p.name)} — sprzedaż ${sell} zł`);
      }
    }
    if (draft.parts.length > 4) lines.push(`… частей +${draft.parts.length - 4}`);
  }

  if (knownScreenshotForOrder(draft.orderNumber)) {
    lines.push("", "💾 Закупочные цены и артикулы подставятся автоматически.");
  } else if (draft.parts.some((p) => p.purchasePrice <= 0 && p.sellPrice > 0)) {
    lines.push("", "ℹ️ В PDF нет закупки — введите в CRM вручную.");
  }

  if (!draft.phone?.trim()) {
    lines.push("", "⚠️ Нет телефона — нажмите «Изменить телефон».");
  }

  lines.push("", "Статус: <b>выдан / оплачен</b>.", "Подтвердите создание.");
  return lines.join("\n");
}

function pickFileFromMessage(msg: AdminTelegramFileMessage): PickedFile | null {
  if (msg.document?.file_id) {
    const mime = msg.document.mime_type || "application/octet-stream";
    const fileName = msg.document.file_name || "document.pdf";
    return { fileId: msg.document.file_id, mime, fileName };
  }
  const photos = msg.photo;
  if (photos?.length) {
    const best = photos[photos.length - 1];
    return {
      fileId: best.file_id,
      mime: "image/jpeg",
      fileName: "photo.jpg",
    };
  }
  return null;
}

async function parseImportFileBuffer(
  buffer: Buffer,
  mime: string
): Promise<{ ok: true; parsed: ImportWorkOrderDraft } | { ok: false; error: string }> {
  let rawText = "";
  try {
    rawText = await extractTextFromImportFile(buffer, mime);
  } catch (e) {
    const code = e instanceof Error ? e.message : "parse_failed";
    if (code === "file_too_large") {
      return { ok: false, error: "Файл слишком большой (макс. 8 МБ)." };
    }
    return { ok: false, error: "Не удалось обработать файл." };
  }

  const trimmed = rawText.replace(/\s+/g, " ").trim();
  if (trimmed.length < 8) {
    return { ok: false, error: "no_text" };
  }

  const isImage = mime.startsWith("image/");
  if (isImage && !isOcrTextLikelyUseful(rawText) && !isOcrTextMaybeUseful(rawText)) {
    return { ok: false, error: "ocr_poor" };
  }

  const parsed = parseWorkOrderImportText(rawText);
  return { ok: true, parsed };
}

function siteOrderLink(orderId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.bess-motors.com";
  return `<a href="${base}/crm/work-orders?edit=${orderId}">Открыть в CRM</a>`;
}

async function createImportFromDraft(
  draft: ImportWorkOrderDraft,
  attachment?: CreateFromImportInput["attachment"]
): Promise<
  | { ok: true; orderNumber: string; orderId: string; enriched: boolean }
  | { ok: false; error: string }
> {
  let orderNumber = "";
  let orderId = "";
  let createError = "";
  let enriched = false;
  const orderKey = normalizeImportOrderKey(draft.orderNumber, attachment?.name ?? "");

  const put = await cloudMutateCrmStore(async (db) => {
    if (importOrderExists(db, orderKey)) {
      createError = "already_exists";
      return false;
    }

    const result = await createWorkOrderFromImport(db, { ...draft, attachment });
    if (!result.ok) {
      createError = result.error;
      return false;
    }

    orderNumber = result.orderNumber;
    orderId = result.orderId;
    enriched = Boolean(knownScreenshotForOrder(result.orderNumber));
    return result.orderNumber;
  });

  if (createError === "already_exists") {
    return { ok: false, error: "already_exists" };
  }
  if (createError) {
    return { ok: false, error: createError };
  }
  if (!put.ok) {
    return { ok: false, error: put.error ?? "cloud_save_failed" };
  }

  return { ok: true, orderNumber, orderId, enriched };
}

export async function startImportWorkOrderFlow(chatId: number, messageId?: number): Promise<void> {
  const chatKey = String(chatId);
  await setTelegramSession(chatKey, { step: "admin_import_file", data: {} });
  const text = BOT.importPrompt;
  const keyboard = {
    inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
  };
  if (messageId) {
    const { updateTelegramInlineScreen } = await import("@/lib/server/telegram-api");
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function startImportBulkWorkOrderFlow(
  chatId: number,
  messageId?: number
): Promise<void> {
  const chatKey = String(chatId);
  await setTelegramSession(chatKey, {
    step: "admin_import_bulk",
    data: { bulkIndex: "0", bulkImported: "0", bulkSkipped: "0", bulkFailed: "0" },
  });
  const text = BOT.importBulkPrompt;
  const keyboard = {
    inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
  };
  if (messageId) {
    const { updateTelegramInlineScreen } = await import("@/lib/server/telegram-api");
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

async function handleAdminImportBulkFile(
  chatId: number,
  picked: PickedFile,
  buffer: Buffer
): Promise<boolean> {
  const chatKey = String(chatId);
  const session = await getTelegramSession(chatKey);
  const index = Number.parseInt(session.data?.bulkIndex ?? "0", 10) + 1;
  let imported = Number.parseInt(session.data?.bulkImported ?? "0", 10);
  let skipped = Number.parseInt(session.data?.bulkSkipped ?? "0", 10);
  let failed = Number.parseInt(session.data?.bulkFailed ?? "0", 10);

  const parsedResult = await parseImportFileBuffer(buffer, picked.mime);
  if (!parsedResult.ok) {
    failed += 1;
    const errText =
      parsedResult.error === "no_text"
        ? BOT.importNoText
        : parsedResult.error === "ocr_poor"
          ? BOT.importOcrPoor
          : `❌ ${parsedResult.error}`;
    await setTelegramSession(chatKey, {
      step: "admin_import_bulk",
      data: {
        ...session.data,
        bulkIndex: String(index),
        bulkImported: String(imported),
        bulkSkipped: String(skipped),
        bulkFailed: String(failed),
      },
    });
    await sendTelegramMessage(
      chatId,
      `${errText}\n\n📎 ${escapeHtml(picked.fileName)}\n\nОтправьте следующий PDF или «Отмена».`,
      importBulkContinueKeyboard()
    );
    return true;
  }

  const draft = prepareImportDraft(parsedResult.parsed, picked.fileName, index);
  draft.internalNotes = [draft.internalNotes, "Импорт: Telegram (массовый)"]
    .filter(Boolean)
    .join("\n");

  const attachment =
    buffer.length <= 4_500_000
      ? {
          name: picked.fileName,
          mime: picked.mime || "application/pdf",
          dataUrl: bufferToImportDataUrl(buffer, picked.mime || "application/pdf"),
        }
      : undefined;

  const created = await createImportFromDraft(draft, attachment);
  let message = "";
  if (created.ok) {
    imported += 1;
    message =
      `${BOT.saved}\n\n` +
      `📋 <b>${escapeHtml(created.orderNumber)}</b>\n` +
      `📎 ${escapeHtml(picked.fileName)}\n` +
      (created.enriched ? "💾 Закупка из CRM подставлена.\n" : "") +
      `🔗 ${siteOrderLink(created.orderId)}\n\n` +
      "Отправьте следующий PDF.";
  } else if (created.error === "already_exists") {
    skipped += 1;
    message =
      `⏭ Уже в CRM: <b>${escapeHtml(normalizeImportOrderKey(draft.orderNumber, picked.fileName))}</b>\n` +
      `📎 ${escapeHtml(picked.fileName)}\n\n` +
      "Отправьте следующий PDF.";
  } else {
    failed += 1;
    const err =
      created.error === "phone_required"
        ? "Нужен телефон в PDF."
        : created.error === "client_vehicle_required"
          ? "Не удалось привязать авто."
          : BOT.saveFailed;
    message = `❌ ${err}\n📎 ${escapeHtml(picked.fileName)}\n\nПопробуйте другой файл.`;
  }

  await setTelegramSession(chatKey, {
    step: "admin_import_bulk",
    data: {
      bulkIndex: String(index),
      bulkImported: String(imported),
      bulkSkipped: String(skipped),
      bulkFailed: String(failed),
    },
  });

  await sendTelegramMessage(chatId, message, importBulkContinueKeyboard());
  return true;
}

export async function handleAdminImportMediaMessage(
  msg: AdminTelegramFileMessage
): Promise<boolean> {
  const chatId = msg.chat.id;
  const chatKey = String(chatId);
  const session = await getTelegramSession(chatKey);
  if (session.step !== "admin_import_file" && session.step !== "admin_import_bulk") {
    return false;
  }

  const picked = pickFileFromMessage(msg);
  if (!picked) {
    await sendTelegramMessage(chatId, BOT.importBadFile, {
      inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
    });
    return true;
  }

  await sendTelegramMessage(chatId, BOT.importParsing);

  const downloaded = await downloadTelegramFileBuffer(picked.fileId);
  if (!downloaded) {
    await sendTelegramMessage(chatId, BOT.importDownloadFailed, {
      inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
    });
    return true;
  }

  if (session.step === "admin_import_bulk") {
    return handleAdminImportBulkFile(chatId, picked, downloaded.buffer);
  }

  const parsedResult = await parseImportFileBuffer(downloaded.buffer, picked.mime);
  if (!parsedResult.ok) {
    const errText =
      parsedResult.error === "no_text"
        ? BOT.importNoText
        : parsedResult.error === "ocr_poor"
          ? BOT.importOcrPoor
          : `❌ ${parsedResult.error}`;
    await sendTelegramMessage(chatId, errText, {
      inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
    });
    return true;
  }

  const parsed = parsedResult.parsed;
  if (!parsed.phone?.trim()) {
    parsed.warnings = [...(parsed.warnings ?? []), "phone"];
  }

  await setTelegramSession(chatKey, {
    step: "admin_import_review",
    data: {
      draftJson: JSON.stringify(parsed),
      fileId: picked.fileId,
      fileName: picked.fileName,
      mime: picked.mime,
    },
  });

  await sendTelegramMessage(chatId, formatImportPreview(parsed), importPreviewKeyboard());
  return true;
}

/** Text while import flow is active — keep inline keyboard on review step */
export async function handleAdminImportStepText(chatId: number): Promise<boolean> {
  const chatKey = String(chatId);
  const session = await getTelegramSession(chatKey);
  if (session.step === "admin_import_review" && session.data?.draftJson) {
    try {
      const draft = JSON.parse(session.data.draftJson) as ImportWorkOrderDraft;
      await sendTelegramMessage(
        chatId,
        `📄 Используйте кнопки ниже.\n\n${formatImportPreview(draft)}`,
        importPreviewKeyboard()
      );
    } catch {
      await sendTelegramMessage(chatId, BOT.importPrompt, {
        inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
      });
    }
    return true;
  }
  if (session.step === "admin_import_file") {
    await sendTelegramMessage(chatId, BOT.importPrompt, {
      inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
    });
    return true;
  }
  if (session.step === "admin_import_bulk") {
    const imported = session.data?.bulkImported ?? "0";
    const skipped = session.data?.bulkSkipped ?? "0";
    const failed = session.data?.bulkFailed ?? "0";
    await sendTelegramMessage(
      chatId,
      `${BOT.importBulkPrompt}\n\n📊 Создано: ${imported}, пропущено: ${skipped}, ошибок: ${failed}.`,
      importBulkContinueKeyboard()
    );
    return true;
  }
  return false;
}

export async function handleAdminImportPhoneText(
  chatId: number,
  text: string
): Promise<boolean> {
  const chatKey = String(chatId);
  const session = await getTelegramSession(chatKey);
  if (session.step !== "admin_import_phone" || !session.data?.draftJson) return false;

  const phone = normalizePhone(text.trim());
  if (!phone) {
    await sendTelegramMessage(chatId, BOT.importPhoneInvalid, {
      inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
    });
    return true;
  }

  let draft: ImportWorkOrderDraft;
  try {
    draft = JSON.parse(session.data.draftJson) as ImportWorkOrderDraft;
  } catch {
    await clearTelegramSession(chatKey);
    await sendTelegramMessage(chatId, BOT.saveFailed, {
      inline_keyboard: [[{ text: BOT.menu, callback_data: "menu" }]],
    });
    return true;
  }

  draft.phone = phone;
  await setTelegramSession(chatKey, {
    step: "admin_import_review",
    data: {
      ...session.data,
      draftJson: JSON.stringify(draft),
    },
  });

  await sendTelegramMessage(chatId, formatImportPreview(draft), importPreviewKeyboard());
  return true;
}

export async function promptImportPhoneEdit(chatId: number, messageId?: number): Promise<void> {
  const chatKey = String(chatId);
  const session = await getTelegramSession(chatKey);
  if (!session.data?.draftJson) {
    await startImportWorkOrderFlow(chatId, messageId);
    return;
  }
  await setTelegramSession(chatKey, {
    step: "admin_import_phone",
    data: session.data,
  });
  const keyboard = {
    inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
  };
  const text = BOT.importPhonePrompt;
  if (messageId) {
    const { updateTelegramInlineScreen } = await import("@/lib/server/telegram-api");
    await updateTelegramInlineScreen(chatId, messageId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

async function bufferToDataUrl(buffer: Buffer, mime: string): Promise<string> {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function confirmImportWorkOrder(chatId: number): Promise<string> {
  const chatKey = String(chatId);
  const session = await getTelegramSession(chatKey);
  if (session.step !== "admin_import_review" || !session.data?.draftJson) {
    return "❌ Сессия истекла. Начните снова: меню → Импорт PDF/фото.";
  }

  let draft: ImportWorkOrderDraft;
  try {
    draft = JSON.parse(session.data.draftJson) as ImportWorkOrderDraft;
  } catch {
    await clearTelegramSession(chatKey);
    return BOT.saveFailed;
  }

  if (!draft.phone?.trim()) {
    return "❌ Укажите телефон: «Изменить телефон» или отправьте заново.";
  }

  const fileId = session.data.fileId;
  const fileName = session.data.fileName || "import.pdf";
  const mime = session.data.mime || "application/pdf";

  let attachment: CreateFromImportInput["attachment"];
  if (fileId) {
    const downloaded = await downloadTelegramFileBuffer(fileId);
    if (downloaded && downloaded.buffer.length <= 4_500_000) {
      attachment = {
        name: fileName,
        mime: mime || downloaded.mime,
        dataUrl: await bufferToDataUrl(downloaded.buffer, mime || downloaded.mime),
      };
    }
  }

  draft.internalNotes = [draft.internalNotes, "Импорт: Telegram"].filter(Boolean).join("\n");

  const created = await createImportFromDraft(draft, attachment);

  if (!created.ok) {
    if (created.error === "already_exists") {
      const key = normalizeImportOrderKey(draft.orderNumber, fileName);
      return `❌ Заказ <b>${escapeHtml(key)}</b> уже есть в CRM.`;
    }
    const err =
      created.error === "phone_required"
        ? "Нужен телефон клиента."
        : created.error === "client_vehicle_required"
          ? "Не удалось привязать авто — проверьте VIN/номер."
          : BOT.saveFailed;
    return `❌ ${err}`;
  }

  await clearTelegramSession(chatKey);

  return (
    `${BOT.saved}\n\n` +
    `📋 Заказ-наряд <b>${escapeHtml(created.orderNumber)}</b>\n` +
    (created.enriched ? "💾 Закупочные цены подставлены из CRM.\n" : "") +
    `🔗 ${siteOrderLink(created.orderId)}`
  );
}
