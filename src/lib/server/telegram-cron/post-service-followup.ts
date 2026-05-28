import { cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import { canSendBotNotify } from "@/lib/server/telegram-bot/bot-notify-guard";
import { getClientBotLabels, type BotLocale } from "@/lib/server/telegram-bot/client-i18n";
import { isQuietHours } from "@/lib/quiet-hours";
import type { Database, User, WorkOrder } from "@/lib/store";

const DAY_MS = 24 * 60 * 60 * 1000;

type Stage = { days: number; field: keyof WorkOrder; cb: string };

const STAGES: Stage[] = [
  { days: 3, field: "postFollowup3dSentAt", cb: "cl:fu:ok:3" },
  { days: 7, field: "postFollowup7dSentAt", cb: "cl:fu:ok:7" },
  { days: 14, field: "postFollowup14dSentAt", cb: "cl:fu:ok:14" },
];

function daysSinceDelivered(order: WorkOrder, now: Date): number {
  const base = order.updatedAt || order.createdAt;
  const t = new Date(base).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((now.getTime() - t) / DAY_MS);
}

function followupText(locale: BotLocale, order: WorkOrder, days: number): string {
  const L = getClientBotLabels(locale);
  const q =
    locale === "pl"
      ? `Minęło ${days} dni od odbioru <b>${order.number}</b>. Wszystko OK z autem?`
      : locale === "en"
        ? `${days} days since pickup <b>${order.number}</b>. Everything OK?`
        : `Прошло ${days} дн. после выдачи <b>${order.number}</b>. Всё в порядке с авто?`;
  return `🔧 <b>${L.postFollowupTitle}</b>\n\n${q}`;
}

function followupKeyboard(locale: BotLocale, stageCb: string, orderId: string) {
  const L = getClientBotLabels(locale);
  return {
    inline_keyboard: [
      [
        { text: L.postFollowupOk, callback_data: stageCb },
        { text: L.postFollowupIssue, callback_data: `cl:fu:issue:${orderId}` },
      ],
      [{ text: L.menu, callback_data: "cl:menu" }],
    ],
  };
}

export async function runPostServiceFollowups(db: Database): Promise<number> {
  const now = new Date();
  let sent = 0;

  for (const order of db.workOrders) {
    if (order.status !== "delivered") continue;
    const user = db.users.find((u) => u.id === order.userId && u.role === "client");
    if (!user?.telegramChatId) continue;
    if (!canSendBotNotify(user, "status")) continue;
    if (isQuietHours(now, user.botQuietHours !== false)) continue;

    const elapsed = daysSinceDelivered(order, now);
    const loc = user.telegramLocale ?? "pl";

    for (const stage of STAGES) {
      if (elapsed < stage.days) continue;
      if (order[stage.field]) continue;

      const text = followupText(loc, order, stage.days);
      const id = await sendTelegramMessage(
        user.telegramChatId,
        text,
        followupKeyboard(loc, `${stage.cb}:${order.id}`, order.id)
      );
      if (id) {
        if (stage.field === "postFollowup3dSentAt") order.postFollowup3dSentAt = now.toISOString();
        if (stage.field === "postFollowup7dSentAt") order.postFollowup7dSentAt = now.toISOString();
        if (stage.field === "postFollowup14dSentAt") order.postFollowup14dSentAt = now.toISOString();
        sent++;
        break;
      }
    }
  }

  if (sent > 0) await cloudPutCrmStore(db);
  return sent;
}
