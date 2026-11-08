import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized, reminderDeliveryEnabled } from "@/lib/server/cron-auth";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import { runInactiveClientsReport } from "@/lib/server/telegram-cron/inactive-clients";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!cronAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!reminderDeliveryEnabled()) {
    return NextResponse.json({ ok: true, delivery: "skipped" });
  }

  const db = await loadCrmFromCloud();
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });

  const { count } = await runInactiveClientsReport(db);
  return NextResponse.json({ ok: true, count });
}
