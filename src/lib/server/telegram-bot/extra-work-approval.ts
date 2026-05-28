import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import { canSendBotNotify } from "./bot-notify-guard";
import type { BotLocale } from "./client-i18n";
import { getClientBotLabels } from "./client-i18n";
import { calcClientTotal } from "@/lib/workorder-calc";
import type { Database, WorkOrder, WorkOrderLine } from "@/lib/store";

function uid(): string {
  return `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function requestExtraWorkApproval(
  orderNumber: string,
  lines: WorkOrderLine[],
  note: string
): Promise<{ ok: boolean; message: string }> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return { ok: false, message: "CRM недоступен" };

  const db = structuredClone(snap.doc) as Database;
  const order = db.workOrders.find((o) => o.number === orderNumber);
  if (!order) return { ok: false, message: "Заказ не найден" };

  order.pendingExtraApproval = {
    id: uid(),
    lines,
    note,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await cloudPutCrmStore(db);

  const user = db.users.find((u) => u.id === order.userId);
  if (user?.telegramChatId && canSendBotNotify(user, "status")) {
    const loc = user.telegramLocale ?? "ru";
    const L = getClientBotLabels(loc);
    const lineText = lines.map((l) => `• ${l.name} — ${l.price} zł`).join("\n");
    await sendTelegramMessage(
      user.telegramChatId,
      [
        L.extraWorkTitle,
        "",
        `<b>${order.number}</b>`,
        note,
        "",
        lineText,
        "",
        L.extraWorkPrompt,
      ].join("\n"),
      {
        inline_keyboard: [
          [
            { text: L.extraApprove, callback_data: `cl:extra:ok:${order.id}` },
            { text: L.extraReject, callback_data: `cl:extra:no:${order.id}` },
          ],
          [{ text: L.call, callback_data: "cl:call" }],
        ],
      }
    );
  }

  return { ok: true, message: "Запрос отправлен клиенту" };
}

export async function resolveExtraWorkApproval(
  orderId: string,
  approved: boolean
): Promise<{ ok: boolean }> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return { ok: false };

  const db = structuredClone(snap.doc) as Database;
  const order = db.workOrders.find((o) => o.id === orderId);
  const pending = order?.pendingExtraApproval;
  if (!order || !pending || pending.status !== "pending") return { ok: false };

  if (approved) {
    order.services = [...order.services, ...pending.lines];
    pending.status = "approved";
  } else {
    pending.status = "rejected";
  }
  order.updatedAt = new Date().toISOString();
  order.lastNotifiedClientTotal = calcClientTotal(order);

  await cloudPutCrmStore(db);
  return { ok: true };
}

/** Parse admin line: "Название;цена" or "Название 200" */
export function parseExtraWorkLines(text: string): WorkOrderLine[] {
  const lines: WorkOrderLine[] = [];
  for (const row of text.split("\n").map((x) => x.trim()).filter(Boolean)) {
    const semi = row.split(";");
    const priceMatch = row.match(/(\d+(?:[.,]\d+)?)\s*zł?\s*$/i);
    let name = row;
    let price = 0;
    if (semi.length >= 2) {
      name = semi[0]!.trim();
      price = Number(semi[1]!.replace(",", ".")) || 0;
    } else if (priceMatch) {
      price = Number(priceMatch[1]!.replace(",", "."));
      name = row.slice(0, priceMatch.index).trim();
    }
    if (!name) continue;
    lines.push({
      id: uid(),
      name,
      qty: 1,
      price,
      discount: 0,
    });
  }
  return lines;
}
