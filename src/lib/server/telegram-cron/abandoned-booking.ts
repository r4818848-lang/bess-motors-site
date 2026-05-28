import type { Database } from "@/lib/store";
import { getAbandonedDrafts } from "@/lib/abandoned-booking";
import { normalizePhone } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/server/telegram-api";

const HOURS_STALE = 24;

export async function runAbandonedBookingReminders(db: Database): Promise<number> {
  const drafts = getAbandonedDrafts(db.settings);
  const cutoff = Date.now() - HOURS_STALE * 60 * 60 * 1000;
  let sent = 0;

  for (const draft of drafts) {
    if (draft.reminderSentAt) continue;
    if (new Date(draft.updatedAt).getTime() > cutoff) continue;

    const phoneKey = normalizePhone(draft.phone);
    const user = db.users.find(
      (u) => u.role === "client" && normalizePhone(u.phone) === phoneKey
    );
    const chatId = user?.telegramChatId
      ? Number(user.telegramChatId)
      : NaN;
    if (!Number.isFinite(chatId)) continue;

    const hasRecentApt = db.appointments.some(
      (a) =>
        normalizePhone(a.clientPhone ?? "") === phoneKey &&
        a.createdAt &&
        new Date(a.createdAt).getTime() > cutoff
    );
    if (hasRecentApt) continue;

    const msg =
      user?.telegramLocale === "ru"
        ? `📝 Вы не завершили запись на сайте. Продолжить: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bess-motors.com"}/booking`
        : `📝 Nie dokończyłeś rezerwacji online. Kontynuuj: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bess-motors.com"}/booking`;

    await sendTelegramMessage(chatId, msg);
    draft.reminderSentAt = new Date().toISOString();
    sent++;
  }

  return sent;
}
