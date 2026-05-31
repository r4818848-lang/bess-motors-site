import type { BotLocale } from "./client-i18n";
import type { RepairStatus } from "@/lib/store";
import { REPAIR_STATUS_RU } from "./labels";

const REPAIR_STATUS: Record<BotLocale, Record<RepairStatus, string>> = {
  pl: {
    received: "Przyjęty",
    diagnostic: "Diagnostyka",
    repair: "Naprawa",
    waitingParts: "Oczekiwanie na części",
    ready: "Gotowy",
    delivered: "Wydany",
  },
  ru: REPAIR_STATUS_RU,
  uk: {
    received: "Прийнято",
    diagnostic: "Діагностика",
    repair: "Ремонт",
    waitingParts: "Очікування запчастин",
    ready: "Готове",
    delivered: "Видано",
  },
  en: {
    received: "Received",
    diagnostic: "Diagnostics",
    repair: "Repair",
    waitingParts: "Waiting for parts",
    ready: "Ready",
    delivered: "Delivered",
  },
};

export function repairStatusLabel(locale: BotLocale, status: RepairStatus): string {
  return REPAIR_STATUS[locale]?.[status] ?? REPAIR_STATUS.ru[status] ?? status;
}

type WoNotifyCopy = {
  signRequiredTitle: string;
  signRequiredBody: string;
  signRequiredHint: string;
  signDocTitle: string;
  signDocBody: string;
  signDocHint: string;
  signBtn: string;
  cabinetBtn: string;
  carReadyTitle: string;
  carReadyBody: string;
  carReadyHint: string;
  statusUpdatedTitle: string;
  rateTitle: string;
};

const COPY: Record<BotLocale, WoNotifyCopy> = {
  pl: {
    signRequiredTitle: "✍️ <b>Wymagany podpis</b>",
    signRequiredBody: "Zlecenie <b>{number}</b>\n🚗 {car}\n💰 {total} zł",
    signRequiredHint: "Kliknij przycisk, aby podpisać dokument.",
    signDocTitle: "✍️ <b>Dokument do podpisu</b>",
    signDocBody: "📋 {number} · {car}",
    signDocHint: "Podpisz zlecenie jednym kliknięciem:",
    signBtn: "✍️ Podpisz zlecenie",
    cabinetBtn: "📋 Panel klienta",
    carReadyTitle: "✅ <b>Auto gotowe!</b>",
    carReadyBody: "🚗 {car}\n📋 {number}",
    carReadyHint: "Możesz odebrać auto w godzinach pracy.",
    statusUpdatedTitle: "🔧 <b>Status zlecenia zaktualizowany</b>",
    rateTitle: "⭐ <b>Oceń naszą obsługę</b>",
  },
  ru: {
    signRequiredTitle: "✍️ <b>Требуется подпись</b>",
    signRequiredBody: "Заказ-наряд <b>{number}</b>\n🚗 {car}\n💰 {total} zł",
    signRequiredHint: "Нажмите кнопку ниже, чтобы подписать документ.",
    signDocTitle: "✍️ <b>Документ на подпись</b>",
    signDocBody: "📋 {number} · {car}",
    signDocHint: "Подпишите заказ-наряд в один клик:",
    signBtn: "✍️ Подписать заказ-наряд",
    cabinetBtn: "📋 Личный кабинет",
    carReadyTitle: "✅ <b>Автомобиль готов!</b>",
    carReadyBody: "🚗 {car}\n📋 {number}",
    carReadyHint: "Можете забрать авто в рабочие часы.",
    statusUpdatedTitle: "🔧 <b>Статус заказ-наряда обновлён</b>",
    rateTitle: "⭐ <b>Оцените наш сервис</b>",
  },
  uk: {
    signRequiredTitle: "✍️ <b>Потрібен підпис</b>",
    signRequiredBody: "Замовлення <b>{number}</b>\n🚗 {car}\n💰 {total} zł",
    signRequiredHint: "Натисніть кнопку, щоб підписати документ.",
    signDocTitle: "✍️ <b>Документ на підпис</b>",
    signDocBody: "📋 {number} · {car}",
    signDocHint: "Підпишіть замовлення одним кліком:",
    signBtn: "✍️ Підписати замовлення",
    cabinetBtn: "📋 Особистий кабінет",
    carReadyTitle: "✅ <b>Авто готове!</b>",
    carReadyBody: "🚗 {car}\n📋 {number}",
    carReadyHint: "Можете забрати авто в робочий час.",
    statusUpdatedTitle: "🔧 <b>Статус замовлення оновлено</b>",
    rateTitle: "⭐ <b>Оцініть наш сервіс</b>",
  },
  en: {
    signRequiredTitle: "✍️ <b>Signature required</b>",
    signRequiredBody: "Work order <b>{number}</b>\n🚗 {car}\n💰 {total} zł",
    signRequiredHint: "Tap the button below to sign the document.",
    signDocTitle: "✍️ <b>Document to sign</b>",
    signDocBody: "📋 {number} · {car}",
    signDocHint: "Sign your work order in one tap:",
    signBtn: "✍️ Sign work order",
    cabinetBtn: "📋 Client portal",
    carReadyTitle: "✅ <b>Your car is ready!</b>",
    carReadyBody: "🚗 {car}\n📋 {number}",
    carReadyHint: "Pick up during opening hours.",
    statusUpdatedTitle: "🔧 <b>Work order status updated</b>",
    rateTitle: "⭐ <b>Rate our service</b>",
  },
};

export function woNotifyCopy(locale: BotLocale): WoNotifyCopy {
  return COPY[locale] ?? COPY.ru;
}

export function signKeyboardLocalized(orderId: string, siteUrl: string, locale: BotLocale) {
  const c = woNotifyCopy(locale);
  return {
    inline_keyboard: [
      [{ text: c.signBtn, url: `${siteUrl}/sign/${orderId}` }],
      [{ text: c.cabinetBtn, url: `${siteUrl}/cabinet` }],
    ],
  };
}
