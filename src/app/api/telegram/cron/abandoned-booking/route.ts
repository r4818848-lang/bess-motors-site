import { NextRequest, NextResponse } from "next/server";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { runAbandonedBookingReminders } from "@/lib/server/telegram-cron/abandoned-booking";
import type { Database } from "@/lib/store";

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

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });
  }

  const db = structuredClone(snap.doc) as Database;
  const sent = await runAbandonedBookingReminders(db);
  await cloudPutCrmStore(db);

  return NextResponse.json({ ok: true, sent });
}
