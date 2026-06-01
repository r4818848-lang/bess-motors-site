import { NextResponse } from "next/server";
import { issueClientToken } from "@/lib/server/issue-client-token";
import { verifyToken } from "@/lib/server/verify-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

/** Fresh client JWT signed with server JWT_SECRET. */
export async function POST(req: Request) {
  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session || session.role !== "client") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const fresh = await issueClientToken(session.sub, session.phone ?? "");
  return NextResponse.json({ ok: true, token: fresh, userId: session.sub });
}
