import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import {
  sendMasterTemplateToClient,
  type MasterTemplate,
} from "@/lib/server/telegram-bot/admin-client-notify";
import { notifyTelegramSignByPhone } from "@/lib/server/telegram-bot/client-telegram-notify";
import { sendTelegramMessage } from "@/lib/server/telegram-api";
import type { Database } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TEMPLATES = new Set<MasterTemplate>([
  "ready",
  "parts",
  "diagnostic",
  "callme",
  "prepay",
  "delay",
  "partsArrived",
  "pickup",
]);

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

async function requireAdmin(req: Request) {
  const token = bearerToken(req);
  if (!token) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const session = await verifyToken(token);
  if (!session || session.role !== "admin") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if ("error" in auth && auth.error) return auth.error;

  let body: {
    orderNumber?: string;
    action?: "template" | "sign_remind" | "custom";
    template?: string;
    message?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const orderNumber = body.orderNumber?.trim();
  const action = body.action;
  if (!orderNumber || !action) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ ok: false, message: "cloud_empty" }, { status: 503 });
  }
  const db = snap.doc as Database;
  const order = db.workOrders.find((o) => o.number === orderNumber);
  if (!order) {
    return NextResponse.json({ ok: false, message: "order_not_found" }, { status: 404 });
  }

  if (action === "template") {
    const tpl = body.template as MasterTemplate;
    if (!tpl || !TEMPLATES.has(tpl)) {
      return NextResponse.json({ error: "invalid_template" }, { status: 400 });
    }
    const result = await sendMasterTemplateToClient(db, orderNumber, tpl);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  if (action === "sign_remind") {
    const user = db.users.find((u) => u.id === order.userId && u.role === "client");
    if (!user?.telegramChatId) {
      return NextResponse.json({
        ok: false,
        message: "no_telegram",
      });
    }
    await notifyTelegramSignByPhone(db, order);
    return NextResponse.json({ ok: true, message: "sent" });
  }

  if (action === "custom") {
    const text = body.message?.trim();
    if (!text || text.length < 2) {
      return NextResponse.json({ error: "empty_message" }, { status: 400 });
    }
    const user = db.users.find((u) => u.id === order.userId && u.role === "client");
    if (!user?.telegramChatId) {
      return NextResponse.json({ ok: false, message: "no_telegram" });
    }
    const sent = await sendTelegramMessage(
      user.telegramChatId,
      `📨 <b>BESS MOTORS</b>\n\n${text}`
    );
    return NextResponse.json({
      ok: Boolean(sent),
      message: sent ? "sent" : "send_failed",
    });
  }

  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
