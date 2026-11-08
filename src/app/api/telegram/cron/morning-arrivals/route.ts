import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized, reminderDeliveryEnabled } from "@/lib/server/cron-auth";
import { tryClaimCronJob } from "@/lib/server/crm-cloud-mutate";
import { notifyAdminTelegram } from "@/lib/server/telegram-api";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import { formatMorningDigest, isMorningDigestHour, warsawTodayKey } from "@/lib/morning-digest";
import { releaseMorningDigest, reserveMorningDigest } from "@/lib/server/telegram-cron/appointment-reminders";

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

  const claimed = await tryClaimCronJob("morning-arrivals", 20 * 60 * 1000, now);
  if (!claimed) {
    return NextResponse.json({ ok: true, delivery: "skipped", reason: "other_project" });
  }

  const db = await loadCrmFromCloud();
  if (!db) return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });

  const today = warsawTodayKey(now);
  if (!(await reserveMorningDigest(today))) {
    return NextResponse.json({ ok: true, delivery: "already_sent", date: today });
  }
  const sent = await notifyAdminTelegram(formatMorningDigest(db, today));
  if (!sent) {
    await releaseMorningDigest(today);
    return NextResponse.json({ ok: false, error: "telegram_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, delivery: "live", date: today });
}
