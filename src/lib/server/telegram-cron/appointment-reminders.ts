import { formatWarsawDateKey } from "@/lib/date-key";
import { addDateKeyDays } from "@/lib/staff-calendar";
import { warsawCivilToUtc, warsawParts } from "@/lib/workshop-schedule";
import { notifyAdminTelegram } from "@/lib/server/telegram-api";
import {
  formatMorningDigest,
  isMorningDigestHour,
  morningDigestAlreadySent,
  warsawTodayKey,
} from "@/lib/morning-digest";
import { cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import { getClientBotLabels, type BotLocale } from "@/lib/server/telegram-bot/client-i18n";
import { getClientServiceLabel } from "@/lib/server/telegram-bot/client-services";
import { formatPreVisitChecklistText } from "@/lib/pre-visit-checklist";
import { isQuietHours } from "@/lib/quiet-hours";
import { canSendBotNotify } from "@/lib/server/telegram-bot/bot-notify-guard";
import type { Database, User } from "@/lib/store";
import {
  deliverAdminArrivalReminders,
  productionAdminChatIds,
  sendAdminArrivalMessage,
} from "./admin-arrival-reminders";
import { deliverPendingLeadNotices } from "./lead-notifications";

function reminderLocale(user: User): BotLocale {
  return user.telegramLocale ?? "pl";
}

async function notifyClient(user: User, text: string, now: Date): Promise<boolean> {
  if (!user.telegramChatId) return false;
  if (isQuietHours(now, user.botQuietHours !== false)) return false;
  const id = await sendTelegramMessage(user.telegramChatId, text);
  return id !== null;
}

export async function runAppointmentReminders(
  db: Database,
  now = new Date()
): Promise<{
  dayBefore: number;
  twoHour: number;
  adminReminders: number;
  adminFailed: number;
  adminCancelled: number;
}> {
  const today = formatWarsawDateKey(now);
  const tomorrow = addDateKeyDays(today, 1) ?? today;
  let dayBefore = 0;
  let twoHour = 0;
  let clientDirty = false;

  for (const apt of db.appointments) {
    if (apt.appointmentStatus === "cancelled" || apt.appointmentStatus === "completed") {
      continue;
    }

    const user = db.users.find((item) => item.id === apt.userId);
    if (!user?.telegramChatId) continue;
    if (!canSendBotNotify(user, "booking")) continue;

    const loc = reminderLocale(user);
    const labels = getClientBotLabels(loc);
    const services = apt.serviceIds.map((id) => getClientServiceLabel(id, loc)).join(", ");

    if (apt.date === tomorrow && !apt.reminderDayBeforeSentAt) {
      const text = [
        "⏰ <b>" +
          (loc === "pl"
            ? "Przypomnienie o wizycie"
            : loc === "en"
              ? "Appointment reminder"
              : "Напоминание о записи") +
          "</b>",
        "",
        `📅 <b>${apt.date}</b> · ${apt.time}`,
        `🔧 ${services}`,
        "",
        formatPreVisitChecklistText(apt.serviceIds[0] ?? "default", loc),
      ].join("\n");

      if (await notifyClient(user, text, now)) {
        apt.reminderDayBeforeSentAt = now.toISOString();
        dayBefore += 1;
        clientDirty = true;
        await cloudPutCrmStore(db);
      }
    }

    if (apt.date === today && !apt.reminder2hSentAt) {
      const arrival = warsawCivilToUtc(apt.date, apt.time);
      const diffMs = arrival ? arrival.getTime() - now.getTime() : Number.NaN;
      if (diffMs > 0 && diffMs <= 2 * 60 * 60 * 1000) {
        const text = [
          "🔔 <b>" +
            (loc === "pl" ? "Za 2 godziny wizyta" : loc === "en" ? "Visit in 2 hours" : "Через 2 часа визит") +
            "</b>",
          "",
          `📅 ${apt.time}`,
          `🔧 ${services}`,
          "",
          labels.cabinetHint,
        ].join("\n");

        if (await notifyClient(user, text, now)) {
          apt.reminder2hSentAt = now.toISOString();
          twoHour += 1;
          clientDirty = true;
          await cloudPutCrmStore(db);
        }
      }
    }
  }

  const admin = await deliverAdminArrivalReminders({
    db,
    now,
    adminChatIds: productionAdminChatIds(),
    send: sendAdminArrivalMessage,
    save: async (snapshot) => {
      await cloudPutCrmStore(snapshot);
    },
  });

  if (clientDirty && admin.sent === 0 && admin.failed === 0 && admin.cancelled === 0) {
    await cloudPutCrmStore(db);
  }

  await deliverPendingLeadNotices(db, now);

  const warsaw = warsawParts(now);
  const digestDate = warsawTodayKey(now);
  if (isMorningDigestHour(now) && warsaw.minutes >= 5 && !morningDigestAlreadySent(db, digestDate)) {
    db.settings.morningDigestDate = digestDate;
    await cloudPutCrmStore(db);
    const digestSent = await notifyAdminTelegram(formatMorningDigest(db, digestDate));
    if (!digestSent) {
      db.settings.morningDigestDate = undefined;
      await cloudPutCrmStore(db);
    }
  }

  return {
    dayBefore,
    twoHour,
    adminReminders: admin.sent,
    adminFailed: admin.failed,
    adminCancelled: admin.cancelled,
  };
}
