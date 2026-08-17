import { siteConfig } from "@/lib/site";

/** Digits only for wa.me (e.g. 48791257229) */
export function whatsappPhoneDigits(): string {
  return siteConfig.phone.replace(/\D/g, "");
}

/** Open chat with optional pre-filled message */
export function whatsappContactUrl(message?: string): string {
  const base = `https://wa.me/${whatsappPhoneDigits()}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

const DEFAULT_MESSAGE: Record<"pl" | "ru" | "en" | "uk", string> = {
  pl: "Dzień dobry, BESS MOTORS.\nPotrzebuję: (usługa)\nTelefon: ",
  ru: "Здравствуйте, BESS MOTORS.\nНужно: (услуга)\nТелефон: ",
  en: "Hello, BESS MOTORS.\nI need: (service)\nPhone: ",
  uk: "Добрий день, BESS MOTORS.\nПотрібно: (послуга)\nТелефон: ",
};

export function whatsappDefaultMessage(locale: string): string {
  if (locale === "ru") return DEFAULT_MESSAGE.ru;
  if (locale === "en") return DEFAULT_MESSAGE.en;
  if (locale === "uk") return DEFAULT_MESSAGE.uk;
  return DEFAULT_MESSAGE.pl;
}
