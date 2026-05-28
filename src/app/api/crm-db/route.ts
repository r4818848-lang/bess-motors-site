import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import type { Database } from "@/lib/store";
import { cloudGetCrmStore, cloudPutCrmStore, isSupabaseConfigured } from "@/lib/server/crm-cloud";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

async function requireStaffSession(req: Request, write = false) {
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ error: "cloud_disabled" }, { status: 503 }) };
  }
  const token = bearerToken(req);
  if (!token) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const session = await verifyToken(token);
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (write) {
    if (session.role !== "admin" && session.role !== "mechanic") {
      return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
    }
  } else if (session.role !== "admin" && session.role !== "mechanic") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}

/** Strip per-device session before cloud storage */
function docForCloud(db: Database): Database {
  return { ...db, currentUserId: null };
}

export async function GET(req: Request) {
  const auth = await requireStaffSession(req);
  if ("error" in auth && auth.error) return auth.error;

  const snapshot = await cloudGetCrmStore();
  if (!snapshot) {
    return NextResponse.json({ cloud: true, db: null, updatedAt: null });
  }
  return NextResponse.json({
    cloud: true,
    db: snapshot.doc,
    updatedAt: snapshot.updatedAt,
  });
}

export async function PUT(req: Request) {
  const auth = await requireStaffSession(req, true);
  if ("error" in auth && auth.error) return auth.error;

  let db: Database;
  try {
    db = (await req.json()) as Database;
    if (!db || typeof db !== "object") {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const before = await cloudGetCrmStore();
  const payload = docForCloud(db);
  const { runCrmAutomation } = await import("@/lib/crm-automation");
  runCrmAutomation(payload, before?.doc ?? null);
  const result = await cloudPutCrmStore(payload);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.error === "cloud_disabled" ? 503 : 502 }
    );
  }

  if (before?.doc) {
    const { dispatchTelegramFromCrmSave } = await import(
      "@/lib/server/telegram-bot/client-telegram-notify"
    );
    void dispatchTelegramFromCrmSave(before.doc, payload);
    const { dispatchWebPushFromCrmSave } = await import("@/lib/web-push-order-events");
    void dispatchWebPushFromCrmSave(before.doc, payload);
  }

  return NextResponse.json({ ok: true, updatedAt: result.updatedAt });
}
