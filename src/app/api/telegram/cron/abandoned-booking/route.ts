import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized, reminderDeliveryEnabled } from "@/lib/server/cron-auth";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { runAbandonedBookingReminders } from "@/lib/server/telegram-cron/abandoned-booking";
import type { Database } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!cronAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!reminderDeliveryEnabled()) {
    return NextResponse.json({ ok: true, delivery: "skipped" });
  }

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });
  }

  const db = structuredClone(snap.doc) as Database;
  const sent = await runAbandonedBookingReminders(db);
  await cloudPutCrmStore(db);

  return NextResponse.json({ ok: true, sent });
}
