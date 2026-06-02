import { normalizePhone } from "@/lib/auth";
import {
  createWorkOrderFromImport,
  type CreateFromImportInput,
} from "@/lib/create-work-order-from-import";
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
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import {
  parseWorkOrderImportText,
  type ImportWorkOrderDraft,
} from "@/lib/motowarsztat-import-parser";
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

function importPreviewKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: BOT.importConfirm, callback_data: "imp:confirm" }],
      [{ text: BOT.importEditPhone, callback_data: "imp:phone" }],
      [{ text: BOT.cancel, callback_data: "menu" }],
    ],
  };
}

function formatImportPreview(draft: ImportWorkOrderDraft): string {
  const lines = [
    "📄 <b>Распознан документ</b>",
    "",
    `👤 ${escapeHtml(draft.clientName || "—")}`,
    `📱 <b>${escapeHtml(draft.phone || "—")}</b>`,
    `🚗 ${escapeHtml(draft.plate || "—")}`,
  ];
  if (draft.vin) lines.push(`VIN: <code>${escapeHtml(draft.vin)}</code>`);
  lines.push(`🔧 Услуг: ${draft.services.length}`);
  if (draft.services.length > 0) {
    const top = draft.services.slice(0, 5);
    for (const s of top) {
      lines.push(`• ${escapeHtml(s.name)} — ${s.price.toFixed(2)} zł`);
    }
    if (draft.services.length > 5) {
      lines.push(`… ещё ${draft.services.length - 5}`);
    }
  }
  if (draft.warnings.length) {
    lines.push("", "⚠️ Проверьте поля перед созданием.");
  }
  lines.push("", "Подтвердите или измените телефон.");
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pickFileFromMessage(msg: AdminTelegramFileMessage): {
  fileId: string;
  mime: string;
  fileName: string;
} | null {
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

export async function handleAdminImportMediaMessage(
  msg: AdminTelegramFileMessage
): Promise<boolean> {
  const chatId = msg.chat.id;
  const chatKey = String(chatId);
  const session = await getTelegramSession(chatKey);
  if (session.step !== "admin_import_file") return false;

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

  let rawText = "";
  try {
    rawText = await extractTextFromImportFile(downloaded.buffer, picked.mime);
  } catch (e) {
    const code = e instanceof Error ? e.message : "parse_failed";
    const hint =
      code === "file_too_large"
        ? "Файл слишком большой (макс. 8 МБ)."
        : "Не удалось обработать файл.";
    await sendTelegramMessage(chatId, `❌ ${hint}`, {
      inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
    });
    return true;
  }

  const trimmed = rawText.replace(/\s+/g, " ").trim();
  if (trimmed.length < 8) {
    await sendTelegramMessage(chatId, BOT.importNoText, {
      inline_keyboard: [[{ text: BOT.cancel, callback_data: "menu" }]],
    });
    return true;
  }

  const parsed = parseWorkOrderImportText(rawText);
  if (!parsed.phone?.trim()) {
    parsed.warnings.push("phone");
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

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return BOT.cloudOff;
  }

  const db = structuredClone(snap.doc);
  const prevDb = structuredClone(snap.doc);
  const result = await createWorkOrderFromImport(db, {
    ...draft,
    attachment,
  });

  if (!result.ok) {
    const err =
      result.error === "phone_required"
        ? "Нужен телефон клиента."
        : result.error === "client_vehicle_required"
          ? "Не удалось привязать авто — проверьте таблицу."
          : BOT.saveFailed;
    return `❌ ${err}`;
  }

  const { runCrmAutomation } = await import("@/lib/crm-automation");
  runCrmAutomation(db, prevDb);
  const put = await cloudPutCrmStore(db);
  await clearTelegramSession(chatKey);

  if (!put.ok) {
    return `⚠️ Заказ <b>${result.orderNumber}</b> создан локально, но облако не сохранило. Синхронизируйте CRM на сайте.`;
  }

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.bess-motors.com";
  return (
    `${BOT.saved}\n\n` +
    `📋 Заказ-наряд <b>${result.orderNumber}</b>\n` +
    `🔗 <a href="${base}/crm/work-orders?edit=${result.orderId}">Открыть в CRM</a>`
  );
}
