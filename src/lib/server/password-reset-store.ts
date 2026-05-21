import { generateToken, hashSecret, verifySecret } from "./password-crypto";

const CODE_TTL_MS = 10 * 60 * 1000;
const TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

export type ServerResetError =
  | "phone_required"
  | "rate_limit"
  | "invalid_code"
  | "expired"
  | "too_many_attempts"
  | "invalid_token";

interface ResetSession {
  phone: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
  verified: boolean;
  resetToken?: string;
  tokenExpiresAt?: number;
}

type Store = Map<string, ResetSession>;

declare global {
  // eslint-disable-next-line no-var
  var __bmResetStore: Store | undefined;
}

function getStore(): Store {
  if (!globalThis.__bmResetStore) {
    globalThis.__bmResetStore = new Map();
  }
  return globalThis.__bmResetStore;
}

function prune(store: Store) {
  const now = Date.now();
  for (const [key, s] of store) {
    if (s.expiresAt < now && (!s.tokenExpiresAt || s.tokenExpiresAt < now)) {
      store.delete(key);
    }
  }
}

export function canResend(phone: string): boolean {
  const store = getStore();
  const s = store.get(phone);
  if (!s) return true;
  return Date.now() - s.createdAt >= RESEND_COOLDOWN_MS;
}

export function createResetSession(phone: string, code: string): void {
  const store = getStore();
  prune(store);
  store.set(phone, {
    phone,
    codeHash: hashSecret(code),
    expiresAt: Date.now() + CODE_TTL_MS,
    attempts: 0,
    createdAt: Date.now(),
    verified: false,
  });
}

export function verifyResetCode(
  phone: string,
  code: string
): { ok: true; resetToken: string } | { ok: false; error: ServerResetError } {
  const store = getStore();
  const session = store.get(phone);
  if (!session || session.verified) {
    return { ok: false, error: "invalid_code" };
  }
  if (session.expiresAt < Date.now()) {
    store.delete(phone);
    return { ok: false, error: "expired" };
  }
  if (session.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "too_many_attempts" };
  }

  const clean = code.replace(/\D/g, "").slice(0, 6);
  if (!verifySecret(clean, session.codeHash)) {
    session.attempts += 1;
    return { ok: false, error: "invalid_code" };
  }

  const resetToken = generateToken();
  session.verified = true;
  session.resetToken = resetToken;
  session.tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
  return { ok: true, resetToken };
}

export function consumeResetToken(
  phone: string,
  resetToken: string
): { ok: true } | { ok: false; error: ServerResetError } {
  const store = getStore();
  const session = store.get(phone);
  if (
    !session?.verified ||
    session.resetToken !== resetToken ||
    !session.tokenExpiresAt
  ) {
    return { ok: false, error: "invalid_token" };
  }
  if (session.tokenExpiresAt < Date.now()) {
    store.delete(phone);
    return { ok: false, error: "expired" };
  }
  store.delete(phone);
  return { ok: true };
}
