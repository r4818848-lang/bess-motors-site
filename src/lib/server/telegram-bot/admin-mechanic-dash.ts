import type { Database } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { formatMechanicsReport } from "./format";
import type { ReportPeriod } from "@/lib/crm-analytics";

export function formatMechanicDashboard(db: Database, period: ReportPeriod = "day"): string {
  const base = formatMechanicsReport(db, period);
  const today = new Date().toISOString().slice(0, 10);

  const active = db.workOrders.filter((o) => o.status !== "delivered");
  const readyToday = db.workOrders.filter(
    (o) => o.status === "ready" && (o.updatedAt ?? "").slice(0, 10) === today
  );

  const lines = [
    "🔧 <b>Загрузка сервиса</b>",
    "",
    `В работе: <b>${active.length}</b>`,
    `Готово сегодня: <b>${readyToday.length}</b>`,
    "",
    base,
  ];

  return lines.join("\n");
}

export function mechanicLoadById(db: Database, mechanicId: string): number {
  return db.workOrders.filter(
    (o) => o.mechanicId === mechanicId && o.status !== "delivered"
  ).length;
}

export function mechanicRevenueToday(db: Database, mechanicId: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return db.workOrders
    .filter(
      (o) =>
        o.mechanicId === mechanicId &&
        (o.updatedAt ?? "").slice(0, 10) === today &&
        o.status === "delivered"
    )
    .reduce((s, o) => s + calcClientTotal(o), 0);
}
