import { NextResponse } from "next/server";
import { addDays, format, startOfDay } from "date-fns";
import { timeSlots } from "@/lib/data";
import {
  cloudListAppointmentsForAdmin,
  isCloudAppointmentsEnabled,
} from "@/lib/server/appointments-cloud";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public: busy slots only (no client data). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.min(14, Math.max(1, Number(url.searchParams.get("days") || 7)));

  const slots: { date: string; time: string; available: boolean }[] = [];
  const busy = new Set<string>();

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
      slots.push({ date: dateStr, time, available: !busy.has(key) });
    }
  }

  const available = slots.filter((s) => s.available).slice(0, 12);

  return NextResponse.json({
    slots,
    available,
    cloud: isCloudAppointmentsEnabled(),
  });
}
