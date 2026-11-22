import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized, reminderDeliveryEnabled, staffCalendarMutationsEnabled } from "@/lib/server/cron-auth";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import { tryClaimCronJob } from "@/lib/server/crm-cloud-mutate";
import { runAppointmentReminders } from "@/lib/server/telegram-cron/appointment-reminders";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!cronAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (process.env.BESS_ICLOUD_APP_PASSWORD && staffCalendarMutationsEnabled()) {
    after(async () => {
      const {syncICloud,exchangeErrorCode}=await import("@/lib/server/icloud-calendar");
      try { console.info("[icloud] sync",await syncICloud()); }
      catch (error) { console.error("[icloud]",exchangeErrorCode(error)); }
    });
  }

  if (!reminderDeliveryEnabled()) {
    return NextResponse.json({ ok: true, delivery: "skipped" });
  }

  const db = await loadCrmFromCloud();
  if (!db) {
    return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });
  }

  const claimed = await tryClaimCronJob("appointment-reminders", 4 * 60 * 1000);
  if (!claimed) {
    return NextResponse.json({ ok: true, delivery: "skipped", reason: "other_project" });
  }

  const stats = await runAppointmentReminders(db);
  return NextResponse.json({ ok: true, delivery: "live", ...stats });
}
