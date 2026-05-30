import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import { repairProgressPercent } from "@/lib/repair-progress";
import type { BotLocale } from "./client-i18n";
import { getClientBotLabels } from "./client-i18n";
import type { ClientRating, Database, User, WorkOrder } from "@/lib/store";
import { getClientPortalByChat } from "./client-telegram-link";
import {
  clientMainKeyboard,
  clientConfirmBookingKeyboard,
  clientServiceKeyboard,
  formatClientBookingSummary,
  clientAppointmentDetailKeyboard,
} from "./client-keyboards";
import { mutateCrm } from "./crm-actions";
import { clearTelegramSessionKeepLocale, setClientTelegramSession } from "./client-locale";
import { formatDateShort, getClientServiceLabel } from "./client-services";
import { cleanEnvValue } from "@/lib/server/supabase-config";

export function telegramBotDeepLink(startParam?: string): string {
  const username =
    cleanEnvValue(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME) || "BessMotors_bot";
  const base = `https://t.me/${username}`;
  return startParam ? `${base}?start=${encodeURIComponent(startParam)}` : base;
}

export function ensureReferralCode(user: User): string {
  if (user.referralCode) return user.referralCode;
  const code = `r${user.id.replace(/\W/g, "").slice(-6)}${Math.random().toString(36).slice(2, 5)}`;
  user.referralCode = code;
  return code;
}

export async function applyReferralFromStart(
  chatKey: string,
  refCode: string
): Promise<void> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return;
  const db = structuredClone(snap.doc) as Database;
  const client = db.users.find((u) => u.telegramChatId === chatKey && u.role === "client");
  if (!client) return;

  const { applyReferralToUser } = await import("@/lib/referral-system");
  const { notifyReferralFriendJoined } = await import("@/lib/client-notifications");
  const res = applyReferralToUser(db, client.id, refCode);
  if (!res.ok) return;
  if (res.referrerId) notifyReferralFriendJoined(db, res.referrerId);
  await cloudPutCrmStore(db);

  if (res.referrerId) {
    const referrer = db.users.find((u) => u.id === res.referrerId);
    if (referrer?.telegramChatId) {
      const { sendTelegramMessage } = await import("@/lib/server/telegram-api");
      const loc = (referrer.telegramLocale ?? "ru") as BotLocale;
      const L = getClientBotLabels(loc);
      await sendTelegramMessage(referrer.telegramChatId, L.referralNewJoin(client.name));
    }
  }
}

export function ratingKeyboard(locale: BotLocale, orderId: string) {
  const row = [1, 2, 3, 4, 5].map((n) => ({
    text: "⭐".repeat(n),
    callback_data: `cl:rate:${orderId}:${n}`,
  }));
  return { inline_keyboard: [row, [{ text: getClientBotLabels(locale).skip, callback_data: "cl:menu" }]] };
}

export async function saveTelegramRating(params: {
  chatKey: string;
  orderId: string;
  stars: number;
}): Promise<{ ok: boolean }> {
  const slice = await getClientPortalByChat(params.chatKey);
  if (!slice) return { ok: false };

  const result = await mutateCrm((db) => {
    const order = db.workOrders.find((o) => o.id === params.orderId && o.userId === slice.user.id);
    if (!order) return false;

    const rating: ClientRating = {
      id: `rating-tg-${Date.now()}`,
      userId: slice.user.id,
      workOrderId: order.id,
      stars: params.stars,
      clientName: slice.user.name,
      showOnSite: params.stars >= 4,
      source: "telegram",
      createdAt: new Date().toISOString(),
    };
    db.clientRatings = db.clientRatings ?? [];
    db.clientRatings.push(rating);
    order.clientRating = { stars: params.stars, createdAt: rating.createdAt };
  });

  return { ok: result.ok };
}

export function activeOrderForUser(orders: WorkOrder[]): WorkOrder | undefined {
  return (
    [...orders]
      .filter((o) => o.status !== "delivered")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? orders[0]
  );
}

export function queuePositionText(
  locale: BotLocale,
  orders: WorkOrder[],
  orderId: string
): string {
  const active = [...orders]
    .filter((o) => o.status !== "delivered")
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  const idx = active.findIndex((o) => o.id === orderId);
  if (idx < 0 || active.length < 2) return "";
  const L = getClientBotLabels(locale);
  return L.queueLine(idx + 1, active.length);
}

export async function formatRepairStatusLine(
  locale: BotLocale,
  chatKey: string
): Promise<string | null> {
  const slice = await getClientPortalByChat(chatKey);
  if (!slice) return null;

  const L = getClientBotLabels(locale);
  const active = activeOrderForUser(slice.workOrders);

  if (!active) {
    return L.noActiveWorkOrders;
  }

  const pct = repairProgressPercent(active.status);
  const status = L.repairStatus[active.status] ?? active.status;
  const queue = queuePositionText(locale, slice.workOrders, active.id);
  return [
    `📋 <b>${active.number}</b>`,
    `📌 ${status} · <b>${pct}%</b>`,
    queue,
    active.confirmationStatus !== "confirmed" ? L.needsSignature : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function formatServiceHistory(
  locale: BotLocale,
  chatKey: string
): Promise<string | null> {
  const slice = await getClientPortalByChat(chatKey);
  if (!slice) return null;

  const L = getClientBotLabels(locale);
  const orders = [...slice.workOrders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  if (!orders.length) {
    return L.noHistory;
  }

  const lines = [L.serviceHistoryTitle, ""];
  for (const o of orders) {
    const st = L.repairStatus[o.status] ?? o.status;
    const d = o.createdAt.slice(0, 10);
    lines.push(`• <b>${o.number}</b> — ${st} (${d})`);
  }
  return lines.join("\n");
}

export async function startRebookPlus7(
  chatId: number,
  chatKey: string,
  locale: BotLocale
): Promise<void> {
  const slice = await getClientPortalByChat(chatKey);
  const L = getClientBotLabels(locale);
  if (!slice) {
    await sendTelegramMessage(chatId, L.signIntro, clientMainKeyboard(locale, false));
    return;
  }

  const apt = [...slice.appointments].sort((a, b) =>
    `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)
  )[0];

  const baseDate = apt?.date ? new Date(`${apt.date}T12:00:00`) : new Date();
  baseDate.setDate(baseDate.getDate() + 7);
  const date = baseDate.toISOString().slice(0, 10);
  const time = apt?.time ?? "10:00";
  const serviceId = apt?.serviceIds[0] ?? "diagnostic";
  const serviceLabel = getClientServiceLabel(serviceId, locale);

  const draft = {
    intent: "book",
    serviceId,
    serviceLabel,
    date,
    time,
  };

  if (slice.user.name?.trim() && slice.user.phone?.trim()) {
    const data = {
      ...draft,
      name: slice.user.name.trim(),
      phone: slice.user.phone.trim(),
    };
    await setClientTelegramSession(chatKey, { data });
    await sendTelegramMessage(
      chatId,
      [L.rebookWeekTitle, "", formatClientBookingSummary(locale, data)].join("\n"),
      clientConfirmBookingKeyboard(locale)
    );
    return;
  }

  await setClientTelegramSession(chatKey, {
    step: "client_name",
    data: draft,
  });

  await sendTelegramMessage(
    chatId,
    [
      L.rebookWeekTitle,
      "",
      `📅 ${formatDateShort(date, locale)} · ${time}`,
      `🔧 ${serviceLabel}`,
      "",
      L.enterName,
    ].join("\n"),
    { inline_keyboard: [[{ text: L.cancel, callback_data: "cl:menu" }]] }
  );
}

export async function sendGalleryPhotosLink(
  chatId: number,
  locale: BotLocale
): Promise<void> {
  const L = getClientBotLabels(locale);
  const site = cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL) || "https://www.bess-motors.com";
  const text = `${L.galleryTitle}\n\n${site}/gallery`;
  await sendTelegramMessage(chatId, text, {
    inline_keyboard: [[{ text: "🌐 Gallery", url: `${site}/gallery` }]],
  });
}

export async function rebookLastAppointment(
  chatId: number,
  chatKey: string,
  locale: BotLocale,
  aptId?: string
): Promise<void> {
  const slice = await getClientPortalByChat(chatKey);
  const L = getClientBotLabels(locale);

  if (!slice) {
    await clearTelegramSessionKeepLocale(chatKey);
    await sendTelegramMessage(chatId, L.chooseService, clientServiceKeyboard(locale, "book"));
    return;
  }

  const apts = [...slice.appointments].sort((a, b) =>
    `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)
  );
  const apt = aptId ? apts.find((a) => a.id === aptId) : apts[0];
  if (!apt?.serviceIds.length) {
    await sendTelegramMessage(chatId, L.chooseService, clientMainKeyboard(locale, true));
    return;
  }

  const serviceId = apt.serviceIds[0];
  const label = getClientServiceLabel(serviceId, locale);
  await sendTelegramMessage(
    chatId,
    [
      L.rebookAgainTitle,
      "",
      `🔧 ${label}`,
      "",
      L.rebookDateHint,
    ].join("\n"),
    {
      inline_keyboard: [
        [{ text: L.book, callback_data: `cl:rebook:go:${serviceId}` }],
        [{ text: L.menu, callback_data: "cl:menu" }],
      ],
    }
  );
}

export async function toggleQuietHours(chatKey: string): Promise<boolean> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return true;
  const db = structuredClone(snap.doc) as Database;
  const user = db.users.find((u) => u.telegramChatId === chatKey && u.role === "client");
  if (!user) return true;
  const next = user.botQuietHours === false;
  user.botQuietHours = !next;
  await cloudPutCrmStore(db);
  return user.botQuietHours !== false;
}

export async function handleAptStartParam(
  chatId: number,
  locale: BotLocale,
  aptId: string
): Promise<void> {
  const slice = await getClientPortalByChat(String(chatId));
  const L = getClientBotLabels(locale);
  if (!slice) {
    await sendTelegramMessage(chatId, L.signIntro, {
      inline_keyboard: [
        [{ text: L.activate, callback_data: "cl:link" }],
        [{ text: L.book, callback_data: "cl:book" }],
      ],
    });
    return;
  }
  const apt = slice.appointments.find((a) => a.id === aptId);
  if (!apt) {
    await sendTelegramMessage(chatId, L.noAppointments, clientMainKeyboard(locale, true));
    return;
  }
  const services = apt.serviceIds.map((id) => getClientServiceLabel(id, locale)).join(", ");
  await sendTelegramMessage(
    chatId,
    [
      "📅 <b>" + apt.date + " · " + apt.time + "</b>",
      `🔧 ${services}`,
      `📌 ${L.appointmentStatus[apt.appointmentStatus] ?? apt.appointmentStatus}`,
    ].join("\n"),
    clientAppointmentDetailKeyboard(locale, aptId)
  );
}
