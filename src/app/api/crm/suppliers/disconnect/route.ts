import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/server/require-staff";
import { disconnectSupplier } from "@/lib/server/suppliers/connect-service";
import type { SupplierId } from "@/lib/suppliers/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireStaff(req, { adminOnly: true });
  if ("error" in auth) return auth.error;

  let body: { supplierId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const supplierId = body.supplierId as SupplierId;
  if (!supplierId) {
    return NextResponse.json({ error: "supplierId_required" }, { status: 400 });
  }
  await disconnectSupplier(supplierId);
  return NextResponse.json({ ok: true });
}
