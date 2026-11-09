import { handleAppointmentNotification } from "@/lib/client-notifications";
import { assertBookingSlotAvailable } from "@/lib/server/booking-slot-validation";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { cloudUpsertAppointment } from "@/lib/server/appointments-cloud";
import { safeExternalNotify, withUnifiedCrm } from "@/lib/server/unified-calendar";
import type { Database, Appointment } from "@/lib/store";
import { formatLocalDateKey, parseDateKey } from "@/lib/date-key";
import { nextBookableDates } from "./client-services";

function shiftDate(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + days);
  const key = formatLocalDateKey(d);
  const bookable = nextBookableDates(30);
  if (bookable.includes(key)) return key;
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
    return formatLocalDateKey(d);
  }
  return key;
}

export async function rescheduleAppointment(
  aptId: string,
  days: number,
  userId?: string
): Promise<{ ok: boolean; apt?: Appointment; error?: string }> {
  const unified = await rescheduleUnified(aptId, days, userId);
  if (unified) return unified;
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return { ok: false };

  const db = structuredClone(snap.doc) as Database;
  const apt = db.appointments.find((a) => a.id === aptId);
  if (!apt) return { ok: false };
  if (userId && apt.userId !== userId) return { ok: false };

  const previous = {
    date: apt.date,
    time: apt.time,
    appointmentStatus: apt.appointmentStatus,
  };
  const nextDate = shiftDate(apt.date, days);
  const slotCheck = await assertBookingSlotAvailable({
    date: nextDate,
    time: apt.time,
    serviceIds: apt.serviceIds,
    excludeAptId: apt.id,
  });
  if (!slotCheck.ok) return { ok: false };
  apt.date = nextDate;
  handleAppointmentNotification(db, apt, "rescheduled", previous);
  const put = await cloudPutCrmStore(db);
  if (!put.ok) return { ok: false };
  const row = await cloudUpsertAppointment(apt);
  if (!row.ok) {
    console.warn("[telegram] reschedule appointments table sync failed", row.error);
  }
  return { ok: true, apt };
}

async function rescheduleUnified(aptId: string, days: number, userId?: string): Promise<{ ok: boolean; apt?: Appointment; error?: string } | null> {
  const outcome = await withUnifiedCrm(async (db) => {
    const apt = db.appointments.find((item) => item.id === aptId);
    if (!apt) return { abort: { error: "not_found", status: 404 } };
    if (userId && apt.userId !== userId) return { abort: { error: "forbidden", status: 403 } };
    const previous = { date: apt.date, time: apt.time, appointmentStatus: apt.appointmentStatus };
    const nextDate = shiftDate(apt.date, days);
    const taken = db.appointments.some((item) => item.id !== apt.id && item.date === nextDate && item.time === apt.time && item.appointmentStatus !== "cancelled" && !item.calendarHidden);
    if (taken) return { abort: { error: "slot_taken", status: 409, reason: "Время приезда уже занято." } };
    apt.date = nextDate;
    handleAppointmentNotification(db, apt, "rescheduled", previous);
    return { value: structuredClone(apt), eventKey: `reschedule:${apt.id}:${nextDate}:${apt.time}` };
  }, { notify: safeExternalNotify });
  if (!outcome.handled) return null;
  return outcome.ok ? { ok: true, apt: outcome.value } : { ok: false, error: outcome.reason ? `${outcome.error}: ${outcome.reason}` : outcome.error };
}
