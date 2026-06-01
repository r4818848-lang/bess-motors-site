import { siteConfig } from "./site";
import { getSignUrl } from "./work-order-share";
import { adminQuickTemplates } from "./admin-message-templates";

export type WaMsgLocale = "pl" | "ru" | "en" | "uk";

export type WaMasterTemplate =
  | "ready"
  | "parts"
  | "diagnostic"
  | "callme"
  | "prepay"
  | "delay"
  | "partsArrived"
  | "pickup";

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Open WhatsApp chat with the client phone and pre-filled message (staff taps Send). */
export function whatsappToClientUrl(phone: string, text: string): string | null {
  const digits = phoneDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function stripHtmlForWhatsApp(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function resolveLocale(locale: WaMsgLocale): "pl" | "ru" | "en" | "uk" {
  if (locale === "pl" || locale === "en" || locale === "uk") return locale;
  return "ru";
}

const MASTER_MSGS: Record<WaMasterTemplate, Record<"pl" | "ru" | "en" | "uk", string>> = {
  ready: {
    pl: "✅ Auto gotowe do odbioru!\n\n🚗 {car}\n📋 {number}\n\nZapraszamy w godzinach pracy.\nBESS MOTORS",
    ru: "✅ Автомобиль готов к выдаче!\n\n🚗 {car}\n📋 {number}\n\nЖдём вас в рабочее время.\nBESS MOTORS",
    uk: "✅ Авто готове до видачі!\n\n🚗 {car}\n📋 {number}\n\nBESS MOTORS",
    en: "✅ Your car is ready!\n\n🚗 {car}\n📋 {number}\n\nPick up during opening hours.\nBESS MOTORS",
  },
  parts: {
    pl: "⏳ Czekamy na części\n\n🚗 {car}\n📋 {number}\n\nSkontaktujemy się, gdy będą.\nBESS MOTORS",
    ru: "⏳ Ожидаем запчасти\n\n🚗 {car}\n📋 {number}\n\nСвяжемся, когда детали будут.\nBESS MOTORS",
    uk: "⏳ Очікуємо запчастини\n\n🚗 {car}\n📋 {number}\n\nBESS MOTORS",
    en: "⏳ Waiting for parts\n\n🚗 {car}\n📋 {number}\n\nWe will contact you.\nBESS MOTORS",
  },
  diagnostic: {
    pl: "🔍 Trwa diagnostyka\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
    ru: "🔍 Идёт диагностика\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
    uk: "🔍 Триває діагностика\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
    en: "🔍 Diagnostics in progress\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
  },
  callme: {
    pl: "📞 Prosimy o kontakt\n\n🚗 {car}\n📋 {number}\n\nZadzwoń do warsztatu.\nBESS MOTORS",
    ru: "📞 Нужна связь с вами\n\n🚗 {car}\n📋 {number}\n\nПозвоните в сервис.\nBESS MOTORS",
    uk: "📞 Зв'яжіться з нами\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
    en: "📞 Please call us\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
  },
  prepay: {
    pl: "💳 Przedpłata\n\n🚗 {car}\n📋 {number}\n\nProsimy o zaliczkę przed zamówieniem części.\nBESS MOTORS",
    ru: "💳 Предоплата\n\n🚗 {car}\n📋 {number}\n\nНужна предоплата перед заказом запчастей.\nBESS MOTORS",
    uk: "💳 Передоплата\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
    en: "💳 Prepayment\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
  },
  delay: {
    pl: "⏱ Opóźnienie\n\n🚗 {car}\n📋 {number}\n\nPrace trwają dłużej — damy znać.\nBESS MOTORS",
    ru: "⏱ Задержка\n\n🚗 {car}\n📋 {number}\n\nРаботы затягиваются — сообщим срок.\nBESS MOTORS",
    uk: "⏱ Затримка\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
    en: "⏱ Delay\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
  },
  partsArrived: {
    pl: "📦 Części dotarły\n\n🚗 {car}\n📋 {number}\n\nWznawiamy naprawę.\nBESS MOTORS",
    ru: "📦 Запчасти приехали\n\n🚗 {car}\n📋 {number}\n\nПродолжаем ремонт.\nBESS MOTORS",
    uk: "📦 Запчастини прибули\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
    en: "📦 Parts arrived\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
  },
  pickup: {
    pl: "🚗 Odbiór\n\n🚗 {car}\n📋 {number}\n\nMożna odbierać w godzinach pracy.\nBESS MOTORS",
    ru: "🚗 Выдача\n\n🚗 {car}\n📋 {number}\n\nМожно забирать в рабочее время.\nBESS MOTORS",
    uk: "🚗 Видача\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
    en: "🚗 Pickup\n\n🚗 {car}\n📋 {number}\nBESS MOTORS",
  },
};

export function buildMasterTemplateMessage(
  template: WaMasterTemplate,
  locale: WaMsgLocale,
  car: string,
  orderNumber: string
): string {
  const loc = resolveLocale(locale);
  const raw = MASTER_MSGS[template][loc] ?? MASTER_MSGS[template].ru;
  return raw.replace("{car}", car).replace("{number}", orderNumber);
}

export function buildMasterTemplateWhatsAppUrl(
  clientPhone: string,
  template: WaMasterTemplate,
  locale: WaMsgLocale,
  car: string,
  orderNumber: string
): string | null {
  return whatsappToClientUrl(
    clientPhone,
    buildMasterTemplateMessage(template, locale, car, orderNumber)
  );
}

export function buildCarReadyMessage(
  orderNumber: string,
  vehicleLabel: string,
  locale: WaMsgLocale
): string {
  const reviewUrl = siteConfig.googleMapsReviewsUrl;
  const loc = resolveLocale(locale);
  const messages: Record<"pl" | "ru" | "en", string> = {
    pl: `Dzień dobry! Państwa ${vehicleLabel} jest gotowy do odbioru (${orderNumber}). Prosimy o odbiór w ciągu 7 dni. Będziemy wdzięczni za opinię w Google Maps: ${reviewUrl}\n\nBESS MOTORS`,
    ru: `Здравствуйте! Ваш автомобиль ${vehicleLabel} готов к выдаче (${orderNumber}). Заберите в течение 7 дней. Будем благодарны за отзыв в Google Maps: ${reviewUrl}\n\nBESS MOTORS`,
    en: `Hello! Your ${vehicleLabel} is ready for pickup (${orderNumber}). Please collect within 7 days. We would appreciate a Google Maps review: ${reviewUrl}\n\nBESS MOTORS`,
  };
  if (loc === "uk") {
    return `Вітаємо! Ваше авто ${vehicleLabel} готове до видачі (${orderNumber}). Заберіть протягом 7 днів. Відгук у Google Maps: ${reviewUrl}\n\nBESS MOTORS`;
  }
  return messages[loc === "en" ? "en" : loc === "pl" ? "pl" : "ru"];
}

export function buildCarReadyWhatsAppUrl(
  clientPhone: string,
  orderNumber: string,
  vehicleLabel: string,
  locale: WaMsgLocale
): string | null {
  return whatsappToClientUrl(
    clientPhone,
    buildCarReadyMessage(orderNumber, vehicleLabel, locale)
  );
}

export function buildSignRemindMessage(
  locale: WaMsgLocale,
  params: { orderNumber: string; car: string; signUrl: string }
): string {
  const loc = resolveLocale(locale);
  const { orderNumber, car, signUrl } = params;
  const copies: Record<"pl" | "ru" | "en" | "uk", string> = {
    pl: `✍️ BESS MOTORS — dokument do podpisu\n\nZlecenie ${orderNumber}\n🚗 ${car}\n\nProsimy o podpis:\n${signUrl}`,
    ru: `✍️ BESS MOTORS — документ на подпись\n\nЗаказ-наряд ${orderNumber}\n🚗 ${car}\n\nПодпишите по ссылке:\n${signUrl}`,
    uk: `✍️ BESS MOTORS — документ на підпис\n\nЗамовлення ${orderNumber}\n🚗 ${car}\n\nПідпишіть за посиланням:\n${signUrl}`,
    en: `✍️ BESS MOTORS — document to sign\n\nWork order ${orderNumber}\n🚗 ${car}\n\nPlease sign:\n${signUrl}`,
  };
  return copies[loc];
}

export function buildSignRemindWhatsAppUrl(
  clientPhone: string,
  locale: WaMsgLocale,
  orderId: string,
  orderNumber: string,
  car: string,
  docLang?: "pl" | "ru" | "en"
): string | null {
  const signUrl = getSignUrl(orderId, docLang ?? (locale === "pl" ? "pl" : locale === "en" ? "en" : "ru"));
  return whatsappToClientUrl(
    clientPhone,
    buildSignRemindMessage(locale, { orderNumber, car, signUrl })
  );
}

/** Short CRM quick texts (copy / WhatsApp) with optional vehicle context */
export function buildAdminQuickMessage(
  templateId: string,
  locale: WaMsgLocale,
  ctx?: { car?: string; orderNumber?: string; signUrl?: string }
): string | null {
  const tpl = adminQuickTemplates.find((t) => t.id === templateId);
  if (!tpl) return null;

  const loc = resolveLocale(locale);
  let base =
    loc === "pl" ? tpl.pl : loc === "uk" ? tpl.ru : tpl.ru;

  if (templateId === "sign" && ctx?.signUrl) {
    const signHints: Record<"pl" | "ru" | "en" | "uk", string> = {
      pl: `\n\nLink do podpisu:\n${ctx.signUrl}`,
      ru: `\n\nСсылка для подписи:\n${ctx.signUrl}`,
      uk: `\n\nПосилання для підпису:\n${ctx.signUrl}`,
      en: `\n\nSign link:\n${ctx.signUrl}`,
    };
    base += signHints[loc];
  }

  if (ctx?.car || ctx?.orderNumber) {
    const header =
      loc === "pl"
        ? `BESS MOTORS${ctx.orderNumber ? ` · ${ctx.orderNumber}` : ""}${ctx.car ? `\n🚗 ${ctx.car}` : ""}\n\n`
        : loc === "en"
          ? `BESS MOTORS${ctx.orderNumber ? ` · ${ctx.orderNumber}` : ""}${ctx.car ? `\n🚗 ${ctx.car}` : ""}\n\n`
          : `BESS MOTORS${ctx.orderNumber ? ` · ${ctx.orderNumber}` : ""}${ctx.car ? `\n🚗 ${ctx.car}` : ""}\n\n`;
    return header + base;
  }

  return base;
}

export function buildAdminQuickWhatsAppUrl(
  clientPhone: string,
  templateId: string,
  locale: WaMsgLocale,
  ctx?: { car?: string; orderNumber?: string; orderId?: string; docLang?: "pl" | "ru" | "en" }
): string | null {
  const signUrl =
    templateId === "sign" && ctx?.orderId
      ? getSignUrl(ctx.orderId, ctx.docLang ?? (locale === "pl" ? "pl" : locale === "en" ? "en" : "ru"))
      : undefined;

  const text = buildAdminQuickMessage(templateId, locale, {
    car: ctx?.car,
    orderNumber: ctx?.orderNumber,
    signUrl,
  });
  if (!text) return null;
  return whatsappToClientUrl(clientPhone, text);
}

const TG_TO_WA_MASTER: Partial<Record<string, WaMasterTemplate>> = {
  ready: "ready",
  parts: "parts",
  delay: "delay",
};

export function adminQuickTemplateToWaMaster(templateId: string): WaMasterTemplate | null {
  return TG_TO_WA_MASTER[templateId] ?? null;
}

/** Extra CRM WhatsApp templates (not in admin quick list) */
export const CRM_EXTRA_WA_TEMPLATES: { id: WaMasterTemplate }[] = [
  { id: "diagnostic" },
  { id: "partsArrived" },
  { id: "pickup" },
  { id: "callme" },
  { id: "prepay" },
];
