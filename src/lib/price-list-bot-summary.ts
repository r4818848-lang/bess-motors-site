import type { BotLocale } from "@/lib/server/telegram-bot/client-i18n";
import { priceListItems } from "@/lib/price-list";

export function getPriceListSummaryForBot(locale: BotLocale): string {
  const title =
    locale === "ru"
      ? "💰 <b>Ориентиры цен</b> (от):"
      : locale === "pl"
        ? "💰 <b>Cennik</b> (od):"
        : "💰 <b>Prices</b> (from):";
  const sample = priceListItems.slice(0, 8);
  const lines = sample.map((p) => {
    const name = locale === "ru" ? p.nameRu : p.namePl;
    return `• ${name} — <b>${p.basePrice} zł</b>`;
  });
  const footer =
    locale === "ru"
      ? "\n\nПолный прайс: bessmotors.pl/cennik"
      : locale === "pl"
        ? "\n\nPełny cennik: bessmotors.pl/cennik"
        : "\n\nFull list: bessmotors.pl/cennik";
  return [title, "", ...lines, footer].join("\n");
}
