import { commitStaffAppointment } from "@/lib/server/staff-calendar-commit";
import { assertBookingSlotAvailable } from "@/lib/server/booking-slot-validation";
import { normalizePhone } from "@/lib/auth";

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
  requestId?: string;
  serviceId?: string;
  workStart?: string;
  workMinutes?: number;
  pickupDate?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const slotCheck = await assertBookingSlotAvailable({ ...params, serviceIds:[params.serviceId || "diagnostic"] });
  if (!slotCheck.ok) return {ok:false,error:slotCheck.error};
  const result = await commitStaffAppointment({mode:"create",clientRequestId:params.requestId,
    date:params.date,time:params.time,clientName:params.clientName?.trim() || "Klient Telegram",
    clientPhone:params.phone,serviceIds:[params.serviceId || "diagnostic"],comment:params.comment,
    workStart:params.workStart,workMinutes:params.workMinutes,pickupDate:params.pickupDate
  },new Date(),false);
  return result.ok ? {ok:true,id:result.appointment.id} : {ok:false,error:result.error};
}
