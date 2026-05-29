import type { BotLocale } from "@/lib/server/telegram-bot/client-i18n";
import { getClientBotLabels, botContentLocale } from "@/lib/server/telegram-bot/client-i18n";
import { priceListItems } from "@/lib/price-list";

export function getPriceListSummaryForBot(locale: BotLocale): string {
  const L = getClientBotLabels(locale);
  const loc = botContentLocale(locale);
  const sample = priceListItems.slice(0, 8);
  const lines = sample.map((p) => {
    const name = loc === "ru" ? p.nameRu : p.namePl;
    return `• ${name} — <b>${p.basePrice} zł</b>`;
  });
  return [L.priceListTitle, "", ...lines, L.priceListFooter].join("\n");
}
