import { NextResponse } from "next/server";
import { workshopHours } from "@/lib/businessConfig";
import { guardScheduler, isGuardError } from "@/lib/smart-scheduler/access";
import { readOnlyAppointments } from "@/lib/smart-scheduler/crm-read";
import { syntheticSnapshot } from "@/lib/smart-scheduler/fixture";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const actor = await guardScheduler(req);
  if (isGuardError(actor)) return actor;
  if (process.env.SCHEDULER_CRM_SOURCE === "cloud") {
    const { loadCrmFromCloud } = await import("@/lib/server/telegram-bot/crm-actions");
    const db = await loadCrmFromCloud();
    if (!db) return NextResponse.json({ ok: false, error: "cloud_empty", writable: false }, { status: 503 });
    const read = readOnlyAppointments(db, workshopHours());
    return NextResponse.json({ ok: true, source: "cloud", writable: false, mechanics: read.mechanicNames, appointments: read.appointments });
  }
  const snapshot = syntheticSnapshot(new Date(), workshopHours());
  return NextResponse.json({
    ok: true,
    source: snapshot.source,
    writable: false,
    mechanics: snapshot.mechanics.map((mechanic) => ({ id: mechanic.id, label: mechanic.label, confirmed: mechanic.confirmed })),
    count: snapshot.appointments.length,
  });
}
