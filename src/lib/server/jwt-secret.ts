import { siteConfig } from "@/lib/site";

/** Server-only JWT signing key — set JWT_SECRET in Vercel for production. */
export function getJwtSecretBytes(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim() || siteConfig.jwtSecret;
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.JWT_SECRET?.trim()
  ) {
    console.warn("[auth] JWT_SECRET is not set — using built-in default (insecure)");
  }
  return new TextEncoder().encode(secret);
}
