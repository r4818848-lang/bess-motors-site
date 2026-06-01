import { jwtVerify } from "jose";
import { getJwtSecretBytes } from "@/lib/server/jwt-secret";

export type SessionRole = "admin" | "client" | "mechanic";

/** Server-only JWT verify (no localStorage / client store). */
export async function verifyToken(
  token: string
): Promise<{ sub: string; role: SessionRole; phone?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretBytes());
    const role = payload.role as SessionRole;
    if (role !== "admin" && role !== "client" && role !== "mechanic") return null;
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    const phone =
      typeof payload.phone === "string" && payload.phone ? payload.phone : undefined;
    return { sub, role, phone };
  } catch {
    return null;
  }
}
