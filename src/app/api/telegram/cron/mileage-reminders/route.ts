import { NextRequest, NextResponse } from "next/server";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import { runMileageReminders } from "@/lib/server/telegram-cron/mileage-reminders";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = cleanEnvValue(process.env.CRON_SECRET);
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const db = await loadCrmFromCloud();
  if (!db) return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });
  const sent = await runMileageReminders(db);
  return NextResponse.json({ ok: true, sent });
}
