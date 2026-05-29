import { getPriceItem } from "@/lib/price-list";
import { serviceBasePriceId } from "@/lib/service-price-map";
import type { ServiceId } from "@/lib/services-catalog";
import type { BotLocale } from "./client-i18n";

const FALLBACK_RU: Record<string, string> = {
  oil: "Замена масла",
  acRefill: "Заправка кондиционера",
  brakePads: "Замена тормозных колодок",
  diagnostic: "Компьютерная диагностика",
  suspension: "Ремонт подвески",
  filters: "Замена фильтров",
  tires: "Шиномонтаж",
  electric: "Электрика / диагностика",
  brakesFull: "Тормозная система",
  acRepair: "Ремонт кондиционера",
  timingBelt: "Замена ГРМ",
  otherReason: "Другая услуга",
};

export function getClientServiceLabel(
  serviceId: string,
  locale: BotLocale = "ru"
): string {
  const baseId = serviceBasePriceId[serviceId as ServiceId];
  if (baseId) {
    const item = getPriceItem(baseId);
    if (item) {
      if (locale === "pl") return item.namePl;
      return item.nameRu;
    }
  }
  return FALLBACK_RU[serviceId] ?? serviceId;
}

/** Top services for Telegram bot (short menu) */
export const telegramBookableServiceIds = [
  "oil",
  "diagnostic",
  "brakePads",
  "suspension",
  "acRefill",
  "otherReason",
] as const satisfies readonly ServiceId[];

export function clientBookableServices(locale: BotLocale) {
  return telegramBookableServiceIds.map((id) => ({
    id,
    label: getClientServiceLabel(id, locale),
  }));
}

const TELEGRAM_SERVICE_ALIASES: Partial<Record<ServiceId, ServiceId>> = {
  electric: "diagnostic",
  filters: "otherReason",
  tires: "otherReason",
  brakesFull: "brakePads",
  acRepair: "acRefill",
  timingBelt: "otherReason",
};

/** Map wizard/smart-text service ids to a Telegram-bookable id */
export function normalizeTelegramServiceId(serviceId: string): string {
  if ((telegramBookableServiceIds as readonly string[]).includes(serviceId)) {
    return serviceId;
  }
  return TELEGRAM_SERVICE_ALIASES[serviceId as ServiceId] ?? "otherReason";
}

export function encodeTimeSlot(time: string): string {
  return time.replace(":", "");
}

export function decodeTimeSlot(encoded: string): string {
  if (encoded.includes(":")) return encoded;
  if (encoded.length === 4) return `${encoded.slice(0, 2)}:${encoded.slice(2)}`;
  return encoded;
}

/** Next bookable dates (Mon–Sat), starting today */
export function nextBookableDates(count = 12): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  while (dates.length < count) {
    if (cursor.getDay() !== 0) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

const WEEKDAYS: Record<BotLocale, string[]> = {
  pl: ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  uk: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

export function formatDateShort(dateKey: string, locale: BotLocale = "ru"): string {
  const d = new Date(`${dateKey}T12:00:00`);
  const weekdays = WEEKDAYS[locale];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm} ${weekdays[d.getDay()]}`;
}
