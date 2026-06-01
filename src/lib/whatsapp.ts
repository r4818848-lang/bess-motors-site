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
  pl: "Dzień dobry, chcę umówić wizytę w BESS MOTORS. Proszę o kontakt.",
  ru: "Здравствуйте, хочу записаться в BESS MOTORS. Прошу связаться.",
  en: "Hello, I would like to book a visit at BESS MOTORS. Please contact me.",
  uk: "Добрий день, хочу записатися в BESS MOTORS. Прошу зв'язатися.",
};

export function whatsappDefaultMessage(locale: string): string {
  if (locale === "ru") return DEFAULT_MESSAGE.ru;
  if (locale === "en") return DEFAULT_MESSAGE.en;
  if (locale === "uk") return DEFAULT_MESSAGE.uk;
  return DEFAULT_MESSAGE.pl;
}
