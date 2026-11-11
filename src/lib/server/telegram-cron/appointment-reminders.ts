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
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
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
import { leadNoticeDeliveryEnabled } from "@/lib/server/cron-auth";
import { deliverPendingLeadNotices } from "./lead-notifications";

function reminderLocale(user: User): BotLocale {
  return user.telegramLocale ?? "pl";
}

async function saveReminderFields(before: Database, after: Database): Promise<void> {
  await cloudMutateCrmStore((live) => {
    for (const apt of after.appointments) {
      const prev = before.appointments.find((item) => item.id === apt.id);
      const row = live.appointments.find((item) => item.id === apt.id);
      if (!prev || !row) continue;
      if (apt.reminderDayBeforeSentAt && !row.reminderDayBeforeSentAt) {
        row.reminderDayBeforeSentAt = apt.reminderDayBeforeSentAt;
      }
      if (apt.reminder2hSentAt && !row.reminder2hSentAt) row.reminder2hSentAt = apt.reminder2hSentAt;
      if (apt.adminReminder && JSON.stringify(apt.adminReminder) !== JSON.stringify(prev.adminReminder)) {
        const liveStatus = row.adminReminder?.status;
        const nextStatus = apt.adminReminder.status;
        if (liveStatus === "sent" || (nextStatus === "sending" && liveStatus === "sending")) continue;
        row.adminReminder = apt.adminReminder;
        const previousMs = Date.parse(row.updatedAt ?? "");
        const requestedMs = Date.parse(apt.updatedAt ?? "");
        const baseMs = Math.max(
          Number.isFinite(previousMs) ? previousMs : 0,
          Number.isFinite(requestedMs) ? requestedMs : 0
        );
        row.updatedAt = new Date(baseMs + 1).toISOString();
      }
    }
  }, { skipAutomation: true });
}

export async function reserveMorningDigest(today: string): Promise<boolean> {
  const result = await cloudMutateCrmStore((db) => {
    if (db.settings.morningDigestDate === today) return "skip";
    db.settings.morningDigestDate = today;
    return "send";
  }, { skipAutomation: true });
  return result.ok && result.result === "send";
}

export async function releaseMorningDigest(today: string): Promise<void> {
  await cloudMutateCrmStore((db) => {
    if (db.settings.morningDigestDate === today) db.settings.morningDigestDate = undefined;
  }, { skipAutomation: true });
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
        const before = structuredClone(db);
        apt.reminderDayBeforeSentAt = now.toISOString();
        dayBefore += 1;
        clientDirty = true;
        await saveReminderFields(before, db);
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
          const before = structuredClone(db);
          apt.reminder2hSentAt = now.toISOString();
          twoHour += 1;
          clientDirty = true;
          await saveReminderFields(before, db);
        }
      }
    }
  }

  const admin = await deliverAdminArrivalReminders({
    now,
    adminChatIds: productionAdminChatIds(),
    store: {
      load: async () => (await cloudGetCrmStore())?.doc ?? null,
      mutate: async (change) => {
        const result = await cloudMutateCrmStore((live) => {
          change(live);
        }, { skipAutomation: true });
        return result.ok;
      },
    },
    send: sendAdminArrivalMessage,
  });

  if (clientDirty && admin.sent === 0 && admin.failed === 0 && admin.suppressed === 0) {
    await saveReminderFields(structuredClone(db), db);
  }

  if (leadNoticeDeliveryEnabled()) await deliverPendingLeadNotices(now);

  const warsaw = warsawParts(now);
  const digestDate = warsawTodayKey(now);
  if (isMorningDigestHour(now) && warsaw.minutes >= 5 && !morningDigestAlreadySent(db, digestDate)) {
    if (await reserveMorningDigest(digestDate)) {
      const digestSent = await notifyAdminTelegram(formatMorningDigest(db, digestDate));
      if (!digestSent) await releaseMorningDigest(digestDate);
    }
  }

  return {
    dayBefore,
    twoHour,
    adminReminders: admin.sent,
    adminFailed: admin.failed,
    adminCancelled: admin.suppressed,
  };
}
