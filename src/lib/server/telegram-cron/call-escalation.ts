import { notifyAdminTelegram } from "@/lib/server/telegram-api";
import type { Database } from "@/lib/store";

const ESCALATE_HOURS = 2;

export async function runCallEscalation(db: Database): Promise<number> {
  const now = Date.now();
  const stale = db.callRequests.filter((c) => {
    if (c.status !== "needs_call") return false;
    const created = new Date(c.createdAt).getTime();
    return now - created > ESCALATE_HOURS * 3600 * 1000;
  });

  if (!stale.length) return 0;

  const lines = stale.slice(0, 8).map((c) => {
    const pri = c.priority === "urgent" ? "🚨" : "📞";
    return `${pri} ${c.clientName ?? "—"} · ${c.phone} · ${c.createdAt.slice(0, 16)}`;
  });

  await notifyAdminTelegram(
    ["⚠️ <b>Звонки без ответа &gt; 2 ч</b>", "", ...lines, "", "CRM → звонки"].join("\n")
  );
  return stale.length;
}
