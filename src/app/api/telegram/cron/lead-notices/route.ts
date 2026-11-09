import { NextResponse } from "next/server";
import { cronAuthorized, leadNoticeDeliveryEnabled } from "@/lib/server/cron-auth";
import { tryClaimCronJob } from "@/lib/server/crm-cloud-mutate";
import { deliverPendingLeadNotices } from "@/lib/server/telegram-cron/lead-notifications";

export const dynamic = "force-dynamic";

/**
 * Retries lead notices that are still pending or whose send lease expired.
 * Appointment reminders also call the same function when lead-notice delivery is on.
 * LEAD_NOTICE_DELIVERY=disabled stops only this retry. This route has its own lease.
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (!cronAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!leadNoticeDeliveryEnabled()) {
    return NextResponse.json({ ok: true, delivery: "skipped" });
  }
  const claimed = await tryClaimCronJob("lead-notices", 4 * 60 * 1000);
  if (!claimed) {
    return NextResponse.json({ ok: true, delivery: "skipped", reason: "other_project" });
  }
  const delivered = await deliverPendingLeadNotices();
  return NextResponse.json({ ok: true, delivery: "live", delivered });
}
