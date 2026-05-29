import { NextResponse } from "next/server";
import { sanitizeProductionDb } from "@/lib/store";
import { cloudGetCrmStore, cloudPutCrmStore, isSupabaseConfigured } from "@/lib/server/crm-cloud";
import { cleanEnvValue } from "@/lib/server/supabase-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** One-time: GET /api/crm-db/sanitize?key=CRM_SANITIZE_KEY (or TELEGRAM_SETUP_KEY) */
export async function GET(req: Request) {
  const sanitizeKey =
    cleanEnvValue(process.env.CRM_SANITIZE_KEY) ||
    cleanEnvValue(process.env.TELEGRAM_SETUP_KEY);
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!sanitizeKey || key !== sanitizeKey) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "cloud_disabled" }, { status: 503 });
  }

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ error: "no_data" }, { status: 404 });
  }

  const clientsBefore = snap.doc.users.filter((u) => u.role === "client").length;
  const whBefore = snap.doc.warehouse.length;
  const next = sanitizeProductionDb(snap.doc);
  next.currentUserId = null;

  const result = await cloudPutCrmStore(next);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    clientsRemoved: clientsBefore,
    warehouseCleared: whBefore,
    usersLeft: next.users.length,
    admins: next.users.filter((u) => u.role === "admin").map((u) => ({ id: u.id, phone: u.phone })),
    updatedAt: result.updatedAt,
  });
}
