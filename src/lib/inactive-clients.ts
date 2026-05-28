import type { Database } from "./store";
import { normalizePhone } from "./auth";

export function exportInactiveClientsCsv(db: Database, months = 6): string {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffKey = cutoff.toISOString().slice(0, 10);

  const lines = ["Telefon;Imię;Ostatni WZ;Ostatnia data"];

  for (const u of db.users.filter((x) => x.role === "client")) {
    const orders = db.workOrders
      .filter((o) => o.userId === u.id && o.status === "delivered")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const last = orders[0];
    if (!last || last.updatedAt >= cutoffKey) continue;
    lines.push(
      [
        normalizePhone(u.phone) || u.phone,
        u.name.replace(/;/g, ","),
        last.number,
        last.updatedAt,
      ].join(";")
    );
  }

  return "\uFEFF" + lines.join("\n");
}
