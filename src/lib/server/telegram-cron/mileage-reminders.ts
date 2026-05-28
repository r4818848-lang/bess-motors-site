import { oilChangeRemindersFromHistory } from "@/lib/mileage-from-history";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import type { Database } from "@/lib/store";
import type { BotLocale } from "../telegram-bot/client-i18n";

export async function runMileageReminders(db: Database): Promise<number> {
  let sent = 0;
  const clients = db.users.filter((u) => u.role === "client" && u.telegramChatId);

  for (const user of clients) {
    if (user.botMuteUntil && new Date(user.botMuteUntil) > new Date()) continue;
    const vehicles = db.vehicles.filter((v) => v.userId === user.id);
    const locale: BotLocale = user.telegramLocale ?? "ru";

    if (user.lastMileageRemindAt) {
      const days = (Date.now() - new Date(user.lastMileageRemindAt).getTime()) / 86400_000;
      if (days < 30) continue;
    }

    for (const v of vehicles) {
      const reminders = oilChangeRemindersFromHistory(
        v.id,
        db.workOrders,
        v.mileage ?? 0,
        locale === "pl" ? "pl" : "ru"
      );
      if (!reminders.length) continue;

      const r = reminders[0]!;
      const text = locale === "pl" ? r.detailPl : r.detailRu;
      const ok = await sendTelegramMessage(user.telegramChatId!, `🛢 ${text}`);
      if (ok) sent++;
    }
  }

  return sent;
}
