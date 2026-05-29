import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import type { Database, Appointment } from "@/lib/store";
import { nextBookableDates } from "./client-services";

function shiftDate(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  const key = d.toISOString().slice(0, 10);
  const bookable = nextBookableDates(30);
  if (bookable.includes(key)) return key;
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  return key;
}

export async function rescheduleAppointment(
  aptId: string,
  days: number,
  userId?: string
): Promise<{ ok: boolean; apt?: Appointment }> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return { ok: false };

  const db = structuredClone(snap.doc) as Database;
  const apt = db.appointments.find((a) => a.id === aptId);
  if (!apt) return { ok: false };
  if (userId && apt.userId !== userId) return { ok: false };

  apt.date = shiftDate(apt.date, days);
  await cloudPutCrmStore(db);
  return { ok: true, apt };
}
