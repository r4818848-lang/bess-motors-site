import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import { editTelegramMessage, sendTelegramMessage } from "@/lib/server/telegram-api";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import {
  botFaqText,
  contactCardText,
  emergencyChecklistText,
  formatOrderEta,
  SERVICE_FAVORITES,
  tipOfTheDay,
  workshopHoursText,
} from "@/lib/bot-extras-content";
import type { BotLocale } from "./client-i18n";
import { getClientBotLabels, botContentLocale } from "./client-i18n";
import { getClientPortalByChat } from "./client-telegram-link";
import { advanceBookingFlow } from "./client-booking-flow";
import { getClientServiceLabel, normalizeTelegramServiceId } from "./client-services";
import { clientBackMenuRow, clientServiceKeyboard } from "./client-keyboards";
import type { Database, User } from "@/lib/store";
import { getPriceListSummaryForBot } from "@/lib/price-list-bot-summary";

export async function sendExtrasMenu(
  chatId: number,
  locale: BotLocale,
  chatKey?: string,
  messageId?: number
): Promise<void> {
  const L = getClientBotLabels(locale);
  const slice = chatKey ? await getClientPortalByChat(chatKey) : null;
  const text = [workshopHoursText(locale), "", botFaqText(locale)].join("\n");

  const rows: InlineKeyboardMarkup["inline_keyboard"] = [
    [{ text: L.priceListBtn, callback_data: "cl:v4:price" }],
    [
      { text: L.packagesBtn, callback_data: "cl:pkg:menu" },
      { text: L.promoBtn, callback_data: "cl:promo" },
    ],
    [
      { text: L.locationBtn, callback_data: "cl:location" },
      { text: L.galleryPhotos, callback_data: "cl:photos" },
    ],
    [
      { text: L.emergencyBtn, callback_data: "cl:v4:emergency" },
      { text: L.contactCardBtn, callback_data: "cl:v4:vcard" },
    ],
  ];

  if (slice) {
    rows.push([
      { text: L.rebook, callback_data: "cl:rebook" },
      { text: L.favoritesBtn, callback_data: "cl:v4:fav" },
    ]);
    rows.push([
      { text: L.etaBtn, callback_data: "cl:v4:eta" },
      { text: L.rebookWeek, callback_data: "cl:rebook7" },
    ]);
    rows.push([
      { text: L.concierge, callback_data: "cl:concierge" },
      { text: L.quietHours, callback_data: "cl:quiet" },
    ]);
  }

  rows.push(clientBackMenuRow(locale));

  const keyboard = { inline_keyboard: rows };
  if (messageId) {
    const ok = await editTelegramMessage(chatId, messageId, text, keyboard);
    if (!ok) await sendTelegramMessage(chatId, text, keyboard);
  } else {
    await sendTelegramMessage(chatId, text, keyboard);
  }
}

export async function handleExtrasV4Callback(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  data: string,
  messageId?: number
): Promise<boolean> {
  if (!data.startsWith("cl:v4:")) return false;
  const action = data.slice(6);

  if (action === "menu") {
    await sendExtrasMenu(chatId, locale, chatKey, messageId);
    return true;
  }

  if (action === "tip") {
    await sendTelegramMessage(chatId, tipOfTheDay(locale));
    return true;
  }
  if (action === "hours") {
    await sendTelegramMessage(chatId, workshopHoursText(locale));
    return true;
  }
  if (action === "faq") {
    await sendTelegramMessage(chatId, botFaqText(locale));
    return true;
  }
  if (action === "emergency") {
    await sendTelegramMessage(chatId, emergencyChecklistText(locale));
    return true;
  }
  if (action === "vcard") {
    await sendTelegramMessage(chatId, contactCardText(locale));
    return true;
  }
  if (action === "price") {
    await sendTelegramMessage(chatId, getPriceListSummaryForBot(locale), {
      inline_keyboard: [clientBackMenuRow(locale)],
    });
    return true;
  }
  if (action === "eta") {
    const slice = await getClientPortalByChat(chatKey);
    const active = slice?.workOrders
      .filter((o) => o.status !== "delivered")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    await sendTelegramMessage(chatId, formatOrderEta(locale, active));
    return true;
  }
  if (action === "fav") {
    await sendTelegramMessage(chatId, formatFavoritesPick(locale), favoritesKeyboard(locale));
    return true;
  }
  if (action.startsWith("favgo:")) {
    const serviceId = normalizeTelegramServiceId(action.slice(6));
    await setFavoriteService(chatKey, serviceId);
    const slice = await getClientPortalByChat(chatKey);
    const draft: Record<string, string> = {
      intent: "book",
      serviceId,
      serviceLabel: getClientServiceLabel(serviceId, locale),
    };
    if (slice?.user.name?.trim()) draft.name = slice.user.name.trim();
    if (slice?.user.phone?.trim()) draft.phone = slice.user.phone.trim();
    await advanceBookingFlow(chatId, messageId, chatKey, locale, draft, slice);
    return true;
  }
  if (action.startsWith("fb:")) {
    const score = Number(action.slice(3));
    await saveQuickFeedback(chatKey, score);
    const L = getClientBotLabels(locale);
    await sendTelegramMessage(chatId, L.feedbackThanks);
    return true;
  }

  return false;
}

function formatFavoritesPick(locale: BotLocale): string {
  return getClientBotLabels(locale).favoritesPick;
}

function favoritesKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const loc = botContentLocale(locale);
  return {
    inline_keyboard: SERVICE_FAVORITES.map((s) => [
      {
        text: s.label[loc as "pl" | "ru" | "en"] ?? s.label.ru,
        callback_data: `cl:v4:favgo:${s.id}`,
      },
    ]),
  };
}

async function setFavoriteService(chatKey: string, serviceId: string): Promise<void> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return;
  const db = structuredClone(snap.doc) as Database;
  const user = db.users.find((u) => u.telegramChatId === chatKey && u.role === "client");
  if (!user) return;
  user.favoriteServiceId = serviceId;
  await cloudPutCrmStore(db);
}

async function saveQuickFeedback(chatKey: string, score: number): Promise<void> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return;
  const db = structuredClone(snap.doc) as Database;
  const user = db.users.find((u) => u.telegramChatId === chatKey && u.role === "client");
  if (!user) return;
  db.clientRatings.push({
    id: `fb-${Date.now()}`,
    userId: user.id,
    stars: Math.min(5, Math.max(1, score)),
    comment: "telegram_quick",
    showOnSite: false,
    source: "telegram",
    createdAt: new Date().toISOString(),
  });
  await cloudPutCrmStore(db);
}

export async function handleClientTextCommands(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  text: string
): Promise<boolean> {
  const cmd = text.trim().toLowerCase().split(/\s+/)[0];
  if (cmd === "/faq" || cmd === "/help") {
    await sendExtrasMenu(chatId, locale, chatKey);
    return true;
  }
  if (cmd === "/hours") {
    await sendTelegramMessage(chatId, workshopHoursText(locale));
    return true;
  }
  if (cmd === "/price" || cmd === "/cennik") {
    await sendTelegramMessage(chatId, getPriceListSummaryForBot(locale));
    return true;
  }
  if (cmd === "/more" || cmd === "/extras") {
    await sendExtrasMenu(chatId, locale, chatKey);
    return true;
  }
  if (cmd === "/repeat") {
    const { getClientPortalByChat } = await import("./client-telegram-link");
    const slice = await getClientPortalByChat(chatKey);
    if (!slice?.workOrders.length) {
      await sendTelegramMessage(chatId, getClientBotLabels(locale).signIntro);
      return true;
    }
    const last = [...slice.workOrders].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    )[0];
    const { startRepeatOrder } = await import("./client-features-v3");
    await startRepeatOrder(chatId, chatKey, locale, last);
    return true;
  }
  if (cmd === "/status" || cmd === "/cars" || cmd === "/queue") {
    const { formatRepairStatusLine } = await import("./client-extras");
    const line = await formatRepairStatusLine(locale, chatKey);
    await sendTelegramMessage(chatId, line ?? getClientBotLabels(locale).signIntro);
    return true;
  }
  if (
    cmd === "/finance" ||
    cmd === "/platnosci" ||
    cmd === "/rozliczenia" ||
    cmd === "/billing" ||
    cmd === "/оплата"
  ) {
    const slice = await getClientPortalByChat(chatKey);
    const L = getClientBotLabels(locale);
    if (!slice) {
      await sendTelegramMessage(chatId, L.signIntro);
      return true;
    }
    const { isFleetPortalClient } = await import("@/lib/client-fleet-access");
    if (!isFleetPortalClient(slice)) {
      await sendTelegramMessage(chatId, L.fleetNotAvailable);
      return true;
    }
    const { formatFleetFinanceReport } = await import("./client-cabinet-format");
    const { clientFleetFinanceKeyboard } = await import("./client-fleet-keyboards");
    await sendTelegramMessage(
      chatId,
      formatFleetFinanceReport(locale, slice),
      clientFleetFinanceKeyboard(locale, slice)
    );
    return true;
  }
  if (cmd === "/book") {
    const { clearTelegramSessionKeepLocale } = await import("./client-locale");
    await clearTelegramSessionKeepLocale(chatKey);
    const L = getClientBotLabels(locale);
    await sendTelegramMessage(chatId, L.chooseService, clientServiceKeyboard(locale, "book"));
    return true;
  }
  if (cmd === "/sign") {
    const slice = await (await import("./client-telegram-link")).getClientPortalByChat(chatKey);
    const order = slice?.workOrders.find((o) => o.status !== "delivered");
    if (order) {
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bess-motors.com";
      await sendTelegramMessage(chatId, `${base}/sign/${order.id}`);
      return true;
    }
    await sendTelegramMessage(chatId, "—");
    return true;
  }
  if (cmd === "/loyalty") {
    const slice = await (await import("./client-telegram-link")).getClientPortalByChat(chatKey);
    if (slice) {
      const { formatLoyaltyProgress } = await import("@/lib/loyalty");
      await sendTelegramMessage(chatId, formatLoyaltyProgress(slice.user, locale));
      return true;
    }
    await sendTelegramMessage(chatId, getClientBotLabels(locale).signIntro);
    return true;
  }
  if (cmd === "/myrefs") {
    const { getClientPortalByChat } = await import("./client-telegram-link");
    const { loadCrmFromCloud } = await import("./crm-actions");
    const { formatMyRefsCommand } = await import("./client-referral-cmd");
    const slice = await getClientPortalByChat(chatKey);
    if (!slice) {
      await sendTelegramMessage(chatId, getClientBotLabels(locale).signIntro);
      return true;
    }
    const cloudDb = await loadCrmFromCloud();
    const body = cloudDb
      ? formatMyRefsCommand(cloudDb, slice.user, locale)
      : formatMyRefsCommand(
          { users: [slice.user], workOrders: slice.workOrders } as import("@/lib/store").Database,
          slice.user,
          locale
        );
    await sendTelegramMessage(chatId, body);
    return true;
  }
  return false;
}
