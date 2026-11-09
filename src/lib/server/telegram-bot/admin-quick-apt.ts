import { evaluateArrivalTime } from "@/lib/arrival-window";
import { normalizePhone } from "@/lib/auth";
import { handleAppointmentNotification } from "@/lib/client-notifications";
import { ensureClientForBooking } from "@/lib/create-work-order-from-booking";
import { assertBookingSlotAvailable } from "@/lib/server/booking-slot-validation";
import { cloudUpsertAppointment } from "@/lib/server/appointments-cloud";
import { safeExternalNotify, withUnifiedCrm } from "@/lib/server/unified-calendar";
import { mutateCrm } from "./crm-actions";
import type { Appointment } from "@/lib/store";

/** phone | YYYY-MM-DD | HH:MM | optional comment */
export function parseQuickAptLine(text: string): {
  ok: boolean;
  phone?: string;
  date?: string;
  time?: string;
  comment?: string;
} {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 3) return { ok: false };

  const phone = normalizePhone(parts[0]);
  const date = parts[1];
  const time = parts[2].includes(":") ? parts[2] : `${parts[2].slice(0, 2)}:${parts[2].slice(2)}`;
  const comment = parts.slice(3).join(" ");

  if (!phone || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false };
  if (!/^\d{1,2}:\d{2}$/.test(time)) return { ok: false };

  return { ok: true, phone, date, time, comment: comment || "Запись из Telegram CRM" };
}

export async function createQuickAppointment(params: {
  phone: string;
  date: string;
  time: string;
  comment: string;
  clientName?: string;
  serviceId?: string;
  workStart?: string;
  workMinutes?: number;
  pickupDate?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const unified = await createQuickAppointmentUnified(params);
  if (unified) return unified;
  const slotCheck = await assertBookingSlotAvailable({
    date: params.date,
    time: params.time,
    serviceIds: ["diagnostic"],
  });
  if (!slotCheck.ok) return { ok: false, error: slotCheck.error };

  let created: Appointment | null = null;
  const result = await mutateCrm((db) => {
    const name = params.clientName?.trim() || "Klient Telegram";
    const { userId, vehicleId } = ensureClientForBooking(db, name, params.phone);
    const apt: Appointment = {
      id: `apt-q-${Date.now()}`,
      userId,
      vehicleId,
      serviceIds: ["diagnostic"],
      date: params.date,
      time: params.time,
      mechanicId: db.mechanics[0]?.id ?? "mech-1",
      repairStatus: "received",
      appointmentStatus: "scheduled",
      comment: params.comment,
      clientName: name,
      clientPhone: params.phone,
      source: "telegram",
      createdAt: new Date().toISOString(),
    };
    db.appointments.push(apt);
    handleAppointmentNotification(db, apt, "scheduled");
    created = apt;
    return apt.id;
  });

  if (result.ok && created) {
    const row = await cloudUpsertAppointment(created);
    if (!row.ok) {
      console.warn("[telegram] quick apt appointments table sync failed", row.error);
    }
  }

  return result.ok
    ? { ok: true, id: result.result }
    : { ok: false, error: result.error };
}

async function createQuickAppointmentUnified(params: {
  phone: string;
  date: string;
  time: string;
  comment: string;
  clientName?: string;
  serviceId?: string;
  workStart?: string;
  workMinutes?: number;
  pickupDate?: string;
}): Promise<{ ok: boolean; id?: string; error?: string } | null> {
  const aptId = `apt-q-${Date.now()}`;
  const outcome = await withUnifiedCrm(async (db) => {
    const arrival = evaluateArrivalTime({ date: params.date, time: params.time });
    if (!arrival.ok) return { abort: { error: arrival.error, status: 400 } };
    const name = params.clientName?.trim() || "Klient Telegram";
    const { userId, vehicleId } = ensureClientForBooking(db, name, params.phone);
    const apt: Appointment = {
      id: aptId,
      userId,
      vehicleId,
      serviceIds: [params.serviceId || "diagnostic"],
      date: params.date,
      time: params.time,
      workStart: params.workStart,
      workMinutes: params.workMinutes,
      pickupDate: params.pickupDate,
      mechanicId: db.mechanics[0]?.id ?? "mech-1",
      repairStatus: "received",
      appointmentStatus: "scheduled",
      comment: params.comment,
      clientName: name,
      clientPhone: params.phone,
      source: "telegram",
      createdAt: new Date().toISOString(),
    };
    db.appointments.push(apt);
    handleAppointmentNotification(db, apt, "scheduled");
    return { value: apt.id, eventKey: `quick:${apt.id}` };
  }, { notify: safeExternalNotify });
  if (!outcome.handled) return null;
  return outcome.ok ? { ok: true, id: outcome.value } : { ok: false, error: outcome.reason ? `${outcome.error}: ${outcome.reason}` : outcome.error };
}
