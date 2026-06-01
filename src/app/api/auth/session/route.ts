import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

/** Validate JWT on server (client cannot read JWT_SECRET). */
export async function GET(req: Request) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  let sub = session.sub;
  if (session.role === "admin" && sub === "admin") {
    sub = "admin-1";
  }

  return NextResponse.json({
    ok: true,
    sub,
    role: session.role,
    phone: session.phone,
  });
}
