import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized, reminderDeliveryEnabled } from "@/lib/server/cron-auth";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import { runCallEscalation } from "@/lib/server/telegram-cron/call-escalation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!cronAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!reminderDeliveryEnabled()) {
    return NextResponse.json({ ok: true, delivery: "skipped" });
  }
  const db = await loadCrmFromCloud();
  if (!db) return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });
  const escalated = await runCallEscalation(db);
  return NextResponse.json({ ok: true, escalated });
}
