import { formatWarsawDateKey } from "@/lib/date-key";
import { schedulerReadOnlyPilotEnabled } from "@/lib/smart-scheduler/flag";
import { addDateKeyDays } from "@/lib/staff-calendar";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import {
  sendTelegramMessage,
  setPersonalChatMenuButton,
  type InlineKeyboardMarkup,
} from "@/lib/server/telegram-api";
import type { Database } from "@/lib/store";
import { loadCrmFromCloud } from "./crm-actions";

export const CALENDAR_SITE_FALLBACK = "https://www.bess-motors.com";

/** HTTPS origin for the Mini App. A non-HTTPS value falls back to the public site. */
export function calendarSiteOrigin(): string {
  const raw = cleanEnvValue(process.env.NEXT_PUBLIC_SITE_URL);
  if (!raw) return CALENDAR_SITE_FALLBACK;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (url.protocol !== "https:" || url.username || url.password) return CALENDAR_SITE_FALLBACK;
    return url.origin;
  } catch {
    return CALENDAR_SITE_FALLBACK;
  }
}

export function calendarAppUrl(aptId?: string, extra?: { create?: boolean; leadId?: string }): string {
  const url = new URL("/telegram/calendar", calendarSiteOrigin());
  if (aptId && /^[A-Za-z0-9_-]{1,80}$/.test(aptId)) url.searchParams.set("apt", aptId);
  if (extra?.create) url.searchParams.set("new", "1");
  if (extra?.leadId && /^[A-Za-z0-9_-]{1,80}$/.test(extra.leadId)) url.searchParams.set("lead", extra.leadId);
  return url.toString();
}

/** Staff-only Mini App entry. The existing editable calendar remains unchanged. */
export function smartSchedulerReadonlyRow(): InlineKeyboardMarkup["inline_keyboard"][number] | null {
  if (!schedulerReadOnlyPilotEnabled()) return null;
  return [{ text: "🧠 План работ · просмотр", web_app: { url: new URL("/telegram/scheduler", calendarSiteOrigin()).toString() } }];
}

export const CALENDAR_REPLY_LABEL = "📅 Календарь";
export const STAFF_TODAY_LABEL = "🚗 Сегодня";
export const STAFF_LEADS_LABEL = "📥 Заявки";
export const STAFF_NEW_LABEL = "➕ Новая запись";

export const CALENDAR_OPEN_TEXT =
  "📅 <b>Календарь сервиса</b>\n\nЗаписи из CRM. Время приезда проверяется на сервере.";

export function isCalendarOpenText(text: string): boolean {
  const value = text.trim();
  return value === "/calendar" || value === CALENDAR_REPLY_LABEL;
}

export function calendarOpenKeyboard(aptId?: string): InlineKeyboardMarkup {
  const rows: InlineKeyboardMarkup["inline_keyboard"] = [];
  if (aptId) {
    rows.push([{ text: "Открыть запись", web_app: { url: calendarAppUrl(aptId) } }]);
  }
  rows.push([{ text: "📅 Календарь", web_app: { url: calendarAppUrl() } }]);
  const smart = smartSchedulerReadonlyRow();
  if (smart) rows.push(smart);
  return { inline_keyboard: rows };
}

export async function sendCalendarOpenPrompt(chatId: number): Promise<void> {
  await sendTelegramMessage(chatId, CALENDAR_OPEN_TEXT, calendarOpenKeyboard());
}

/** Personal menu button. The request always names one chat and never the bot default. */
export function staffCalendarMenuButtonBody(chatId: number): {
  chat_id: number;
  menu_button: { type: "web_app"; text: string; web_app: { url: string } };
} {
  if (!Number.isInteger(chatId)) {
    throw new Error("staff menu button requires a private chat id");
  }
  return {
    chat_id: chatId,
    menu_button: {
      type: "web_app",
      text: "Календарь",
      web_app: { url: calendarAppUrl() },
    },
  };
}

export async function publishStaffCalendarMenu(chatId: number): Promise<void> {
  await setPersonalChatMenuButton(staffCalendarMenuButtonBody(chatId));
}

export function todayKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "Завтра", callback_data: "cal:tomorrow" }],
      [{ text: "📅 Календарь", web_app: { url: calendarAppUrl() } }],
    ],
  };
}

export function formatStaffDay(
  db: Database,
  dateKey: string,
  mechanicId?: string
): string {
  const rows = db.appointments
    .filter(
      (apt) =>
        apt.date === dateKey &&
        !apt.calendarHidden &&
        apt.appointmentStatus !== "cancelled" &&
        apt.appointmentStatus !== "completed"
    )
    .filter((apt) => !mechanicId || apt.mechanicId === mechanicId)
    .sort((a, b) => a.time.localeCompare(b.time));
  const calls = mechanicId
    ? []
    : db.callRequests.filter((call) => call.status === "needs_call").slice(0, 8);

  const lines = [`📅 <b>${dateKey}</b>`, ""];
  if (!rows.length) lines.push("Записей нет.");
  for (const apt of rows) {
    const vehicle = db.vehicles.find((item) => item.id === apt.vehicleId);
    const mechanic = db.mechanics.find((item) => item.id === apt.mechanicId);
    const car = [vehicle?.make, vehicle?.model, apt.clientPlate || vehicle?.plate]
      .filter(Boolean)
      .join(" ");
    lines.push(
      [
        `<b>${apt.time}</b> ${car || "авто"}`,
        apt.clientName ? `👤 ${apt.clientName}` : "",
        apt.clientPhone ? `☎️ ${apt.clientPhone}` : "",
        mechanic ? `🔧 ${mechanic.name}` : "",
        apt.problemText ? apt.problemText : apt.serviceIds.join(", "),
      ]
        .filter(Boolean)
        .join("\n")
    );
    lines.push("");
  }
  if (calls.length) {
    lines.push("<b>Заявки на звонок</b>");
    for (const call of calls) {
      lines.push(`📞 ${call.clientName || "клиент"} · ${call.phone} · ${call.serviceLabel}`);
    }
  }
  return lines.join("\n").slice(0, 3900);
}

export async function sendStaffDay(
  chatId: number,
  offsetDays: number,
  mechanicId?: string
): Promise<void> {
  const db = await loadCrmFromCloud();
  if (!db) {
    await sendTelegramMessage(chatId, "☁️ CRM недоступна.");
    return;
  }
  const today = formatWarsawDateKey();
  const dateKey = addDateKeyDays(today, offsetDays) ?? today;
  await sendTelegramMessage(chatId, formatStaffDay(db, dateKey, mechanicId), todayKeyboard());
}
