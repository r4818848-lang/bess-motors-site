import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized, reminderDeliveryEnabled } from "@/lib/server/cron-auth";
import { cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { notifyAdminTelegram } from "@/lib/server/telegram-api";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import {
  formatMorningDigest,
  isMorningDigestHour,
  morningDigestAlreadySent,
  warsawTodayKey,
} from "@/lib/morning-digest";

export const dynamic = "force-dynamic";

/** 06:00 and 07:00 UTC. Sends only when Europe/Warsaw is 08:00, once per local date. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!cronAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!reminderDeliveryEnabled()) {
    return NextResponse.json({ ok: true, delivery: "skipped" });
  }

  const now = new Date();
  if (!isMorningDigestHour(now)) {
    return NextResponse.json({ ok: true, delivery: "skipped", reason: "not_0800_warsaw" });
  }

  const db = await loadCrmFromCloud();
  if (!db) return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });

  const today = warsawTodayKey(now);
  if (morningDigestAlreadySent(db, today)) {
    return NextResponse.json({ ok: true, delivery: "already_sent", date: today });
  }

  db.settings.morningDigestDate = today;
  await cloudPutCrmStore(db);
  const sent = await notifyAdminTelegram(formatMorningDigest(db, today));
  if (!sent) {
    db.settings.morningDigestDate = undefined;
    await cloudPutCrmStore(db);
    return NextResponse.json({ ok: false, error: "telegram_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, delivery: "live", date: today });
}
