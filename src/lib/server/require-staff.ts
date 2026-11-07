import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";

export type StaffSession = {
  role: string;
  sub?: string;
  phone?: string;
};

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export async function requireStaff(
  req: Request,
  opts?: { adminOnly?: boolean }
): Promise<{ session: StaffSession } | { error: NextResponse }> {
  const token = bearerToken(req);
  if (!token) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const session = await verifyToken(token);
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (session.role !== "admin" && session.role !== "mechanic") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  if (opts?.adminOnly && session.role !== "admin") {
    return { error: NextResponse.json({ error: "admin_required" }, { status: 403 }) };
  }
  return {
    session: {
      role: session.role,
      sub: session.sub,
      phone: typeof session.phone === "string" ? session.phone : undefined,
    },
  };
}
