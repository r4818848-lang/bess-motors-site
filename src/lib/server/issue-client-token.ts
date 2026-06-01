import { SignJWT } from "jose";
import { normalizePhone } from "@/lib/server/normalize-phone";
import { getJwtSecretBytes } from "@/lib/server/jwt-secret";

export async function issueClientToken(userId: string, phone: string): Promise<string> {
  const normalized = normalizePhone(phone);
  return new SignJWT({ role: "client" as const, phone: normalized })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(getJwtSecretBytes());
}
