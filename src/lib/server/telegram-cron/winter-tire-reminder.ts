import { sendTelegramMessage } from "@/lib/server/telegram-api";
import type { Database } from "@/lib/store";

/** October–November only — seasonal push. */
export async function runWinterTireReminder(db: Database): Promise<number> {
  const now = new Date();
  const month = now.getMonth() + 1;
  if (month !== 10 && month !== 11) return 0;
  if (now.getDate() !== 1) return 0;

  let sent = 0;
  for (const user of db.users.filter((u) => u.role === "client" && u.telegramChatId).slice(0, 50)) {
    if (user.botMuteUntil && new Date(user.botMuteUntil) > new Date()) continue;
    const loc = user.telegramLocale ?? "ru";
    const text =
      loc === "pl"
        ? "❄️ <b>Zima blisko</b>\nZamów wymianę opon zimowych w BESS MOTORS — /menu → Rezerwacja."
        : loc === "en"
          ? "❄️ <b>Winter tires</b>\nBook tire change — /menu"
          : "❄️ <b>Зима близко</b>\nЗапишитесь на зимнюю резину — /menu → Запись.";
    const ok = await sendTelegramMessage(user.telegramChatId!, text);
    if (ok) sent++;
  }
  return sent;
}
