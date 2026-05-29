import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
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
import { getClientBotLabels } from "./client-i18n";
import { getClientPortalByChat } from "./client-telegram-link";
import { setClientTelegramSession } from "./client-locale";
import { getClientServiceLabel } from "./client-services";
import { clientBackMenuRow, clientDateKeyboard, clientServiceKeyboard } from "./client-keyboards";
import type { Database, User } from "@/lib/store";
import { getPriceListSummaryForBot } from "@/lib/price-list-bot-summary";

export async function sendExtrasMenu(chatId: number, locale: BotLocale): Promise<void> {
  const text = [workshopHoursText(locale), "", botFaqText(locale)].join("\n");
  await sendTelegramMessage(chatId, text, {
    inline_keyboard: [clientBackMenuRow(locale)],
  });
}

export async function handleExtrasV4Callback(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  data: string
): Promise<boolean> {
  if (!data.startsWith("cl:v4:")) return false;
  const action = data.slice(6);

  if (action === "menu") {
    await sendExtrasMenu(chatId, locale);
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
    await sendTelegramMessage(chatId, getPriceListSummaryForBot(locale));
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
    const serviceId = action.slice(6);
    await setFavoriteService(chatKey, serviceId);
    await setClientTelegramSession(chatKey, {
      data: {
        intent: "book",
        serviceId,
        serviceLabel: getClientServiceLabel(serviceId, locale),
      },
    });
    await sendTelegramMessage(
      chatId,
      getClientBotLabels(locale).chooseDate,
      clientDateKeyboard(locale)
    );
    return true;
  }
  if (action.startsWith("fb:")) {
    const score = Number(action.slice(3));
    await saveQuickFeedback(chatKey, score);
    const thanks =
      locale === "ru"
        ? "Спасибо за оценку! 🙏"
        : locale === "pl"
          ? "Dziękujemy za opinię!"
          : "Thanks for your feedback!";
    await sendTelegramMessage(chatId, thanks);
    return true;
  }

  return false;
}

function formatFavoritesPick(locale: BotLocale): string {
  if (locale === "ru") return "⭐ Выберите избранную услугу для быстрой записи:";
  if (locale === "pl") return "⭐ Wybierz ulubioną usługę:";
  return "⭐ Pick a favorite service:";
}

function favoritesKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const loc = locale === "uk" ? "ru" : locale === "en" ? "en" : locale === "pl" ? "pl" : "ru";
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
    await sendTelegramMessage(chatId, botFaqText(locale));
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
    await sendExtrasMenu(chatId, locale);
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
  if (cmd === "/book") {
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
