import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { workshopHours } from "@/lib/businessConfig";
import { formatWarsawDateKey, parseDateKey } from "@/lib/date-key";
import { isCloudAppointmentsEnabled } from "@/lib/server/appointments-cloud";
import { collectBusyBookingSlots } from "@/lib/server/booking-slot-validation";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { BOOKING_HORIZON_DAYS } from "@/lib/booking-horizon";
import { isSlotBlocked } from "@/lib/booking-slots";
import { bookingStartTimes, resolveBookingDurationMinutes } from "@/lib/workshop-schedule";
import type { AppSettings, Database } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public: busy slots only (no client data). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.min(
    BOOKING_HORIZON_DAYS,
    Math.max(1, Number(url.searchParams.get("days") || 14))
  );
  const durationRaw = url.searchParams.get("duration");
  const durationMinutes = resolveBookingDurationMinutes({
    durationMinutes: durationRaw ? Number(durationRaw) : undefined,
    serviceIds: url.searchParams.get("services")?.split(",").filter(Boolean),
  });
  const now = new Date();

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
    const busySlots = await collectBusyBookingSlots();
    for (const key of busySlots) busy.add(key);
  }

  const today = parseDateKey(formatWarsawDateKey(now));
  const hours = workshopHours();
  for (let d = 0; d < days; d++) {
    const day = addDays(today, d);
    const dateStr = formatWarsawDateKey(day);
    const times = bookingStartTimes(dateStr, hours, durationMinutes, now);
    for (const time of times) {
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
