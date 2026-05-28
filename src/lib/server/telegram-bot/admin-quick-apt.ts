import { normalizePhone } from "@/lib/auth";
import { handleAppointmentNotification } from "@/lib/client-notifications";
import { ensureClientForBooking } from "@/lib/create-work-order-from-booking";
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
}): Promise<{ ok: boolean; id?: string; error?: string }> {
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
    return apt.id;
  });

  return result.ok
    ? { ok: true, id: result.result }
    : { ok: false, error: result.error };
}
