import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { formatWarsawDateKey, parseDateKey } from "@/lib/date-key";
import { isCloudAppointmentsEnabled } from "@/lib/server/appointments-cloud";
import { arrivalTimes } from "@/lib/arrival-window";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { BOOKING_HORIZON_DAYS } from "@/lib/booking-horizon";
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
  const now = new Date();

  const slots: { date: string; time: string; available: boolean }[] = [];

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

  const today = parseDateKey(formatWarsawDateKey(now));
  const blocked = new Set(settings.blockedBookingSlots ?? []);
  for (let d = 0; d < days; d++) {
    const day = addDays(today, d);
    const dateStr = formatWarsawDateKey(day);
    for (const time of arrivalTimes(dateStr, now)) {
      slots.push({
        date: dateStr,
        time,
        available: !blocked.has(`${dateStr}|${time}`),
      });
    }
  }

  const available = slots.filter((s) => s.available).slice(0, 12);

  return NextResponse.json({
    slots,
    available,
    cloud: isCloudAppointmentsEnabled(),
  });
}
