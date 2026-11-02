import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

/**
 * AES-256-GCM for supplier credentials and other server-only secrets.
 * Key source: SUPPLIER_SECRETS_KEY (preferred) or derived from JWT_SECRET (dev fallback).
 * Key material never leaves the server; ciphertext is storage-safe.
 */
export function getSecretsKeyMaterial(): Buffer {
  const raw =
    process.env.SUPPLIER_SECRETS_KEY?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    "";
  if (!raw) {
    throw new Error("secrets_key_missing");
  }
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.SUPPLIER_SECRETS_KEY?.trim()
  ) {
    console.warn(
      "[secrets] SUPPLIER_SECRETS_KEY unset — deriving from JWT_SECRET (set a dedicated key)"
    );
  }
  return createHash("sha256").update(raw, "utf8").digest();
}

/** Returns `v1:<iv_b64>:<tag_b64>:<cipher_b64>` */
export function encryptSecret(plaintext: string): string {
  const key = getSecretsKeyMaterial();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  if (!payload.startsWith("v1:")) {
    throw new Error("secrets_cipher_invalid");
  }
  const parts = payload.split(":");
  if (parts.length !== 4) throw new Error("secrets_cipher_invalid");
  const [, ivB64, tagB64, dataB64] = parts;
  const key = getSecretsKeyMaterial();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
    throw new Error("secrets_cipher_invalid");
  }
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function isSecretsCryptoConfigured(): boolean {
  try {
    getSecretsKeyMaterial();
    return true;
  } catch {
    return false;
  }
}

/** Redact any secret-looking values from log strings */
export function redactForLog(value: unknown): string {
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return s
    .replace(/(password|secret|token|authorization)["']?\s*[:=]\s*["']?[^"'&\s,]+/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]");
}
