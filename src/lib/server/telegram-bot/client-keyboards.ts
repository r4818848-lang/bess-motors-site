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

export function clientMainKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: CLIENT.book, callback_data: "cl:book" }],
      [{ text: CLIENT.call, callback_data: "cl:call" }],
      [
        { text: CLIENT.myAppointments, callback_data: "cl:my" },
        { text: CLIENT.contacts, callback_data: "cl:contacts" },
      ],
      [
        {
          text: "🌐 Сайт",
          url: "https://www.bess-motors.com/booking",
        },
      ],
    ],
  };
}

export function clientBackMenuRow(): InlineKeyboardMarkup["inline_keyboard"][number] {
  return [{ text: CLIENT.menu, callback_data: "cl:menu" }];
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
          url: "https://www.bess-motors.com/booking",
        },
      ],
      clientBackMenuRow(),
    ],
  };
}

export function formatClientBookingSummary(data: Record<string, string>): string {
  const service = data.serviceLabel ?? data.serviceId ?? "—";
  const lines = [
    "<b>Проверьте данные:</b>",
    "",
    `🔧 ${service}`,
  ];
  if (data.date && data.time) {
    lines.push(`📅 ${formatDateShort(data.date)} · ${decodeTimeSlot(data.time)}`);
  }
  lines.push(
    `👤 ${data.name ?? "—"}`,
    `📱 ${data.phone ?? "—"}`
  );
  if (data.comment) {
    lines.push(`💬 ${data.comment}`);
  }
  return lines.join("\n");
}
