import { randomBytes, pbkdf2Sync, timingSafeEqual } from "crypto";

const ITERATIONS = 120_000;

export function hashSecret(secret: string): string {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(secret, salt, ITERATIONS, 32, "sha256");
  return `pbkdf2:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export function verifySecret(secret: string, stored: string): boolean {
  if (!stored.startsWith("pbkdf2:")) return secret === stored;
  const [, saltB64, hashB64] = stored.split(":");
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const hash = pbkdf2Sync(secret, salt, ITERATIONS, 32, "sha256");
  try {
    return timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

export function generateResetCode(): string {
  const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return String(n).padStart(6, "0");
}

export function generateToken(): string {
  return randomBytes(24).toString("hex");
}
