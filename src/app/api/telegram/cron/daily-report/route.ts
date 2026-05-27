import { NextRequest, NextResponse } from "next/server";
import { computeCrmAnalytics } from "@/lib/crm-analytics";
import { getWebsiteHotOrders } from "@/lib/hot-orders";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import { formatTodaySummary } from "@/lib/server/telegram-bot/format";
import { notifyAdminTelegram } from "@/lib/server/telegram-api";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = cleanEnvValue(process.env.CRON_SECRET);
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const kind = req.nextUrl.searchParams.get("kind") ?? "morning";
  const db = await loadCrmFromCloud();
  if (!db) {
    return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const hot = getWebsiteHotOrders(db, () => "");
  const hotCount = hot.filter((r) => r.isActionRequired).length;
  const stats = computeCrmAnalytics(db, "day", "", "");

  let text: string;
  if (kind === "evening") {
    text = [
      "🌙 <b>Итоги дня</b>",
      "",
      formatTodaySummary(db),
      "",
      hotCount > 0 ? `⚠️ Горячих заявок без действия: <b>${hotCount}</b>` : "✅ Горячих заявок нет",
      stats.unpaidCount > 0
        ? `⏳ Неоплаченных заказ-нарядов: ${stats.unpaidCount} (${stats.unpaidTotal.toFixed(2)} zł)`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  } else {
    const aptsToday = db.appointments.filter((a) => a.date === today);
    text = [
      "☀️ <b>Доброе утро!</b>",
      "",
      `📅 Записей на сегодня: <b>${aptsToday.length}</b>`,
      `🔧 Активных заказ-нарядов: ${db.workOrders.filter((o) => o.status !== "delivered").length}`,
      hotCount > 0 ? `🔥 Требуют внимания: <b>${hotCount}</b> заявок с сайта` : "",
      stats.unpaidCount > 0 ? `⏳ Долги: ${stats.unpaidTotal.toFixed(2)} zł (${stats.unpaidCount})` : "",
      "",
      "Откройте /start для полного меню CRM.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const sent = await notifyAdminTelegram(text);
  return NextResponse.json({ ok: sent, kind });
}
