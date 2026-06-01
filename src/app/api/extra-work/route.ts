import { NextRequest, NextResponse } from "next/server";
import { resolveExtraWorkApproval } from "@/lib/server/telegram-bot/extra-work-approval";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { verifyToken } from "@/lib/server/verify-session";
import type { Database } from "@/lib/store";

export const dynamic = "force-dynamic";

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session || session.role !== "client") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: { orderId?: string; approved?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.orderId || typeof body.approved !== "boolean") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const db = snap.doc as Database;
  const order = db.workOrders.find((o) => o.id === body.orderId);
  if (!order || order.userId !== session.sub) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const result = await resolveExtraWorkApproval(body.orderId, body.approved);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
