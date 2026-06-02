import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import type { ClientPortalSlice } from "@/lib/client-sign";
import { buildFleetFinance } from "@/lib/client-fleet-finance";
import { type BotLocale, getClientBotLabels } from "./client-i18n";
import { clientBackMenuRow } from "./client-keyboards";

export function clientFleetFinanceKeyboard(
  locale: BotLocale,
  slice: ClientPortalSlice
): InlineKeyboardMarkup {
  const finance = buildFleetFinance(slice);
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];

  const sorted = [...finance.vehicles].sort((a, b) => {
    if (b.unpaidTotal !== a.unpaidTotal) return b.unpaidTotal - a.unpaidTotal;
    if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
    return a.plate.localeCompare(b.plate, "pl");
  });

  for (const row of sorted) {
    const suffix =
      row.unpaidTotal > 0
        ? ` · ${row.unpaidTotal.toFixed(0)} zł`
        : row.orderCount > 0
          ? " ✓"
          : "";
    rows.push([
      {
        text: `${row.plate}${suffix}`,
        callback_data: `cl:fin:${row.vehicleId}`,
      },
    ]);
    if (rows.length >= 12) break;
  }

  const L = getClientBotLabels(locale);
  rows.push([{ text: L.myOrders, callback_data: "cl:orders:0" }]);
  rows.push(clientBackMenuRow(locale));

  return { inline_keyboard: rows };
}

export function clientFleetCarKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: L.fleetFinance, callback_data: "cl:finance" }],
      clientBackMenuRow(locale),
    ],
  };
}
