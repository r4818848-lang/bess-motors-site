import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/server/require-staff";
import { connectSupplier } from "@/lib/server/suppliers/connect-service";
import type { SupplierId } from "@/lib/suppliers/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const IDS = new Set<SupplierId>([
  "inter_cars",
  "auto_partner",
  "hart",
  "motowarsztat",
]);

/** POST — save credentials + real authenticate. Admin only. Password never echoed. */
export async function POST(req: Request) {
  const auth = await requireStaff(req, { adminOnly: true });
  if ("error" in auth) return auth.error;

  let body: {
    supplierId?: string;
    login?: string;
    password?: string;
    extra?: Record<string, string>;
    environment?: "sandbox" | "production";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const supplierId = body.supplierId as SupplierId;
  if (!IDS.has(supplierId)) {
    return NextResponse.json({ error: "unknown_supplier" }, { status: 400 });
  }
  const login = body.login?.trim() || "";
  const password = body.password || "";
  if (!login || !password) {
    return NextResponse.json({ error: "login_password_required" }, { status: 400 });
  }

  try {
    const connection = await connectSupplier(
      supplierId,
      { login, password, extra: body.extra },
      body.environment
    );
    return NextResponse.json({ connection });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === "secrets_key_missing" ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
