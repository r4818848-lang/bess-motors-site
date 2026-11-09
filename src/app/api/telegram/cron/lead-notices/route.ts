import { NextResponse } from "next/server";
import { cronAuthorized, reminderDeliveryEnabled } from "@/lib/server/cron-auth";
import { tryClaimCronJob } from "@/lib/server/crm-cloud-mutate";
import { deliverPendingLeadNotices } from "@/lib/server/telegram-cron/lead-notifications";

export const dynamic = "force-dynamic";

/**
 * Retries lead notices that are still pending or whose send lease expired.
 * Appointment reminders also call the same function, but that run is skipped
 * while the other Vercel project holds the reminder lease. This route has its own lease.
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (!cronAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!reminderDeliveryEnabled()) {
    return NextResponse.json({ ok: true, delivery: "skipped" });
  }
  const claimed = await tryClaimCronJob("lead-notices", 4 * 60 * 1000);
  if (!claimed) {
    return NextResponse.json({ ok: true, delivery: "skipped", reason: "other_project" });
  }
  const delivered = await deliverPendingLeadNotices();
  return NextResponse.json({ ok: true, delivery: "live", delivered });
}
