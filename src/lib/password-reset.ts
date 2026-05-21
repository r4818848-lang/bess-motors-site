import { loadDb, saveDb, type PasswordResetRecord } from "./store";
import { normalizePhone } from "./auth";
import { hashPassword, verifyPassword } from "./crypto";
import { siteConfig } from "./site";

const CODE_TTL_MS = 10 * 60 * 1000;
const TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

export type ResetError =
  | "phone_required"
  | "phone_not_found"
  | "rate_limit"
  | "invalid_code"
  | "expired"
  | "too_many_attempts"
  | "invalid_token"
  | "password_required"
  | "password_mismatch"
  | "sms_send_failed"
  | "sms_not_configured";

export type ResetResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: ResetError };

let smsApiCache: { enabled: boolean; at: number } | null = null;

export async function isSmsResetEnabled(): Promise<boolean> {
  if (smsApiCache && Date.now() - smsApiCache.at < 60_000) {
    return smsApiCache.enabled;
  }
  try {
    const res = await fetch("/api/auth/forgot-password/status");
    const data = (await res.json()) as { enabled?: boolean };
    smsApiCache = { enabled: !!data.enabled, at: Date.now() };
    return smsApiCache.enabled;
  } catch {
    return false;
  }
}

function generateCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, "0");
}

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function findClientByPhone(phone: string) {
  const db = loadDb();
  const normalized = normalizePhone(phone);
  const user = db.users.find(
    (u) => u.role === "client" && normalizePhone(u.phone) === normalized
  );
  return user ? { db, user, normalized } : null;
}

function pruneExpired(db: ReturnType<typeof loadDb>) {
  const now = Date.now();
  db.passwordResets = db.passwordResets.filter(
    (r) => new Date(r.expiresAt).getTime() > now - 60_000
  );
}

async function requestViaApi(
  phone: string,
  locale: "pl" | "ru"
): Promise<ResetResult<{ maskedPhone: string; demoCode?: string; resendInSec: number }>> {
  const res = await fetch("/api/auth/forgot-password/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, locale }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    const err = (data.error as ResetError) ?? "sms_send_failed";
    return { ok: false, error: err };
  }
  return {
    ok: true,
    data: {
      maskedPhone: data.maskedPhone,
      resendInSec: data.resendInSec ?? 60,
    },
  };
}

async function requestLocal(phone: string): Promise<
  ResetResult<{ maskedPhone: string; demoCode?: string; resendInSec: number }>
> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "phone_required" };

  const found = findClientByPhone(phone);
  if (!found) return { ok: false, error: "phone_not_found" };

  const { db, normalized: norm } = found;
  pruneExpired(db);

  const recent = db.passwordResets
    .filter((r) => r.phone === norm)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (recent) {
    const age = Date.now() - new Date(recent.createdAt).getTime();
    if (age < RESEND_COOLDOWN_MS) {
      return { ok: false, error: "rate_limit" };
    }
  }

  const code = generateCode();
  const codeHash = await hashPassword(code);
  const record: PasswordResetRecord = {
    id: `pr-${Date.now()}`,
    phone: norm,
    codeHash,
    expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    attempts: 0,
    verified: false,
    createdAt: new Date().toISOString(),
  };

  db.passwordResets = db.passwordResets.filter((r) => r.phone !== norm);
  db.passwordResets.push(record);
  saveDb(db);

  const masked = norm.slice(0, 4) + " *** " + norm.slice(-3);
  return {
    ok: true,
    data: {
      maskedPhone: masked,
      demoCode: code,
      resendInSec: 60,
    },
  };
}

/** Step 1: SMS code via provider API or local demo */
export async function requestPasswordResetCode(
  phone: string,
  locale: "pl" | "ru" = "ru"
): Promise<ResetResult<{ maskedPhone: string; demoCode?: string; resendInSec: number }>> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "phone_required" };

  if (!findClientByPhone(phone)) {
    return { ok: false, error: "phone_not_found" };
  }

  const useApi = await isSmsResetEnabled();
  if (useApi) {
    return requestViaApi(phone, locale);
  }
  return requestLocal(phone);
}

async function verifyViaApi(
  phone: string,
  code: string
): Promise<ResetResult<{ resetToken: string }>> {
  const res = await fetch("/api/auth/forgot-password/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    return { ok: false, error: (data.error as ResetError) ?? "invalid_code" };
  }
  return { ok: true, data: { resetToken: data.resetToken } };
}

/** Step 2: verify code */
export async function verifyPasswordResetCode(
  phone: string,
  code: string
): Promise<ResetResult<{ resetToken: string }>> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "phone_required" };

  if (await isSmsResetEnabled()) {
    return verifyViaApi(phone, code);
  }

  const db = loadDb();
  const record = db.passwordResets.find(
    (r) => r.phone === normalized && !r.verified
  );
  if (!record) return { ok: false, error: "invalid_code" };

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: "expired" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "too_many_attempts" };
  }

  const clean = code.replace(/\D/g, "").slice(0, 6);
  const valid = await verifyPassword(clean, record.codeHash);
  if (!valid) {
    record.attempts += 1;
    saveDb(db);
    return { ok: false, error: "invalid_code" };
  }

  const resetToken = generateToken();
  record.verified = true;
  record.resetToken = resetToken;
  record.tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  saveDb(db);

  return { ok: true, data: { resetToken } };
}

/** Step 3: set new password */
export async function resetClientPassword(
  phone: string,
  resetToken: string,
  newPassword: string,
  confirmPassword: string
): Promise<ResetResult> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "phone_required" };
  if (newPassword.length < 4) return { ok: false, error: "password_required" };
  if (newPassword !== confirmPassword) return { ok: false, error: "password_mismatch" };

  if (await isSmsResetEnabled()) {
    const res = await fetch("/api/auth/forgot-password/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, resetToken }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: (data.error as ResetError) ?? "invalid_token" };
    }
  } else {
    const db = loadDb();
    const record = db.passwordResets.find(
      (r) =>
        r.phone === normalized &&
        r.verified &&
        r.resetToken === resetToken
    );
    if (!record?.tokenExpiresAt) return { ok: false, error: "invalid_token" };
    if (new Date(record.tokenExpiresAt).getTime() < Date.now()) {
      return { ok: false, error: "expired" };
    }
    db.passwordResets = db.passwordResets.filter((r) => r.phone !== normalized);
    saveDb(db);
  }

  const db = loadDb();
  const idx = db.users.findIndex(
    (u) => u.role === "client" && normalizePhone(u.phone) === normalized
  );
  if (idx < 0) return { ok: false, error: "phone_not_found" };

  const passwordHash = await hashPassword(newPassword);
  db.users[idx] = {
    ...db.users[idx],
    passwordHash,
    password: undefined,
  };
  saveDb(db);

  return { ok: true };
}

export function buildResetSmsText(code: string, locale: "pl" | "ru" = "ru"): string {
  if (locale === "pl") {
    return `BESS MOTORS — kod resetu hasla: ${code}. Wazny 10 min. Nie udostepniaj kodu.`;
  }
  return `BESS MOTORS — код восстановления пароля: ${code}. Действует 10 мин. Никому не сообщайте код.`;
}

export function smsResetCodeUrl(phone: string, code: string, locale: "pl" | "ru" = "ru"): string {
  const digits = phone.replace(/\D/g, "");
  const body = buildResetSmsText(code, locale);
  return `sms:${digits}?body=${encodeURIComponent(body)}`;
}

export function whatsappResetHelpUrl(locale: "pl" | "ru" = "ru"): string {
  const text =
    locale === "pl"
      ? "Dzien dobry, nie moge zalogowac sie do konta BESS MOTORS. Prosze o pomoc z resetem hasla."
      : "Здравствуйте, не могу войти в личный кабинет BESS MOTORS. Помогите восстановить пароль.";
  return `${siteConfig.whatsapp}?text=${encodeURIComponent(text)}`;
}
