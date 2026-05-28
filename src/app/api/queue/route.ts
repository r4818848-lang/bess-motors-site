import { NextResponse } from "next/server";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";

export const dynamic = "force-dynamic";

/** Public live queue hint — no auth */
export async function GET() {
  const db = await loadCrmFromCloud();
  if (!db) {
    return NextResponse.json({
      ok: true,
      activeRepairs: 0,
      appointmentsToday: 0,
      freeSlotsHint: "unknown",
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeRepairs = db.workOrders.filter((o) =>
    ["received", "diagnostic", "repair", "waitingParts"].includes(o.status)
  ).length;
  const appointmentsToday = db.appointments.filter(
    (a) => a.date === today && a.appointmentStatus !== "cancelled"
  ).length;

  let freeSlotsHint: "low" | "medium" | "high" = "medium";
  if (appointmentsToday >= 8) freeSlotsHint = "low";
  else if (appointmentsToday <= 3) freeSlotsHint = "high";

  return NextResponse.json({
    ok: true,
    activeRepairs,
    appointmentsToday,
    freeSlotsHint,
    updatedAt: new Date().toISOString(),
  });
}
