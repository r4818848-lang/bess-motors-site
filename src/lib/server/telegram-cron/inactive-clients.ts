import { notifyAdminTelegram } from "@/lib/server/telegram-api";
import type { Database } from "@/lib/store";
import { normalizePhone } from "@/lib/auth";

export async function runInactiveClientsReport(
  db: Database,
  months = 6
): Promise<{ count: number }> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffKey = cutoff.toISOString().slice(0, 10);

  const rows: string[] = [];
  for (const u of db.users.filter((x) => x.role === "client")) {
    const orders = db.workOrders
      .filter((o) => o.userId === u.id && o.status === "delivered")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const last = orders[0];
    if (!last || last.updatedAt >= cutoffKey) continue;
    rows.push(
      `• ${u.name} — ${normalizePhone(u.phone) || u.phone} — ${last.updatedAt}`
    );
  }

  if (rows.length) {
    await notifyAdminTelegram(
      [
        `📭 <b>Klienci nieaktywni (${months}+ mies.)</b>`,
        `Liczba: <b>${rows.length}</b>`,
        "",
        ...rows.slice(0, 15),
        rows.length > 15 ? `… +${rows.length - 15}` : "",
      ].join("\n")
    );
  }

  return { count: rows.length };
}
