import { SignJWT } from "jose";
import { siteConfig } from "@/lib/site";
import { normalizePhone } from "@/lib/server/normalize-phone";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(siteConfig.jwtSecret);
}

export async function issueClientToken(userId: string, phone: string): Promise<string> {
  const normalized = normalizePhone(phone);
  return new SignJWT({ role: "client" as const, phone: normalized })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(getSecret());
}
