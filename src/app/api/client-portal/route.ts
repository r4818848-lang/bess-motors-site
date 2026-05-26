import { NextResponse } from "next/server";
import {
  cloudChangeClientPassword,
  cloudGetClientPortal,
} from "@/lib/server/client-portal-cloud";
import { verifyToken } from "@/lib/server/verify-session";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";
import { normalizePlateKey } from "@/lib/server/normalize-phone";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export async function GET(req: Request) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session || session.role !== "client") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "cloud_disabled" }, { status: 503 });
  }

  const portal = await cloudGetClientPortal(session.sub);
  if (!portal) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, portal });
}

type ChangePasswordBody = {
  action: "change-password";
  currentPlate: string;
  newPlate: string;
  confirmPlate: string;
};

export async function POST(req: Request) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session || session.role !== "client") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: ChangePasswordBody;
  try {
    body = (await req.json()) as ChangePasswordBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (body.action !== "change-password") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const newKey = normalizePlateKey(body.newPlate ?? "");
  const confirmKey = normalizePlateKey(body.confirmPlate ?? "");
  if (!newKey || newKey !== confirmKey) {
    return NextResponse.json({ ok: false, error: "password_mismatch" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "cloud_disabled" }, { status: 503 });
  }

  const result = await cloudChangeClientPassword(
    session.sub,
    body.currentPlate ?? "",
    body.newPlate ?? ""
  );

  if (result === "ok") {
    return NextResponse.json({ ok: true });
  }
  if (result === "invalid_current") {
    return NextResponse.json({ ok: false, error: "invalid_current" }, { status: 403 });
  }
  if (result === "invalid_new") {
    return NextResponse.json({ ok: false, error: "invalid_new" }, { status: 400 });
  }

  return NextResponse.json({ ok: false, error: "cloud_error" }, { status: 502 });
}
