import { addDays } from "date-fns";
import { formatWarsawDateKey, parseDateKey } from "@/lib/date-key";
import { timeSlots } from "@/lib/data";
import { BOOKING_HORIZON_DAYS } from "@/lib/booking-horizon";
import { isSlotBlocked } from "@/lib/booking-slots";
import type { Appointment, AppSettings, Database } from "@/lib/store";
import { cloudListAppointmentsForAdmin } from "./appointments-cloud";
import { cloudGetCrmStore } from "./crm-cloud";

const DEFAULT_SETTINGS: AppSettings = {
  defaultLaborPercent: 50,
  defaultPartsPercent: 50,
  vatRate: 23,
  vatEnabledByDefault: true,
  lunchBreakStart: "13:00",
  lunchBreakEnd: "14:00",
};

function isValidDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(parseDateKey(key).getTime());
}

function addBusySlot(busy: Set<string>, apt: Appointment, excludeAptId?: string): void {
  if (apt.appointmentStatus === "cancelled") return;
  if (excludeAptId && apt.id === excludeAptId) return;
  if (!apt.date || !apt.time) return;
  busy.add(`${apt.date}|${apt.time}`);
}

export async function collectBusyBookingSlots(excludeAptId?: string): Promise<Set<string>> {
  const busy = new Set<string>();

  try {
    const appointments = await cloudListAppointmentsForAdmin();
    for (const apt of appointments) addBusySlot(busy, apt, excludeAptId);
  } catch {
    /* appointments table optional */
  }

  const crm = await cloudGetCrmStore();
  if (crm?.doc) {
    for (const apt of (crm.doc as Database).appointments ?? []) {
      addBusySlot(busy, apt, excludeAptId);
    }
  }

  return busy;
}

export async function assertBookingSlotAvailable(params: {
  date: string;
  time: string;
  excludeAptId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { date, time, excludeAptId } = params;

  if (!isValidDateKey(date)) return { ok: false, error: "invalid_date" };
  if (!timeSlots.includes(time)) return { ok: false, error: "invalid_time" };

  const day = parseDateKey(date);
  if (day.getDay() === 0) return { ok: false, error: "closed_sunday" };

  const today = parseDateKey(formatWarsawDateKey());
  const maxDay = addDays(today, BOOKING_HORIZON_DAYS);
  if (day < today || day > maxDay) return { ok: false, error: "date_out_of_range" };

  let settings = DEFAULT_SETTINGS;
  const crm = await cloudGetCrmStore();
  if (crm?.doc) {
    settings = { ...settings, ...(crm.doc as Database).settings };
  }
  if (isSlotBlocked(settings, date, time)) return { ok: false, error: "slot_blocked" };

  const busy = await collectBusyBookingSlots(excludeAptId);
  if (busy.has(`${date}|${time}`)) return { ok: false, error: "slot_taken" };

  return { ok: true };
}
