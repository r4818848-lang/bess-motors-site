import type { BotLocale } from "@/lib/server/telegram-bot/client-i18n";
import type { WorkOrder } from "@/lib/store";
import { siteConfig } from "@/lib/site";

const TIPS: Record<BotLocale, string[]> = {
  pl: [
    "💡 Przed wizytą zapisz przebieg i objawy — przyspieszy diagnostykę.",
    "💡 Regularny olej co 10–15 tys. km chroni silnik.",
    "💡 Sprawdź ciśnienie w oponach co miesiąc — mniejsze zużycie paliwa.",
  ],
  ru: [
    "💡 Перед визитом запишите пробег и симптомы — диагностика быстрее.",
    "💡 Масло каждые 10–15 тыс. км продлевает жизнь мотору.",
    "💡 Давление в шинах раз в месяц — экономия топлива.",
  ],
  uk: [
    "💡 Перед візитом запишіть пробіг і симптоми.",
    "💡 Олива кожні 10–15 тис. км захищає двигун.",
    "💡 Тиск у шинах раз на місяць.",
  ],
  en: [
    "💡 Note mileage and symptoms before your visit.",
    "💡 Oil every 10–15k km protects the engine.",
    "💡 Check tire pressure monthly.",
  ],
};

export function tipOfTheDay(locale: BotLocale): string {
  const list = TIPS[locale] ?? TIPS.ru;
  const day = new Date().getDate();
  return list[day % list.length]!;
}

export function workshopHoursText(locale: BotLocale): string {
  const h = siteConfig.workingHours;
  if (locale === "en") return `🕐 <b>Opening hours</b>\n${h}\n📍 ${siteConfig.address}`;
  if (locale === "pl") return `🕐 <b>Godziny pracy</b>\n${h}\n📍 ${siteConfig.address}`;
  return `🕐 <b>Часы работы</b>\n${h}\n📍 ${siteConfig.address}`;
}

export function emergencyChecklistText(locale: BotLocale): string {
  if (locale === "pl")
    return [
      "🆘 <b>Pomoc na drodze — checklist</b>",
      "1. Bezpieczne miejsce, trójkąt",
      "2. Zdjęcie uszkodzenia",
      "3. Numer VIN / tablica",
      `4. Zadzwoń: ${siteConfig.phone}`,
    ].join("\n");
  if (locale === "en")
    return [
      "🆘 <b>Roadside checklist</b>",
      "1. Safe spot, hazard lights",
      "2. Photo of damage",
      "3. VIN / plate",
      `4. Call: ${siteConfig.phone}`,
    ].join("\n");
  return [
    "🆘 <b>Чек-лист на дороге</b>",
    "1. Безопасное место, аварийка",
    "2. Фото повреждения",
    "3. VIN / номер",
    `4. Звонок: ${siteConfig.phone}`,
  ].join("\n");
}

export function botFaqText(locale: BotLocale): string {
  const lines: Record<BotLocale, string> = {
    pl: "❓ <b>FAQ</b>\n• /menu — menu\n• /status — status naprawy\n• /history — historia\n• /mute — wycisz 24h\n• /price — cennik\n• /hours — godziny",
    ru: "❓ <b>FAQ</b>\n• /menu — меню\n• /status — статус ремонта\n• /history — история\n• /mute — тишина 24ч\n• /price — цены\n• /hours — часы работы",
    uk: "❓ <b>FAQ</b>\n• /menu — меню\n• /status — статус\n• /history — історія\n• /mute — тиша 24г",
    en: "❓ <b>FAQ</b>\n• /menu — menu\n• /status — repair status\n• /history — history\n• /mute — mute 24h",
  };
  return lines[locale] ?? lines.ru;
}

export function contactCardText(locale: BotLocale): string {
  const p = siteConfig.phone;
  const a = siteConfig.address;
  if (locale === "pl") return `📇 <b>BESS MOTORS</b>\n📞 ${p}\n📍 ${a}\n🌐 bessmotors.pl`;
  if (locale === "en") return `📇 <b>BESS MOTORS</b>\n📞 ${p}\n📍 ${a}`;
  return `📇 <b>BESS MOTORS</b>\n📞 ${p}\n📍 ${a}`;
}

export function formatOrderEta(locale: BotLocale, order: WorkOrder | undefined): string {
  if (!order) {
    return locale === "ru" ? "Нет активного заказ-наряда." : "No active work order.";
  }
  const eta: Record<string, Record<BotLocale, string>> = {
    received: { pl: "1–2 dni diagnostyka", ru: "1–2 дня диагностика", uk: "1–2 дні", en: "1–2 days diagnostic" },
    diagnostic: { pl: "Dziś–jutro wynik", ru: "Сегодня–завтра результат", uk: "Сьогодні–завтра", en: "Result today–tomorrow" },
    repair: { pl: "2–4 dni robocze", ru: "2–4 рабочих дня", uk: "2–4 дні", en: "2–4 business days" },
    waitingParts: { pl: "Zależy od dostawy części", ru: "Зависит от поставки запчастей", uk: "Залежить від запчастин", en: "Depends on parts delivery" },
    ready: { pl: "Gotowe — odbiór dziś", ru: "Готово — можно забирать", uk: "Готово", en: "Ready for pickup" },
    delivered: { pl: "Wydane", ru: "Выдано", uk: "Видано", en: "Delivered" },
  };
  const line = eta[order.status]?.[locale] ?? eta[order.status]?.ru ?? "—";
  return `⏱ <b>${order.number}</b>\n${line}`;
}

export const SERVICE_FAVORITES = [
  { id: "oil_change", label: { pl: "Wymiana oleju", ru: "Замена масла", en: "Oil change" } },
  { id: "diagnostic", label: { pl: "Diagnostyka", ru: "Диагностика", en: "Diagnostics" } },
  { id: "brakes", label: { pl: "Hamulce", ru: "Тормоза", en: "Brakes" } },
];
