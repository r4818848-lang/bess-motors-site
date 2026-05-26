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

async function telegramRequest<T>(
  method: string,
  body: Record<string, unknown>
): Promise<T | null> {
  const cfg = getTelegramConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[telegram] ${method} failed`, res.status, await res.text());
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[telegram] ${method} error`, e);
    return null;
  }
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

  const res = await telegramRequest<{ result?: { message_id?: number } }>("sendMessage", payload);
  return res?.result?.message_id ?? null;
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

  const res = await telegramRequest<{ ok?: boolean }>("editMessageText", payload);
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

export async function setTelegramWebhook(url: string, secret?: string): Promise<boolean> {
  const body: Record<string, unknown> = { url, allowed_updates: ["message", "callback_query"] };
  if (secret) body.secret_token = secret;
  const res = await telegramRequest<{ ok?: boolean }>("setWebhook", body);
  return res?.ok === true;
}
