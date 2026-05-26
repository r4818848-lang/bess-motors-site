import { jwtVerify } from "jose";
import { siteConfig } from "@/lib/site";

export type SessionRole = "admin" | "client";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(siteConfig.jwtSecret);
}

/** Server-only JWT verify (no localStorage / client store). */
export async function verifyToken(
  token: string
): Promise<{ sub: string; role: SessionRole; phone?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role as SessionRole;
    if (role !== "admin" && role !== "client") return null;
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    const phone =
      typeof payload.phone === "string" && payload.phone ? payload.phone : undefined;
    return { sub, role, phone };
  } catch {
    return null;
  }
}
