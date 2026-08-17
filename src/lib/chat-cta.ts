import { telegramBotUrl } from "@/lib/telegram-links";
import { whatsappContactUrl } from "@/lib/whatsapp";

/** Prefill: service + phone — not a client cabinet */
const CHAT_NEED_MESSAGE: Record<"pl" | "ru" | "en" | "uk", string> = {
  pl: "Dzień dobry, BESS MOTORS.\nPotrzebuję: (usługa)\nTelefon: ",
  ru: "Здравствуйте, BESS MOTORS.\nНужно: (услуга)\nТелефон: ",
  en: "Hello, BESS MOTORS.\nI need: (service)\nPhone: ",
  uk: "Добрий день, BESS MOTORS.\nПотрібно: (послуга)\nТелефон: ",
};

function chatLocale(locale: string): "pl" | "ru" | "en" | "uk" {
  if (locale === "ru" || locale === "en" || locale === "uk") return locale;
  return "pl";
}

export function chatNeedMessage(locale: string): string {
  return CHAT_NEED_MESSAGE[chatLocale(locale)];
}

export function workshopWhatsAppChatUrl(locale: string): string {
  return whatsappContactUrl(chatNeedMessage(locale));
}

/** Telegram bot opens a free-text chat (service + phone), not a cabinet */
export function workshopTelegramChatUrl(): string {
  return telegramBotUrl("chat");
}
