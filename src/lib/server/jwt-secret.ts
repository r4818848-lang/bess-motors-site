import { siteConfig } from "@/lib/site";

/** Server-only JWT signing key — set JWT_SECRET in Vercel for production. */
export function getJwtSecretBytes(): Uint8Array {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!fromEnv) {
      throw new Error(
        "JWT_SECRET is required in production — refusing insecure default"
      );
    }
    return new TextEncoder().encode(fromEnv);
  }
  const secret = fromEnv || siteConfig.jwtSecret;
  return new TextEncoder().encode(secret);
}

export function isJwtSecretHardened(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return Boolean(process.env.JWT_SECRET?.trim());
}
