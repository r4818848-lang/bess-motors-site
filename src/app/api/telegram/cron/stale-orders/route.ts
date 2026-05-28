import { NextRequest, NextResponse } from "next/server";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import { notifyAdminTelegram } from "@/lib/server/telegram-api";
import type { Database, WorkOrder } from "@/lib/store";

export const dynamic = "force-dynamic";

const ACTIVE = ["received", "diagnostic", "repair", "waitingParts"] as const;

function daysSince(iso: string): number {
  return Math.floor(
    (Date.now() - new Date(`${iso}T12:00:00`).getTime()) / (86400 * 1000)
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = cleanEnvValue(process.env.CRON_SECRET);
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const db = await loadCrmFromCloud();
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });

  const stale = db.workOrders.filter(
    (o) => ACTIVE.includes(o.status as (typeof ACTIVE)[number]) && daysSince(o.updatedAt) >= 5
  );

  if (stale.length) {
    const lines = stale.slice(0, 12).map((o: WorkOrder) => {
      const u = db.users.find((x) => x.id === o.userId);
      return `• ${o.number} — ${o.status} — ${daysSince(o.updatedAt)}d — ${u?.name ?? "—"}`;
    });
    await notifyAdminTelegram(
      ["⚠️ <b>Заказ-наряды без движения 5+ дней</b>", "", ...lines].join("\n")
    );
  }

  return NextResponse.json({ ok: true, stale: stale.length });
}
