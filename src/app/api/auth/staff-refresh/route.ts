import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { normalizePhone } from "@/lib/server/normalize-phone";
import { getJwtSecretBytes } from "@/lib/server/jwt-secret";
import { verifyToken } from "@/lib/server/verify-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

async function issueStaffToken(
  userId: string,
  role: "admin" | "mechanic",
  phone?: string
): Promise<string> {
  const claims: { role: "admin" | "mechanic"; phone?: string } = { role };
  if (phone) claims.phone = normalizePhone(phone);
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecretBytes());
}

/** Issue a fresh staff JWT signed with server JWT_SECRET (fixes client-side token drift). */
export async function POST(req: Request) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session || (session.role !== "admin" && session.role !== "mechanic")) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let userId = session.sub;
  if (session.role === "admin" && userId === "admin") {
    userId = "admin-1";
  }

  const fresh = await issueStaffToken(userId, session.role, session.phone);
  return NextResponse.json({ ok: true, token: fresh, userId, role: session.role });
}
