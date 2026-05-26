import { cleanEnvValue } from "@/lib/server/supabase-config";

export type InlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

export type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

export function getTelegramConfig(): { token: string; chatId: string; adminChatIds: Set<string> } | null {
  const token = cleanEnvValue(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = cleanEnvValue(process.env.TELEGRAM_CHAT_ID);
  if (!token || !chatId) return null;

  const extra = cleanEnvValue(process.env.TELEGRAM_ADMIN_CHAT_IDS);
  const adminChatIds = new Set<string>([chatId]);
  if (extra) {
    for (const id of extra.split(",")) {
      const trimmed = id.trim();
      if (trimmed) adminChatIds.add(trimmed);
    }
  }
  return { token, chatId, adminChatIds };
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
  const cfg = getTelegramConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/${method}`, {
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
  const cfg = getTelegramConfig();
  if (!cfg) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы" };
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
  replyMarkup?: InlineKeyboardMarkup
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

export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: InlineKeyboardMarkup
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  const res = await telegramRequest("editMessageText", payload);
  return res?.ok === true;
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

export async function notifyAdminTelegram(text: string): Promise<boolean> {
  const cfg = getTelegramConfig();
  if (!cfg) return false;
  const id = await sendTelegramMessage(cfg.chatId, text);
  return id !== null;
}
