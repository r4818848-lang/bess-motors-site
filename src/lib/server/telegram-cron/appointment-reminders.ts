import { cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import { getClientBotLabels, type BotLocale } from "@/lib/server/telegram-bot/client-i18n";
import { getClientServiceLabel } from "@/lib/server/telegram-bot/client-services";
import { formatPreVisitChecklistText } from "@/lib/pre-visit-checklist";
import { isQuietHours, tomorrowDateKey, todayDateKey } from "@/lib/quiet-hours";
import { canSendBotNotify } from "@/lib/server/telegram-bot/bot-notify-guard";
import type { Appointment, Database, User } from "@/lib/store";

function parseAptMinutes(date: string, time: string): number {
  const [hh, mm] = time.split(":").map(Number);
  const d = new Date(`${date}T12:00:00`);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d.getTime();
}

function reminderLocale(user: User): BotLocale {
  return user.telegramLocale ?? "pl";
}

async function notifyClient(
  user: User,
  text: string
): Promise<boolean> {
  if (!user.telegramChatId) return false;
  if (isQuietHours(new Date(), user.botQuietHours !== false)) return false;
  const id = await sendTelegramMessage(user.telegramChatId, text);
  return id !== null;
}

export async function runAppointmentReminders(db: Database): Promise<{
  dayBefore: number;
  twoHour: number;
}> {
  const now = new Date();
  const tomorrow = tomorrowDateKey(now);
  const today = todayDateKey(now);
  let dayBefore = 0;
  let twoHour = 0;

  for (const apt of db.appointments) {
    if (apt.appointmentStatus === "cancelled" || apt.appointmentStatus === "completed") {
      continue;
    }

    const user = db.users.find((u) => u.id === apt.userId);
    if (!user?.telegramChatId) continue;
    if (!canSendBotNotify(user, "booking")) continue;

    const loc = reminderLocale(user);
    const L = getClientBotLabels(loc);
    const services = apt.serviceIds.map((id) => getClientServiceLabel(id, loc)).join(", ");

    if (apt.date === tomorrow && !apt.reminderDayBeforeSentAt) {
      const text = [
        "⏰ <b>" + (loc === "pl" ? "Przypomnienie o wizycie" : loc === "en" ? "Appointment reminder" : "Напоминание о записи") + "</b>",
        "",
        `📅 <b>${apt.date}</b> · ${apt.time}`,
        `🔧 ${services}`,
        "",
        formatPreVisitChecklistText(apt.serviceIds[0] ?? "default", loc),
      ].join("\n");

      if (await notifyClient(user, text)) {
        apt.reminderDayBeforeSentAt = now.toISOString();
        dayBefore++;
      }
    }

    if (apt.date === today && !apt.reminder2hSentAt) {
      const diffMs = parseAptMinutes(apt.date, apt.time) - now.getTime();
      const twoHours = 2 * 60 * 60 * 1000;
      if (diffMs > 0 && diffMs <= twoHours + 15 * 60 * 1000) {
        const text = [
          "🔔 <b>" + (loc === "pl" ? "Za 2 godziny wizyta" : loc === "en" ? "Visit in 2 hours" : "Через 2 часа визит") + "</b>",
          "",
          `📅 ${apt.time}`,
          `🔧 ${services}`,
          "",
          L.cabinetHint,
        ].join("\n");

        if (await notifyClient(user, text)) {
          apt.reminder2hSentAt = now.toISOString();
          twoHour++;
        }
      }
    }
  }

  if (dayBefore > 0 || twoHour > 0) {
    await cloudPutCrmStore(db);
  }

  return { dayBefore, twoHour };
}
