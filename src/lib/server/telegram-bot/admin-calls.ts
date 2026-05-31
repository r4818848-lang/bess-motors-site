import type { InlineKeyboardMarkup } from "@/lib/server/telegram-api";
import type { Database } from "@/lib/store";
import { markCallAsCalled } from "./crm-actions";
import { esc } from "./format";

export function formatOpenCallsList(db: Database): string {
  const open = db.callRequests
    .filter((c) => c.status === "needs_call")
    .sort((a, b) => {
      const au = a.priority === "urgent" ? 1 : 0;
      const bu = b.priority === "urgent" ? 1 : 0;
      if (bu !== au) return bu - au;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 15);

  if (!open.length) {
    return "📞 <b>Заявки на звонок</b>\n\nНет новых заявок.";
  }

  const lines = [`📞 <b>Нужно перезвонить (${open.length})</b>`, ""];
  for (const c of open) {
    lines.push(
      `<b>${c.priority === "urgent" ? "🚨 " : ""}${esc(c.clientName || "—")}</b>`,
      `📱 ${esc(c.phone)}`,
      `🔧 ${esc(c.serviceLabel)}`,
      c.comment ? `💬 ${esc(c.comment.slice(0, 80))}` : "",
      ""
    );
  }
  return lines.filter(Boolean).join("\n");
}

export function openCallsKeyboard(db: Database): InlineKeyboardMarkup {
  const open = db.callRequests
    .filter((c) => c.status === "needs_call")
    .slice(0, 8);

  const rows = open.map((c) => [
    {
      text: `✓ ${(c.clientName?.slice(0, 14) || c.phone).slice(0, 20)}`,
      callback_data: `calls:done:${c.id}`,
    },
  ]);
  rows.push([{ text: "🏠 Меню", callback_data: "menu" }]);
  return { inline_keyboard: rows };
}

export async function markCallDone(callId: string): Promise<{ ok: boolean }> {
  const result = await markCallAsCalled(callId);
  return { ok: result.ok };
}
