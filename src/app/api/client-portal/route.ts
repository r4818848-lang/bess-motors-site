import { NextResponse } from "next/server";
import {
  cloudChangeClientPassword,
  cloudGetClientPortal,
} from "@/lib/server/client-portal-cloud";
import { verifyToken } from "@/lib/server/verify-session";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";
import { normalizePlateKey } from "@/lib/server/normalize-phone";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import type { Database, Vehicle } from "@/lib/store";

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

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const action = (body as { action?: unknown } | null)?.action;
  if (typeof action !== "string") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "cloud_disabled" }, { status: 503 });
  }

  if (action === "change-password") {
    const b = body as ChangePasswordBody;
    const newKey = normalizePlateKey(b.newPlate ?? "");
    const confirmKey = normalizePlateKey(b.confirmPlate ?? "");
    if (!newKey || newKey !== confirmKey) {
      return NextResponse.json({ ok: false, error: "password_mismatch" }, { status: 400 });
    }

    const result = await cloudChangeClientPassword(
      session.sub,
      b.currentPlate ?? "",
      b.newPlate ?? ""
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

  if (action === "upsert-vehicle") {
    const b = body as { action: "upsert-vehicle"; vehicle?: Vehicle };
    const v = b.vehicle;
    if (!v || typeof v !== "object") {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }

    const vin = String(v.vin ?? "").replace(/\s/g, "").toUpperCase();
    if (vin.length !== 17) {
      return NextResponse.json({ ok: false, error: "vin_invalid" }, { status: 400 });
    }

    const plate = String(v.plate ?? "").trim();
    if (!plate) {
      return NextResponse.json({ ok: false, error: "plate_required" }, { status: 400 });
    }

    const snap = await cloudGetCrmStore();
    if (!snap?.doc) {
      return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });
    }

    const db = snap.doc as Database;
    const userId = session.sub;

    const incoming: Vehicle = {
      ...v,
      id: v.id?.trim() || `v-${Date.now()}`,
      userId,
      vin,
      plate,
      mileage: Number(v.mileage) || 0,
      make: String(v.make ?? "").trim(),
      model: String(v.model ?? "").trim(),
      engine: String(v.engine ?? "").trim(),
      trim: String(v.trim ?? "").trim(),
      power: String(v.power ?? "").trim(),
      transmission: String(v.transmission ?? "").trim(),
    } as Vehicle;

    const idx = db.vehicles.findIndex((x) => x.id === incoming.id);
    if (idx >= 0) {
      if (db.vehicles[idx].userId !== userId) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
      db.vehicles[idx] = { ...db.vehicles[idx], ...incoming };
    } else {
      db.vehicles.push(incoming);
    }

    const put = await cloudPutCrmStore(db);
    if (!put.ok) {
      return NextResponse.json({ ok: false, error: put.error ?? "cloud_error" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, vehicleId: incoming.id });
  }

  return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
}
