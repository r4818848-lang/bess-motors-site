import { NextResponse } from "next/server";
import { addDays, format, startOfDay } from "date-fns";
import { timeSlots } from "@/lib/data";
import {
  cloudListAppointmentsForAdmin,
  isCloudAppointmentsEnabled,
} from "@/lib/server/appointments-cloud";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { isSlotBlocked } from "@/lib/booking-slots";
import type { AppSettings, Database } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public: busy slots only (no client data). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.min(14, Math.max(1, Number(url.searchParams.get("days") || 7)));

  const slots: { date: string; time: string; available: boolean }[] = [];
  const busy = new Set<string>();

  let settings: AppSettings = {
    defaultLaborPercent: 50,
    defaultPartsPercent: 50,
    vatRate: 23,
    vatEnabledByDefault: true,
    lunchBreakStart: "13:00",
    lunchBreakEnd: "14:00",
  };
  const crmSnap = await cloudGetCrmStore();
  if (crmSnap?.doc) {
    settings = { ...settings, ...(crmSnap.doc as Database).settings };
  }

  if (isCloudAppointmentsEnabled()) {
    const appointments = await cloudListAppointmentsForAdmin();
    for (const apt of appointments) {
      if (apt.appointmentStatus === "cancelled") continue;
      busy.add(`${apt.date}|${apt.time}`);
    }
  }

  const today = startOfDay(new Date());
  for (let d = 0; d < days; d++) {
    const day = addDays(today, d);
    const dateStr = format(day, "yyyy-MM-dd");
    const dow = day.getDay();
    if (dow === 0) continue; // Sunday closed

    for (const time of timeSlots) {
      const key = `${dateStr}|${time}`;
      const blocked = isSlotBlocked(settings, dateStr, time);
      slots.push({ date: dateStr, time, available: !busy.has(key) && !blocked });
    }
  }

  const available = slots.filter((s) => s.available).slice(0, 12);

  return NextResponse.json({
    slots,
    available,
    cloud: isCloudAppointmentsEnabled(),
  });
}
