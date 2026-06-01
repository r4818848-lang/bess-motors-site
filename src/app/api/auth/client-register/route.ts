import { NextResponse } from "next/server";
import { ensureClientForSign, sliceForClient } from "@/lib/client-sign";
import { normalizePhone, normalizePlateKey } from "@/lib/server/normalize-phone";
import { cloudGetCrmStore, cloudPutCrmStore, isSupabaseConfigured } from "@/lib/server/crm-cloud";
import { issueClientToken } from "@/lib/server/issue-client-token";
import type { Database } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function adminPhoneBlocked(normalized: string): boolean {
  const admin = process.env.ADMIN_PHONE?.trim();
  if (!admin) return false;
  return normalizePhone(admin) === normalized;
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "cloud_disabled" }, { status: 503 });
  }

  let body: { phone?: string; plate?: string };
  try {
    body = (await req.json()) as { phone?: string; plate?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const phone = body.phone?.trim() ?? "";
  const plate = body.plate?.trim() ?? "";
  const normalized = normalizePhone(phone);
  const plateKey = normalizePlateKey(plate);
  if (!normalized || plateKey.length < 2) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  if (adminPhoneBlocked(normalized)) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 403 });
  }

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });
  }

  const db = structuredClone(snap.doc) as Database;
  const exists = db.users.some(
    (u) => u.role === "client" && normalizePhone(u.phone) === normalized
  );
  if (exists) {
    return NextResponse.json({ ok: false, error: "phone_exists" }, { status: 409 });
  }

  const plateTaken = db.vehicles.some((v) => normalizePlateKey(v.plate) === plateKey);
  if (plateTaken) {
    return NextResponse.json({ ok: false, error: "phone_exists" }, { status: 409 });
  }

  try {
    const { user } = await ensureClientForSign(db, phone, plate, null);
    const put = await cloudPutCrmStore(db);
    if (!put.ok) {
      return NextResponse.json(
        { ok: false, error: put.error ?? "cloud_error" },
        { status: 502 }
      );
    }

    const portal = sliceForClient(db, user.id);
    if (!portal) {
      return NextResponse.json({ ok: false, error: "cloud_error" }, { status: 502 });
    }

    const token = await issueClientToken(user.id, user.phone);
    return NextResponse.json({
      ok: true,
      token,
      portal,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
}
