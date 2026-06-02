import { cleanEnvValue } from "@/lib/server/supabase-config";

export type InlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

export type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

export type ReplyKeyboardButton = {
  text: string;
  request_contact?: boolean;
};

export type ReplyKeyboardMarkup = {
  keyboard: ReplyKeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  is_persistent?: boolean;
};

export type TelegramReplyMarkup = InlineKeyboardMarkup | ReplyKeyboardMarkup;

export function removeReplyKeyboard(): { remove_keyboard: true } {
  return { remove_keyboard: true };
}

export function getTelegramBotToken(): string | null {
  return cleanEnvValue(process.env.TELEGRAM_BOT_TOKEN);
}

function buildAdminChatIds(primaryChatId: string | null): Set<string> {
  const adminChatIds = new Set<string>();
  if (primaryChatId) adminChatIds.add(primaryChatId);
  const extra = cleanEnvValue(process.env.TELEGRAM_ADMIN_CHAT_IDS);
  if (extra) {
    for (const id of extra.split(",")) {
      const trimmed = id.trim();
      if (trimmed) adminChatIds.add(trimmed);
    }
  }
  return adminChatIds;
}

export function getTelegramConfig(): { token: string; chatId: string; adminChatIds: Set<string> } | null {
  const token = getTelegramBotToken();
  if (!token) return null;

  const chatId = cleanEnvValue(process.env.TELEGRAM_CHAT_ID) ?? "";
  return { token, chatId, adminChatIds: buildAdminChatIds(chatId || null) };
}

export function isAuthorizedChat(chatId: number | string | undefined): boolean {
  if (chatId === undefined || chatId === null) return false;
  const cfg = getTelegramConfig();
  if (!cfg) return false;
  return cfg.adminChatIds.has(String(chatId));
}

type TelegramApiResponse = {
  ok?: boolean;
  description?: string;
  result?: unknown;
};

async function telegramRequest(
  method: string,
  body: Record<string, unknown>
): Promise<TelegramApiResponse | null> {
  const token = getTelegramBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as TelegramApiResponse;
    if (!res.ok || data.ok === false) {
      console.warn(`[telegram] ${method} failed`, res.status, data);
      return data.ok === false ? data : null;
    }
    return data;
  } catch (e) {
    console.warn(`[telegram] ${method} error`, e);
    return null;
  }
}

export async function getTelegramBotInfo(): Promise<{
  ok: boolean;
  username?: string;
  error?: string;
}> {
  const token = getTelegramBotToken();
  if (!token) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN не задан" };
  }

  const res = await telegramRequest("getMe", {});
  if (!res?.ok) {
    return {
      ok: false,
      error: res?.description ?? "Неверный TELEGRAM_BOT_TOKEN",
    };
  }
  const username = (res.result as { username?: string } | undefined)?.username;
  return { ok: true, username };
}

export async function deleteTelegramWebhook(): Promise<boolean> {
  const res = await telegramRequest("deleteWebhook", { drop_pending_updates: true });
  return res?.ok === true;
}

export async function setTelegramWebhook(
  url: string,
  secret?: string
): Promise<{ ok: boolean; error?: string }> {
  await deleteTelegramWebhook();

  const body: Record<string, unknown> = {
    url,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  };
  if (secret) body.secret_token = secret;

  const res = await telegramRequest("setWebhook", body);
  if (res?.ok) return { ok: true };
  return {
    ok: false,
    error: res?.description ?? "setWebhook failed",
  };
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: TelegramReplyMarkup | { remove_keyboard: true }
): Promise<number | null> {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  const res = await telegramRequest("sendMessage", payload);
  const messageId = (res?.result as { message_id?: number } | undefined)?.message_id;
  return messageId ?? null;
}

export type EditTelegramMessageResult = {
  ok: boolean;
  notModified?: boolean;
  description?: string;
};

export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboardMarkup
): Promise<boolean> {
  const result = await editTelegramMessageDetailed(chatId, messageId, text, replyMarkup);
  return result.ok;
}

export async function editTelegramMessageDetailed(
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboardMarkup
): Promise<EditTelegramMessageResult> {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  const res = await telegramRequest("editMessageText", payload);
  const description = res?.description ?? "";
  const notModified =
    res?.ok !== true && description.toLowerCase().includes("message is not modified");
  return {
    ok: res?.ok === true || notModified,
    notModified,
    description,
  };
}

export async function deleteTelegramMessage(
  chatId: number | string,
  messageId: number
): Promise<boolean> {
  const res = await telegramRequest("deleteMessage", {
    chat_id: chatId,
    message_id: messageId,
  });
  return res?.ok === true;
}

/**
 * Updates one inline-keyboard screen: text on top, buttons below.
 * Edits the callback message in place; on failure deletes it and sends a fresh one
 * so content is not left above a stale menu.
 */
export async function updateTelegramInlineScreen(
  chatId: number | string,
  messageId: number | undefined,
  text: string,
  replyMarkup?: InlineKeyboardMarkup
): Promise<number | null> {
  if (messageId) {
    const edit = await editTelegramMessageDetailed(chatId, messageId, text, replyMarkup);
    if (edit.ok) return messageId;
    await deleteTelegramMessage(chatId, messageId).catch(() => false);
  }
  return sendTelegramMessage(chatId, text, replyMarkup);
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  await telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: text ? text.length > 60 : false,
  });
}

export async function setClientBotCommands(): Promise<void> {
  await telegramRequest("setMyCommands", {
    commands: [
      { command: "start", description: "Start / Старт / Menu" },
      { command: "menu", description: "Main menu" },
      { command: "language", description: "Change language / Język" },
    ],
  });
}

export async function notifyAdminTelegram(text: string): Promise<boolean> {
  const cfg = getTelegramConfig();
  if (!cfg) return false;
  let any = false;
  for (const chatId of cfg.adminChatIds) {
    const id = await sendTelegramMessage(chatId, text);
    if (id !== null) any = true;
  }
  return any;
}

function mimeFromTelegramPath(filePath: string, fallback?: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return fallback || "application/octet-stream";
}

/** Download Telegram file (photo, document) up to 8 MB */
export async function downloadTelegramFileBuffer(
  fileId: string
): Promise<{ buffer: Buffer; mime: string; fileName: string } | null> {
  const token = getTelegramBotToken();
  if (!token) return null;

  const fileRes = await telegramRequest("getFile", { file_id: fileId });
  const filePath = (fileRes?.result as { file_path?: string } | undefined)?.file_path;
  if (!filePath) return null;

  try {
    const res = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return null;
    const mime = mimeFromTelegramPath(filePath);
    const fileName = filePath.split("/").pop() || "file";
    return { buffer: buf, mime, fileName };
  } catch {
    return null;
  }
}

/** Download Telegram file as data URL (for CRM attachments) */
export async function downloadTelegramPhotoAsDataUrl(
  fileId: string
): Promise<string | null> {
  const file = await downloadTelegramFileBuffer(fileId);
  if (!file || file.buffer.length > 4_500_000) return null;
  return `data:${file.mime};base64,${file.buffer.toString("base64")}`;
}
