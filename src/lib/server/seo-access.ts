import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";

export async function requireSeoAdmin(req: Request): Promise<{ sub: string } | { error: NextResponse }> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const session = await verifyToken(token);
  if (!session || session.role !== "admin") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { sub: session.sub };
}
