import { SignJWT, jwtVerify } from "jose";
import { loadDb, saveDb, type User } from "./store";
import { siteConfig } from "./site";
import { hashPassword, verifyPassword } from "./crypto";

const TOKEN_KEY = "bess-jwt";
const SESSION_ROLE_KEY = "bess-session-role";

export type AuthRole = "admin" | "client";

export type AuthResult =
  | { ok: true; role: AuthRole; user: User }
  | { ok: false; error: "invalid_credentials" | "phone_exists" | "phone_required" | "password_required" };

function getSecret(): Uint8Array {
  return new TextEncoder().encode(siteConfig.jwtSecret);
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("48") && digits.length >= 11) return `+${digits}`;
  if (digits.length === 9) return `+48${digits}`;
  return phone.replace(/\s/g, "").replace(/-/g, "");
}

/** Hidden admin — exact phone AND password (never exposed in UI) */
export function isHiddenAdminCredentials(phone: string, password: string): boolean {
  return (
    normalizePhone(phone) === normalizePhone(siteConfig.adminPhone) &&
    password === siteConfig.adminPassword
  );
}

async function issueToken(userId: string, role: AuthRole): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

function persistSession(token: string, role: AuthRole, userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SESSION_ROLE_KEY, role);
  const db = loadDb();
  db.currentUserId = userId;
  saveDb(db);
}

export async function verifyToken(token: string): Promise<{ sub: string; role: AuthRole } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role as AuthRole;
    if (role !== "admin" && role !== "client") return null;
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    return { sub, role };
  } catch {
    return null;
  }
}

export async function restoreSessionFromToken(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) {
    clearSessionStorage();
    return null;
  }
  const db = loadDb();
  const user = db.users.find((u) => u.id === session.sub) ?? null;
  if (!user || user.role !== session.role) {
    clearSessionStorage();
    const cleared = loadDb();
    cleared.currentUserId = null;
    saveDb(cleared);
    return null;
  }
  db.currentUserId = user.id;
  saveDb(db);
  localStorage.setItem(SESSION_ROLE_KEY, session.role);
  return user;
}

function clearSessionStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_ROLE_KEY);
}

function ensureAdminUser(): User {
  const db = loadDb();
  const phone = normalizePhone(siteConfig.adminPhone);
  let admin = db.users.find((u) => u.role === "admin");
  if (!admin) {
    admin = {
      id: "admin-1",
      phone,
      name: "Administrator BESS MOTORS",
      role: "admin",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.users.push(admin);
  } else {
    admin.phone = phone;
  }
  saveDb(db);
  return admin;
}

async function upgradePasswordIfNeeded(user: User, password: string): Promise<void> {
  if (!user.password) return;
  const db = loadDb();
  const idx = db.users.findIndex((u) => u.id === user.id);
  if (idx < 0) return;
  const hash = await hashPassword(password);
  db.users[idx] = { ...db.users[idx], passwordHash: hash, password: undefined };
  saveDb(db);
}

async function checkClientPassword(user: User, password: string): Promise<boolean> {
  if (user.passwordHash) return verifyPassword(password, user.passwordHash);
  if (user.password) {
    const ok = user.password === password;
    if (ok) await upgradePasswordIfNeeded(user, password);
    return ok;
  }
  return false;
}

/** Login: hidden admin combo → CRM; otherwise client */
export async function loginWithPhonePassword(phone: string, password: string): Promise<AuthResult> {
  if (!password.trim()) return { ok: false, error: "password_required" };

  if (isHiddenAdminCredentials(phone, password)) {
    const admin = ensureAdminUser();
    const token = await issueToken(admin.id, "admin");
    persistSession(token, "admin", admin.id);
    return { ok: true, role: "admin", user: admin };
  }

  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "phone_required" };

  const db = loadDb();
  const user = db.users.find(
    (u) => u.role === "client" && normalizePhone(u.phone) === normalized
  );
  if (!user) return { ok: false, error: "invalid_credentials" };

  const valid = await checkClientPassword(user, password);
  if (!valid) return { ok: false, error: "invalid_credentials" };

  const token = await issueToken(user.id, "client");
  persistSession(token, "client", user.id);
  return { ok: true, role: "client", user };
}

export async function registerClient(phone: string, password: string): Promise<AuthResult> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "phone_required" };
  if (password.length < 4) return { ok: false, error: "password_required" };

  if (normalized === normalizePhone(siteConfig.adminPhone)) {
    return { ok: false, error: "invalid_credentials" };
  }

  const db = loadDb();
  const exists = db.users.some(
    (u) => u.role === "client" && normalizePhone(u.phone) === normalized
  );
  if (exists) return { ok: false, error: "phone_exists" };

  const passwordHash = await hashPassword(password);
  const user: User = {
    id: `user-${Date.now()}`,
    phone: normalized,
    name: `Client ${normalized.slice(-4)}`,
    role: "client",
    passwordHash,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  db.users.push(user);
  db.currentUserId = user.id;
  saveDb(db);

  const token = await issueToken(user.id, "client");
  persistSession(token, "client", user.id);
  return { ok: true, role: "client", user };
}

export function getSessionRole(): AuthRole | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(SESSION_ROLE_KEY);
  if (role === "admin" || role === "client") return role;
  return null;
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return getSessionRole() === "admin" && !!localStorage.getItem(TOKEN_KEY);
}

export function isClientAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return getSessionRole() === "client" && !!localStorage.getItem(TOKEN_KEY) && !!getCurrentUser();
}

export function getCurrentUser(): User | null {
  const db = loadDb();
  if (!db.currentUserId) return null;
  return db.users.find((u) => u.id === db.currentUserId) ?? null;
}

export function logout(): void {
  clearSessionStorage();
  const db = loadDb();
  db.currentUserId = null;
  saveDb(db);
}

export function logoutAdmin(): void {
  logout();
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}
