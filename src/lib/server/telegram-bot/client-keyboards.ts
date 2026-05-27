import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import { timeSlots } from "@/lib/data";
import { siteConfig } from "@/lib/site";
import { CLIENT } from "./client-labels";
import {
  clientBookableServices,
  decodeTimeSlot,
  encodeTimeSlot,
  formatDateShort,
  nextBookableDates,
} from "./client-services";
import type { ClientPortalSlice } from "@/lib/client-sign";

function siteBase(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.bess-motors.com";
}

export function clientMainKeyboard(linked = false): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];

  if (linked) {
    rows.push(
      [{ text: CLIENT.myOrders, callback_data: "cl:orders:0" }],
      [
        { text: CLIENT.notifications, callback_data: "cl:notif" },
        { text: CLIENT.myAppointments, callback_data: "cl:apts" },
      ],
      [{ text: CLIENT.myCars, callback_data: "cl:cars" }]
    );
  } else {
    rows.push([{ text: CLIENT.activate, callback_data: "cl:link" }]);
  }

  rows.push(
    [{ text: CLIENT.book, callback_data: "cl:book" }],
    [{ text: CLIENT.call, callback_data: "cl:call" }],
    [
      { text: CLIENT.contacts, callback_data: "cl:contacts" },
      { text: "🌐 Сайт", url: `${siteBase()}/cabinet` },
    ]
  );

  return { inline_keyboard: rows };
}

export function clientLinkedMenuKeyboard(
  slice: ClientPortalSlice,
  pendingSign: number,
  unread: number
): InlineKeyboardMarkup {
  const notifLabel =
    unread > 0 ? `${CLIENT.notifications} (${unread})` : CLIENT.notifications;
  const ordersLabel =
    pendingSign > 0 ? `${CLIENT.myOrders} (✍️${pendingSign})` : CLIENT.myOrders;

  return {
    inline_keyboard: [
      [{ text: ordersLabel, callback_data: "cl:orders:0" }],
      [
        { text: notifLabel, callback_data: "cl:notif" },
        { text: CLIENT.myAppointments, callback_data: "cl:apts" },
      ],
      [{ text: CLIENT.myCars, callback_data: "cl:cars" }],
      [
        { text: CLIENT.book, callback_data: "cl:book" },
        { text: CLIENT.call, callback_data: "cl:call" },
      ],
      [
        { text: CLIENT.contacts, callback_data: "cl:contacts" },
        { text: "🌐 Кабинет на сайте", url: `${siteBase()}/cabinet` },
      ],
    ],
  };
}

export function clientBackMenuRow(): InlineKeyboardMarkup["inline_keyboard"][number] {
  return [{ text: CLIENT.menu, callback_data: "cl:menu" }];
}

export function clientLinkPhoneKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: CLIENT.cancel, callback_data: "cl:menu" }],
    ],
  };
}

export function phoneRequestReplyKeyboard() {
  return {
    keyboard: [[{ text: CLIENT.linkPhoneBtn, request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

export function clientServiceKeyboard(intent: "book" | "call"): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  for (let i = 0; i < clientBookableServices.length; i += 2) {
    const chunk = clientBookableServices.slice(i, i + 2);
    rows.push(
      chunk.map((s) => ({
        text: s.label.slice(0, 28),
        callback_data: `cl:svc:${intent}:${s.id}`,
      }))
    );
  }
  rows.push(clientBackMenuRow());
  return { inline_keyboard: rows };
}

export function clientDateKeyboard(): InlineKeyboardMarkup {
  const dates = nextBookableDates(10);
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  for (let i = 0; i < dates.length; i += 2) {
    const chunk = dates.slice(i, i + 2);
    rows.push(
      chunk.map((d) => ({
        text: formatDateShort(d),
        callback_data: `cl:dt:${d}`,
      }))
    );
  }
  rows.push([{ text: CLIENT.back, callback_data: "cl:book" }]);
  rows.push(clientBackMenuRow());
  return { inline_keyboard: rows };
}

export function clientTimeKeyboard(): InlineKeyboardMarkup {
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
  rows.push([{ text: CLIENT.back, callback_data: "cl:book" }]);
  rows.push(clientBackMenuRow());
  return { inline_keyboard: rows };
}

export function clientSkipCommentKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: CLIENT.skip, callback_data: "cl:skip" }],
      [{ text: CLIENT.cancel, callback_data: "cl:menu" }],
    ],
  };
}

export function clientConfirmBookingKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: CLIENT.confirmBooking, callback_data: "cl:cf:book" }],
      [{ text: CLIENT.cancel, callback_data: "cl:menu" }],
    ],
  };
}

export function clientConfirmCallKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: CLIENT.confirmCall, callback_data: "cl:cf:call" }],
      [{ text: CLIENT.cancel, callback_data: "cl:menu" }],
    ],
  };
}

export function clientContactsKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "💬 WhatsApp", url: siteConfig.whatsapp }],
      [
        {
          text: "🌐 Запись на сайте",
          url: `${siteBase()}/booking`,
        },
      ],
      clientBackMenuRow(),
    ],
  };
}

export function clientOrdersKeyboard(
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
  kb.push(clientBackMenuRow());
  return { inline_keyboard: kb };
}

export function clientOrderDetailKeyboard(
  orderId: string,
  needsSign: boolean
): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  if (needsSign) {
    rows.push([
      {
        text: "✍️ Подписать на сайте",
        url: `${siteBase()}/sign/${orderId}`,
      },
    ]);
  }
  rows.push(
    [{ text: "◀️ К списку", callback_data: "cl:orders:0" }],
    clientBackMenuRow()
  );
  return { inline_keyboard: rows };
}

export function formatClientBookingSummary(data: Record<string, string>): string {
  const service = data.serviceLabel ?? data.serviceId ?? "—";
  const lines = ["<b>Проверьте данные:</b>", "", `🔧 ${service}`];
  if (data.date && data.time) {
    lines.push(`📅 ${formatDateShort(data.date)} · ${decodeTimeSlot(data.time)}`);
  }
  lines.push(`👤 ${data.name ?? "—"}`, `📱 ${data.phone ?? "—"}`);
  if (data.comment) lines.push(`💬 ${data.comment}`);
  return lines.join("\n");
}
