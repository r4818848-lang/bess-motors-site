import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { sendTelegramMessage } from "@/lib/server/telegram-api";

export const dynamic = "force-dynamic";

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = bearerToken(req);
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const session = await verifyToken(token);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { text?: string };
  const text = body.text?.trim();
  if (!text || text.length < 3) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const snap = await cloudGetCrmStore();
  const db = snap?.doc;
  if (!db) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const now = Date.now();
  let sent = 0;
  for (const u of db.users) {
    if (u.role !== "client" || !u.telegramChatId) continue;
    if (u.botMuteUntil && new Date(u.botMuteUntil).getTime() > now) continue;
    if (u.botNotifyPrefs?.promo === false) continue;
    const msgId = await sendTelegramMessage(
      u.telegramChatId,
      `📢 <b>BESS MOTORS</b>\n\n${text.slice(0, 3500)}`
    );
    if (msgId != null) sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
