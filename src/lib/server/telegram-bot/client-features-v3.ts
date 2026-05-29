import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import { siteConfig } from "@/lib/site";
import { getPromoRules } from "@/lib/promo-codes";
import { servicePackages } from "@/lib/service-packages";
import type { BotLocale } from "./client-i18n";
import { getClientBotLabels, botContentLocale } from "./client-i18n";
import { getClientServiceLabel, normalizeTelegramServiceId } from "./client-services";
import { resolveActiveVehicleId } from "./client-vehicle-pick";
import { getClientPortalByChat } from "./client-telegram-link";
import { clientBackMenuRow } from "./client-keyboards";
import { advanceBookingFlow } from "./client-booking-flow";
import type { WorkOrder } from "@/lib/store";

export function packagesKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const loc = botContentLocale(locale);
  return {
    inline_keyboard: [
      ...servicePackages.map((p) => [
        {
          text: loc === "ru" ? p.nameRu : p.namePl,
          callback_data: `cl:pkg:${p.id}`,
        },
      ]),
      clientBackMenuRow(locale),
    ],
  };
}

export async function sendPromoList(chatId: number, locale: BotLocale): Promise<void> {
  const rules = getPromoRules();
  const L = getClientBotLabels(locale);
  if (!rules.length) {
    await sendTelegramMessage(chatId, L.promoEmpty, { inline_keyboard: [clientBackMenuRow(locale)] });
    return;
  }
  const lines = [L.promoTitle, "", ...rules.map((r) => `• <code>${r.code}</code> — −${r.percentOff}%`)];
  await sendTelegramMessage(chatId, lines.join("\n"), { inline_keyboard: [clientBackMenuRow(locale)] });
}

export async function sendLocation(chatId: number, locale: BotLocale): Promise<void> {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.address)}`;
  const text = [
    "📍 <b>BESS MOTORS</b>",
    "",
    siteConfig.address,
    `📱 ${siteConfig.phone}`,
    "",
    `<a href="${maps}">Google Maps</a>`,
  ].join("\n");
  await sendTelegramMessage(chatId, text, {
    inline_keyboard: [[{ text: "🗺 Maps", url: maps }], clientBackMenuRow(locale)],
  });
}

export async function startPackageBooking(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  packageId: string
): Promise<void> {
  const pkg = servicePackages.find((p) => p.id === packageId);
  if (!pkg) return;
  const loc = botContentLocale(locale);
  const label = loc === "ru" ? pkg.nameRu : pkg.namePl;
  const slice = await getClientPortalByChat(chatKey);
  const draft: Record<string, string> = {
    intent: "book",
    serviceId: normalizeTelegramServiceId(pkg.serviceIds[0] ?? "diagnostic"),
    serviceLabel: label,
    comment: `${label} (${pkg.serviceIds.join(", ")})`,
  };
  if (slice?.user.name?.trim()) draft.name = slice.user.name.trim();
  if (slice?.user.phone?.trim()) draft.phone = slice.user.phone.trim();
  await advanceBookingFlow(chatId, undefined, chatKey, locale, draft, slice);
}

export async function startRepeatOrder(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  order: WorkOrder
): Promise<void> {
  const L = getClientBotLabels(locale);
  const services = order.services.map((s) => s.name).join("; ");
  const primary = order.services[0]?.name ?? "diagnostic";
  const slice = await getClientPortalByChat(chatKey);
  const draft: Record<string, string> = {
    intent: "book",
    serviceId: "otherReason",
    serviceLabel: primary,
    comment: L.repeatComment(services),
  };
  if (slice?.user.name?.trim()) draft.name = slice.user.name.trim();
  if (slice?.user.phone?.trim()) draft.phone = slice.user.phone.trim();
  await advanceBookingFlow(chatId, undefined, chatKey, locale, draft, slice);
}

export async function formatWarrantyList(locale: BotLocale, chatKey: string): Promise<string | null> {
  const slice = await getClientPortalByChat(chatKey);
  if (!slice) return null;
  const L = getClientBotLabels(locale);
  const now = new Date().toISOString().slice(0, 10);
  const rows = slice.workOrders.filter((o) => o.warrantyUntil && o.warrantyUntil >= now);
  if (!rows.length) {
    return L.noWarranty;
  }
  return [
    L.warrantyTitle,
    "",
    ...rows.map((o) => `• <b>${o.number}</b> — do ${o.warrantyUntil?.slice(0, 10)}`),
  ].join("\n");
}

export function aptRescheduleKeyboard(locale: BotLocale, aptId: string): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [
        { text: L.plusOneDay, callback_data: `cl:apt:+1:${aptId}` },
        { text: L.plusSevenDays, callback_data: `cl:apt:+7:${aptId}` },
      ],
      clientBackMenuRow(locale),
    ],
  };
}

export async function activeVehicleLabel(locale: BotLocale, chatKey: string): Promise<string> {
  const slice = await getClientPortalByChat(chatKey);
  if (!slice) return "";
  const vid = resolveActiveVehicleId(slice);
  const v = slice.vehicles.find((x) => x.id === vid);
  if (!v) return "";
  return `🚗 ${v.plate} · ${v.make} ${v.model}`;
}
