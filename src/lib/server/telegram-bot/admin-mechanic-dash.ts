import { formatWarsawDateKey, addDateKeyDays } from "@/lib/date-key";
import { workshopHours } from "@/lib/businessConfig";
import { openingWindowForDateKey } from "@/lib/workshop-schedule";
import { splitWorkBlocks } from "@/lib/smart-scheduler/schedule";
import type { Database } from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { formatMechanicsReport } from "./format";
import type { ReportPeriod } from "@/lib/crm-analytics";

export function formatMechanicDashboard(db: Database, period: ReportPeriod = "day"): string {
  const base = formatMechanicsReport(db, period);
  const today = formatWarsawDateKey();

  const active = db.workOrders.filter((o) => o.status !== "delivered");
  const readyToday = db.workOrders.filter(
    (o) => o.status === "ready" && (o.updatedAt ?? "").slice(0, 10) === today
  );

  const days = Array.from({length:7}, (_,i) => addDateKeyDays(today,i)!);
  const hours = workshopHours();
  const capacity = days.reduce((total,date) => {
    const window = openingWindowForDateKey(date,hours);
    return total + (window ? window.closeMin - window.openMin : 0);
  },0) * db.mechanics.length;
  let planned = 0;
  for (const a of db.appointments) {
    if (!a.workStart || !a.workMinutes || a.calendarHidden || a.visitState === "no_show" || ["cancelled","completed"].includes(a.appointmentStatus)) continue;
    if (a.date > days[6] || a.date < addDateKeyDays(today,-14)!) continue;
    const result = splitWorkBlocks({id:a.id,date:a.date,start:a.workStart,minutes:a.workMinutes,hours,mechanicId:a.mechanicId,resourceIds:[],operationCode:"repair"});
    if (result.ok) for (const block of result.blocks) if (days.includes(block.date)) planned += (block.endMs-block.startMs)/60000;
  }
  const lines = [
    "🔧 <b>Загрузка сервиса</b>",
    "",
    `План на 7 дней: ${(planned/60).toFixed(1)} ч из ${(capacity/60).toFixed(1)} ч по графику сервиса${capacity ? " · "+Math.round(planned/capacity*100)+"%" : ""}`,
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
