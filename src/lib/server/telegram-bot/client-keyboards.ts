import type { InlineKeyboardMarkup, ReplyKeyboardMarkup } from "@/lib/server/telegram-api";
import { timeSlots } from "@/lib/data";
import { siteConfig } from "@/lib/site";
import {
  BOT_LOCALES,
  type BotLocale,
  getClientBotLabels,
  LANGUAGE_NAMES,
  type ClientBotLabels,
} from "./client-i18n";
import {
  clientBookableServices,
  decodeTimeSlot,
  encodeTimeSlot,
  formatDateShort,
  getClientServiceLabel,
  nextBookableDates,
} from "./client-services";
import type { ClientPortalSlice } from "@/lib/client-sign";

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.bess-motors.com";
}

function mapsUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.address)}`;
}

export function clientLanguageKeyboard(): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  for (let i = 0; i < BOT_LOCALES.length; i += 2) {
    rows.push(
      BOT_LOCALES.slice(i, i + 2).map((loc) => ({
        text: LANGUAGE_NAMES[loc],
        callback_data: `cl:lang:${loc}`,
      }))
    );
  }
  return { inline_keyboard: rows };
}

export function clientStartReplyKeyboard(L: ClientBotLabels): ReplyKeyboardMarkup {
  return {
    keyboard: [[{ text: L.startBtn }]],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/** Guest menu — 4 rows */
export function clientMainKeyboard(locale: BotLocale, linked = false): InlineKeyboardMarkup {
  void linked;
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: L.activate, callback_data: "cl:link" }],
      [
        { text: L.book, callback_data: "cl:book" },
        { text: L.call, callback_data: "cl:call" },
      ],
      [
        { text: L.myStatus, callback_data: "cl:status" },
        { text: L.contacts, callback_data: "cl:contacts" },
      ],
      [
        { text: L.symptomQuiz, callback_data: "cl:sym:start" },
        { text: "❓ FAQ", callback_data: "cl:more" },
      ],
      [
        { text: L.site, url: `${siteBase()}/cabinet` },
        { text: L.changeLanguage, callback_data: "cl:lang:pick" },
      ],
    ],
  };
}

/** Linked client — 6 compact rows */
export function clientLinkedMenuKeyboard(
  locale: BotLocale,
  _slice: ClientPortalSlice,
  pendingSign: number,
  unread: number
): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  const ordersLabel =
    pendingSign > 0 ? `${L.myOrders} (✍️${pendingSign})` : L.myOrders;
  const notifLabel = unread > 0 ? `${L.notifications} (${unread})` : L.notifications;

  return {
    inline_keyboard: [
      [
        { text: ordersLabel, callback_data: "cl:orders:0" },
        { text: L.myStatus, callback_data: "cl:status" },
      ],
      [
        { text: L.book, callback_data: "cl:book" },
        { text: L.call, callback_data: "cl:call" },
      ],
      [
        { text: L.myAppointments, callback_data: "cl:apts" },
        { text: notifLabel, callback_data: "cl:notif" },
      ],
      [
        { text: L.myCars, callback_data: "cl:cars" },
        { text: L.referralShare, callback_data: "cl:referral" },
      ],
      [
        { text: L.contacts, callback_data: "cl:contacts" },
        { text: L.cabinetSite, url: `${siteBase()}/cabinet` },
      ],
      [
        { text: L.serviceHistory, callback_data: "cl:history" },
        { text: L.warrantyBtn, callback_data: "cl:warranty" },
      ],
      [
        { text: L.notifySettings, callback_data: "cl:notify" },
        { text: L.sendPhoto, callback_data: "cl:photo" },
      ],
      [
        { text: "❓ FAQ", callback_data: "cl:more" },
        { text: L.changeLanguage, callback_data: "cl:lang:pick" },
      ],
    ],
  };
}

export function clientMenuForUser(
  locale: BotLocale,
  slice: ClientPortalSlice | null | undefined,
  pendingSign = 0,
  unread = 0
): InlineKeyboardMarkup {
  if (slice) {
    return clientLinkedMenuKeyboard(locale, slice, pendingSign, unread);
  }
  return clientMainKeyboard(locale);
}

export function vinConfirmKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: L.vinConfirmYes, callback_data: "cl:vin:add" }],
      [
        { text: L.vinEditPlate, callback_data: "cl:vin:edit:plate" },
        { text: L.vinEditVin, callback_data: "cl:vin:edit:vin" },
      ],
      [{ text: L.vinConfirmNo, callback_data: "cl:menu" }],
    ],
  };
}

export function vinAskPlateKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: L.skip, callback_data: "cl:vin:plate:skip" }],
      [{ text: L.cancel, callback_data: "cl:menu" }],
    ],
  };
}

export function clientBackMenuRow(locale: BotLocale): InlineKeyboardMarkup["inline_keyboard"][number] {
  const L = getClientBotLabels(locale);
  return [{ text: L.menu, callback_data: "cl:menu" }];
}

export function clientAppointmentsKeyboard(
  locale: BotLocale,
  slice: ClientPortalSlice
): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  const today = new Date().toISOString().slice(0, 10);
  const apts = slice.appointments
    .filter((a) => a.date >= today)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 4);
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  for (const a of apts) {
    rows.push([
      {
        text: `${a.date} ${a.time}`,
        callback_data: `cl:apt:view:${a.id}`,
      },
    ]);
    rows.push([
      {
        text: L.shareBtn,
        callback_data: `cl:share:apt:${a.id}`,
      },
      {
        text: L.plusOneDay,
        callback_data: `cl:apt:+1:${a.id}`,
      },
      { text: L.plusSevenDays, callback_data: `cl:apt:+7:${a.id}` },
    ]);
  }
  rows.push(clientBackMenuRow(locale));
  return { inline_keyboard: rows };
}

export function clientAppointmentDetailKeyboard(
  locale: BotLocale,
  aptId: string
): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [
        {
          text: L.shareBtn,
          callback_data: `cl:share:apt:${aptId}`,
        },
        {
          text: L.plusOneDay,
          callback_data: `cl:apt:+1:${aptId}`,
        },
        { text: L.plusSevenDays, callback_data: `cl:apt:+7:${aptId}` },
      ],
      [{ text: L.back, callback_data: "cl:apts" }],
      clientBackMenuRow(locale),
    ],
  };
}

export function phoneRequestReplyKeyboard(locale: BotLocale): ReplyKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    keyboard: [[{ text: L.linkPhoneBtn, request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

export function linkPlateStepKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: L.linkEditPhone, callback_data: "cl:lk:edit:phone" }],
      [{ text: L.cancel, callback_data: "cl:menu" }],
    ],
  };
}

export function formatLinkConfirmSummary(
  locale: BotLocale,
  phone: string,
  plate: string
): string {
  const L = getClientBotLabels(locale);
  return [
    L.linkConfirmTitle,
    "",
    `${L.linkConfirmPhone}: <b>${phone}</b>`,
    `${L.linkConfirmPlate}: <b>${plate.toUpperCase()}</b>`,
    "",
    L.linkConfirmHint,
  ].join("\n");
}

export function linkConfirmKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: L.linkDataCorrect, callback_data: "cl:lk:ok" }],
      [{ text: L.linkDataWrong, callback_data: "cl:lk:no" }],
    ],
  };
}

export function linkEditPickKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: L.linkEditPhone, callback_data: "cl:lk:edit:phone" }],
      [{ text: L.linkEditPlate, callback_data: "cl:lk:edit:plate" }],
      [{ text: L.linkRestart, callback_data: "cl:lk:restart" }],
      [{ text: L.cancel, callback_data: "cl:menu" }],
    ],
  };
}

export function clientServiceKeyboard(
  locale: BotLocale,
  intent: "book" | "call"
): InlineKeyboardMarkup {
  const services = clientBookableServices(locale);
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  for (let i = 0; i < services.length; i += 2) {
    const chunk = services.slice(i, i + 2);
    rows.push(
      chunk.map((s) => ({
        text: s.label.slice(0, 28),
        callback_data: `cl:svc:${intent}:${s.id}`,
      }))
    );
  }
  rows.push(clientBackMenuRow(locale));
  return { inline_keyboard: rows };
}

export function clientDateKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  const dates = nextBookableDates(8);
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  for (let i = 0; i < dates.length; i += 2) {
    const chunk = dates.slice(i, i + 2);
    rows.push(
      chunk.map((d) => ({
        text: formatDateShort(d, locale),
        callback_data: `cl:dt:${d}`,
      }))
    );
  }
  rows.push([{ text: L.back, callback_data: "cl:book" }]);
  rows.push(clientBackMenuRow(locale));
  return { inline_keyboard: rows };
}

export function clientTimeKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  for (let i = 0; i < timeSlots.length; i += 3) {
    const chunk = timeSlots.slice(i, i + 3);
    rows.push(
      chunk.map((t) => ({
        text: t,
        callback_data: `cl:tm:${encodeTimeSlot(t)}`,
      }))
    );
  }
  rows.push([{ text: L.back, callback_data: "cl:book" }]);
  rows.push(clientBackMenuRow(locale));
  return { inline_keyboard: rows };
}

export function clientSkipCommentKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: L.skip, callback_data: "cl:skip" }],
      [{ text: L.cancel, callback_data: "cl:menu" }],
    ],
  };
}

export function clientConfirmBookingKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: L.confirmBooking, callback_data: "cl:cf:book" }],
      [{ text: L.cancel, callback_data: "cl:menu" }],
    ],
  };
}

export function clientConfirmCallKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: L.confirmCall, callback_data: "cl:cf:call" }],
      [{ text: L.cancel, callback_data: "cl:menu" }],
    ],
  };
}

export function clientContactsKeyboard(locale: BotLocale): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [{ text: "📞 " + siteConfig.phone, url: `tel:${siteConfig.phone.replace(/\s/g, "")}` }],
      [{ text: "🗺 Google Maps", url: mapsUrl() }],
      [{ text: "💬 WhatsApp", url: siteConfig.whatsapp }],
      [{ text: L.bookOnSite, url: `${siteBase()}/booking` }],
      clientBackMenuRow(locale),
    ],
  };
}

export function clientOrdersKeyboard(
  locale: BotLocale,
  orders: { id: string; number: string; needsSign: boolean }[],
  page: number,
  totalPages: number
): InlineKeyboardMarkup {
  const kb: InlineKeyboardMarkup["inline_keyboard"] = orders.map((o) => [
    {
      text: `${o.needsSign ? "✍️ " : ""}${o.number}`,
      callback_data: `cl:wo:${o.id}`,
    },
  ]);

  const nav: InlineKeyboardMarkup["inline_keyboard"][number] = [];
  if (page > 0) nav.push({ text: "◀️", callback_data: `cl:orders:${page - 1}` });
  nav.push({ text: `${page + 1}/${totalPages}`, callback_data: "noop" });
  if (page < totalPages - 1) nav.push({ text: "▶️", callback_data: `cl:orders:${page + 1}` });
  if (nav.length) kb.push(nav);
  kb.push(clientBackMenuRow(locale));
  return { inline_keyboard: kb };
}

export function clientOrderDetailKeyboard(
  locale: BotLocale,
  orderId: string,
  needsSign: boolean
): InlineKeyboardMarkup {
  const L = getClientBotLabels(locale);
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  if (needsSign) {
    rows.push([
      {
        text: L.signOnSite,
        url: `${siteBase()}/sign/${orderId}`,
      },
    ]);
  }
  rows.push([
    {
      text: L.repeatBtn,
      callback_data: `cl:repeat:${orderId}`,
    },
  ]);
  rows.push(
    [{ text: L.backToList, callback_data: "cl:orders:0" }],
    clientBackMenuRow(locale)
  );
  return { inline_keyboard: rows };
}

export function formatClientBookingSummary(
  locale: BotLocale,
  data: Record<string, string>
): string {
  const L = getClientBotLabels(locale);
  const service = data.serviceLabel ?? data.serviceId ?? "—";
  const lines = [L.confirmSummaryTitle, "", `🔧 ${service}`];
  if (data.date && data.time) {
    lines.push(`📅 ${formatDateShort(data.date, locale)} · ${decodeTimeSlot(data.time)}`);
  }
  lines.push(`👤 ${data.name ?? "—"}`, `📱 ${data.phone ?? "—"}`);
  if (data.comment) lines.push(`💬 ${data.comment}`);
  return lines.join("\n");
}
