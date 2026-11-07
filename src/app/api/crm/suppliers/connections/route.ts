import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/server/require-staff";
import { listSupplierConnections } from "@/lib/server/suppliers/connect-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — public connection status (never returns passwords). Admin or mechanic. */
export async function GET(req: Request) {
  const auth = await requireStaff(req);
  if ("error" in auth) return auth.error;
  try {
    const connections = await listSupplierConnections();
    return NextResponse.json({ connections });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
