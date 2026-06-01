import { SignJWT, jwtVerify } from "jose";
import { verifyToken as verifyTokenServer } from "@/lib/server/verify-session";

import { loadDb, saveDb, type User, type Vehicle } from "./store";
import { linkGuestBookingsToClient } from "./link-client-bookings";
import { applyPendingReferralForUser } from "./referral-capture";
import { ensureReferralCode } from "./referral-code";

import { siteConfig } from "./site";

import { hashPassword, verifyPassword } from "./crypto";
import { saveClientCredentials } from "./client-credentials";

const TOKEN_KEY = "bess-jwt";

const SESSION_ROLE_KEY = "bess-session-role";

export type AuthRole = "admin" | "client" | "mechanic";

export type AuthResult =
  | { ok: true; role: AuthRole; user: User }
  | {
      ok: false;
      error:
        | "invalid_credentials"
        | "phone_exists"
        | "phone_required"
        | "plate_required"
        | "password_required"
        | "staff_cloud_unavailable"
        | "staff_not_configured";
    };

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

/** Registration plate key — compare without spaces, uppercase */
export function normalizePlateKey(plate: string): string {
  return plate.replace(/\s/g, "").replace(/-/g, "").toUpperCase();
}

export function formatPlateDisplay(plate: string): string {
  const key = normalizePlateKey(plate);
  return key;
}

/** Hidden admin — exact phone AND password (never exposed in UI) */
/** Dev-only fallback when cloud is off — production uses /api/auth/staff-login + env. */
export function isHiddenAdminCredentials(phone: string, password: string): boolean {
  if (!siteConfig.adminPassword?.trim()) return false;
  return (
    normalizePhone(phone) === normalizePhone(siteConfig.adminPhone) &&
    password === siteConfig.adminPassword
  );
}

async function issueToken(
  userId: string,
  role: AuthRole,
  phone?: string
): Promise<string> {
  const expiresIn = role === "client" ? "365d" : "30d";
  const claims: { role: AuthRole; phone?: string } = { role };
  if ((role === "client" || role === "mechanic") && phone) {
    claims.phone = normalizePhone(phone);
  }
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function issueTokenForUser(user: User): Promise<string> {
  const role: AuthRole =
    user.role === "client" ? "client" : user.role === "mechanic" ? "mechanic" : "admin";
  return issueToken(
    user.id,
    role,
    user.role === "client" || user.role === "mechanic" ? user.phone : undefined
  );
}

export function persistSession(token: string, role: AuthRole, userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(SESSION_ROLE_KEY, role);
  const db = loadDb();
  db.currentUserId = userId;
  if (role === "client") {
    const user = db.users.find((u) => u.id === userId);
    if (user) linkGuestBookingsToClient(db, userId, user.phone);
  }
  saveDb(db);
}

/** Browser must not verify JWT locally (JWT_SECRET is server-only). */
async function verifyStaffSessionViaApi(
  token: string
): Promise<{ sub: string; role: AuthRole } | null> {
  try {
    const res = await fetch("/api/auth/staff-refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      userId?: string;
      role?: AuthRole;
    };
    if (!res.ok || !data.ok || !data.role) return null;
    const sub =
      data.userId ?? (data.role === "admin" ? "admin-1" : "");
    if (!sub) return null;
    return { sub, role: data.role };
  } catch {
    return null;
  }
}

async function verifyClientSessionViaApi(
  token: string
): Promise<{ sub: string; role: AuthRole; phone?: string } | null> {
  try {
    const res = await fetch("/api/auth/client-refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      userId?: string;
      role?: AuthRole;
    };
    if (!res.ok || !data.ok || !data.userId) return null;
    return { sub: data.userId, role: "client" };
  } catch {
    return null;
  }
}

/** Local-only mode (no Supabase): tokens signed in browser with dev secret. */
async function verifyTokenLocalDev(
  token: string
): Promise<{ sub: string; role: AuthRole; phone?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role as AuthRole | undefined;
    if (!role || !payload.sub) return null;
    return {
      sub: String(payload.sub),
      role,
      phone: typeof payload.phone === "string" ? payload.phone : undefined,
    };
  } catch {
    return null;
  }
}

async function verifyTokenViaApi(
  token: string
): Promise<{ sub: string; role: AuthRole; phone?: string } | null> {
  const hinted =
    typeof window !== "undefined"
      ? (localStorage.getItem(SESSION_ROLE_KEY) as AuthRole | null)
      : null;

  if (hinted === "admin" || hinted === "mechanic") {
    const staff = await verifyStaffSessionViaApi(token);
    if (staff) return staff;
  }
  if (hinted === "client") {
    const client = await verifyClientSessionViaApi(token);
    if (client) return client;
  }

  try {
    const res = await fetch("/api/auth/session", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      sub?: string;
      role?: AuthRole;
      phone?: string;
    };
    if (res.ok && data.ok && data.sub && data.role) {
      return { sub: data.sub, role: data.role, phone: data.phone };
    }
  } catch {
    /* session route may be absent on older deploys */
  }

  const staff = await verifyStaffSessionViaApi(token);
  if (staff) return staff;
  return verifyClientSessionViaApi(token);
}

export async function verifyToken(
  token: string
): Promise<{ sub: string; role: AuthRole; phone?: string } | null> {
  if (typeof window === "undefined") {
    return verifyTokenServer(token);
  }

  const hinted =
    typeof window !== "undefined"
      ? (localStorage.getItem(SESSION_ROLE_KEY) as AuthRole | null)
      : null;

  /* Staff JWT is always server-signed — check API before dev-local secret */
  if (hinted === "admin" || hinted === "mechanic") {
    const staff = await verifyStaffSessionViaApi(token);
    if (staff) return staff;
  }
  if (hinted === "client") {
    const client = await verifyClientSessionViaApi(token);
    if (client) return client;
  }

  const api = await verifyTokenViaApi(token);
  if (api) return api;

  const { fetchCloudConfigured } = await import("@/lib/cloud-crm-db");
  if (!(await fetchCloudConfigured())) {
    return verifyTokenLocalDev(token);
  }
  return null;
}

function resolveStaffUserFromSession(
  db: ReturnType<typeof loadDb>,
  session: { sub: string; role: AuthRole }
): User | null {
  let user = db.users.find((u) => u.id === session.sub) ?? null;
  if (!user && session.role === "admin") {
    user = db.users.find((u) => u.role === "admin") ?? null;
  }
  if (!user || user.role !== session.role) return null;
  return user;
}

async function refreshStaffTokenFromApi(existingToken: string): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/staff-refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${existingToken}` },
      cache: "no-store",
    });
    const data = (await res.json()) as { ok?: boolean; token?: string };
    if (!res.ok || !data.ok || !data.token) return null;
    return data.token;
  } catch {
    return null;
  }
}

async function refreshClientTokenFromApi(existingToken: string): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/client-refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${existingToken}` },
      cache: "no-store",
    });
    const data = (await res.json()) as { ok?: boolean; token?: string };
    if (!res.ok || !data.ok || !data.token) return null;
    return data.token;
  } catch {
    return null;
  }
}

export async function restoreSessionFromToken(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const hintedRole = localStorage.getItem(SESSION_ROLE_KEY) as AuthRole | null;
  let session = await verifyToken(token);

  if (
    !session &&
    (hintedRole === "admin" || hintedRole === "mechanic")
  ) {
    const fresh = await refreshStaffTokenFromApi(token);
    if (fresh) {
      token = fresh;
      localStorage.setItem(TOKEN_KEY, fresh);
      session = await verifyToken(fresh);
    }
  }

  if (!session) {
    if (hintedRole === "client" || !hintedRole) {
      const { loadClientCredentials } = await import("@/lib/client-credentials");
      const creds = loadClientCredentials();
      if (creds) {
        const relogin = await tryClientLoginViaCloud(creds.phone, creds.plate);
        if (relogin?.ok && relogin.role === "client") {
          return relogin.user;
        }
      }
    }
    clearSessionStorage();
    return null;
  }

  const db = loadDb();
  let user =
    session.role === "admin" || session.role === "mechanic"
      ? resolveStaffUserFromSession(db, session)
      : db.users.find((u) => u.id === session.sub) ?? null;

  if (!user && session.role === "admin") {
    user = ensureAdminUser();
  }

  if (!user || user.role !== session.role) {
    clearSessionStorage();
    const cleared = loadDb();
    cleared.currentUserId = null;
    saveDb(cleared);
    return null;
  }
  db.currentUserId = user.id;
  if (user.role === "client") {
    linkGuestBookingsToClient(db, user.id, user.phone);
  }
  saveDb(db);
  localStorage.setItem(SESSION_ROLE_KEY, session.role);

  if (user.role === "admin" || user.role === "mechanic") {
    const serverToken = await refreshStaffTokenFromApi(token);
    if (serverToken) localStorage.setItem(TOKEN_KEY, serverToken);
  } else {
    const serverToken = await refreshClientTokenFromApi(token);
    if (serverToken) localStorage.setItem(TOKEN_KEY, serverToken);
  }

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

async function saveClientPlateHash(userId: string, plateKey: string): Promise<void> {
  const db = loadDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx < 0) return;
  const hash = await hashPassword(plateKey);
  db.users[idx] = { ...db.users[idx], passwordHash: hash, password: undefined };
  saveDb(db);
}

function clientHasPlate(db: ReturnType<typeof loadDb>, userId: string, plateKey: string): boolean {
  return db.vehicles.some(
    (v) => v.userId === userId && normalizePlateKey(v.plate) === plateKey
  );
}

/** Client login: phone + registration plate (stored as passwordHash) */
async function checkClientPlate(user: User, plateInput: string): Promise<boolean> {
  const plateKey = normalizePlateKey(plateInput);
  if (plateKey.length < 2) return false;

  const db = loadDb();

  if (user.passwordHash) {
    return verifyPassword(plateKey, user.passwordHash);
  }

  if (user.password) {
    const legacyOk = user.password === plateInput || user.password === plateKey;
    if (legacyOk) {
      await saveClientPlateHash(user.id, plateKey);
      return true;
    }
  }

  if (clientHasPlate(db, user.id, plateKey)) {
    await saveClientPlateHash(user.id, plateKey);
    return true;
  }

  return false;
}

/**
 * Login: admin = phone + password → CRM;
 * mechanic = phone + password → mechanic panel;
 * client = phone + vehicle registration plate
 */
/** Apply JWT from server (e.g. after signing a work order in the cloud) */
export async function establishClientSessionFromToken(token: string): Promise<User | null> {
  const session = await verifyToken(token);
  if (!session || session.role !== "client") return null;
  persistSession(token, "client", session.sub);
  return getCurrentUser();
}

function mapStaffLoginError(apiError?: string): Extract<AuthResult, { ok: false }>["error"] {
  if (apiError === "cloud_unavailable") return "staff_cloud_unavailable";
  if (apiError === "admin_not_configured") return "staff_not_configured";
  return "invalid_credentials";
}

async function tryStaffLoginViaApi(
  phone: string,
  password: string
): Promise<AuthResult | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/auth/staff-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), password: password.trim() }),
      cache: "no-store",
    });
    const data = (await res.json()) as {
      ok?: boolean;
      role?: "admin" | "mechanic";
      token?: string;
      user?: User;
      error?: string;
    };
    if (!res.ok || !data.ok || !data.token || !data.user || !data.role) {
      return { ok: false, error: mapStaffLoginError(data.error) };
    }
    if (data.role === "admin") {
      const admin = ensureAdminUser();
      if (data.user.phone) {
        admin.phone = data.user.phone;
        const db = loadDb();
        const idx = db.users.findIndex((u) => u.id === admin.id);
        if (idx >= 0) db.users[idx] = { ...db.users[idx], phone: data.user.phone };
        saveDb(db);
      }
      persistSession(data.token, "admin", admin.id);
      return { ok: true, role: "admin", user: admin };
    }
    const db = loadDb();
    const idx = db.users.findIndex((u) => u.id === data.user!.id);
    const mech: User = {
      ...data.user,
      role: "mechanic",
    } as User;
    if (idx >= 0) db.users[idx] = { ...db.users[idx], ...mech };
    else db.users.push(mech);
    saveDb(db);
    persistSession(data.token, "mechanic", mech.id);
    return { ok: true, role: "mechanic", user: mech };
  } catch {
    return null;
  }
}

export async function loginWithPhonePassword(
  phone: string,
  credential: string
): Promise<AuthResult> {
  if (!credential.trim()) return { ok: false, error: "plate_required" };

  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "phone_required" };

  const staffFromApi = await tryStaffLoginViaApi(phone, credential);
  if (staffFromApi !== null) return staffFromApi;

  if (isHiddenAdminCredentials(phone, credential)) {
    const { fetchCloudConfigured } = await import("@/lib/cloud-crm-db");
    const cloudOn = await fetchCloudConfigured();
    if (cloudOn) {
      return { ok: false, error: "invalid_credentials" };
    }
    const admin = ensureAdminUser();
    const token = await issueToken(admin.id, "admin");
    persistSession(token, "admin", admin.id);
    return { ok: true, role: "admin", user: admin };
  }

  const db = loadDb();
  const mechanicUser = db.users.find(
    (u) => u.role === "mechanic" && normalizePhone(u.phone) === normalized
  );
  if (mechanicUser) {
    const valid = await checkMechanicPassword(mechanicUser, credential);
    if (!valid) return { ok: false, error: "invalid_credentials" };
    const { fetchCloudConfigured } = await import("@/lib/cloud-crm-db");
    if (await fetchCloudConfigured()) {
      return { ok: false, error: "invalid_credentials" };
    }
    const token = await issueToken(mechanicUser.id, "mechanic", mechanicUser.phone);
    persistSession(token, "mechanic", mechanicUser.id);
    return { ok: true, role: "mechanic", user: mechanicUser };
  }

  let user = db.users.find(
    (u) => u.role === "client" && normalizePhone(u.phone) === normalized
  );

  if (user) {
    const valid = await checkClientPlate(user, credential);
    if (!valid) {
      const cloudLogin = await tryClientLoginViaCloud(phone, credential);
      if (cloudLogin !== null) return cloudLogin;
      return { ok: false, error: "invalid_credentials" };
    }
    return finishClientLogin(phone, credential, user);
  }

  const cloudLogin = await tryClientLoginViaCloud(phone, credential);
  if (cloudLogin !== null) return cloudLogin;

  return { ok: false, error: "invalid_credentials" };
}

/** Production: JWT only from server (client-login). Returns null if cloud is off (caller may use offline token). */
async function tryClientLoginViaCloud(
  phone: string,
  plate: string
): Promise<AuthResult | null> {
  if (typeof window === "undefined") return null;
  const { fetchCloudConfigured } = await import("@/lib/cloud-crm-db");
  if (!(await fetchCloudConfigured())) return null;

  const { loginClientViaCloudApi } = await import("@/lib/client-cloud-login");
  const cloud = await loginClientViaCloudApi(phone, plate);
  if (!cloud) {
    return { ok: false, error: "invalid_credentials" };
  }

  const db2 = loadDb();
  ensureReferralCode(cloud.user, db2);
  applyPendingReferralForUser(db2, cloud.user.id);
  saveDb(db2);
  return { ok: true, role: "client", user: cloud.user };
}

async function finishClientLogin(
  phone: string,
  plate: string,
  user: User
): Promise<AuthResult> {
  const cloudResult = await tryClientLoginViaCloud(phone, plate);
  if (cloudResult !== null) return cloudResult;

  const db = loadDb();
  ensureReferralCode(user, db);
  applyPendingReferralForUser(db, user.id);
  saveDb(db);

  const token = await issueToken(user.id, "client", user.phone);
  persistSession(token, "client", user.id);
  saveClientCredentials(phone, plate);
  return { ok: true, role: "client", user };
}

async function checkMechanicPassword(user: User, passwordInput: string): Promise<boolean> {
  if (user.passwordHash) {
    return verifyPassword(passwordInput, user.passwordHash);
  }
  if (user.password) {
    const legacyOk = user.password === passwordInput;
    if (legacyOk) {
      const db = loadDb();
      const idx = db.users.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        const hash = await hashPassword(passwordInput);
        db.users[idx] = { ...db.users[idx], passwordHash: hash, password: undefined };
        saveDb(db);
      }
      return true;
    }
  }
  return false;
}

/** Register: phone + registration plate; creates first vehicle with that plate */
export async function registerClient(phone: string, plate: string): Promise<AuthResult> {
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: "phone_required" };

  const plateKey = normalizePlateKey(plate);
  if (plateKey.length < 2) return { ok: false, error: "plate_required" };

  const { fetchCloudConfigured } = await import("@/lib/cloud-crm-db");
  const { mergeClientPortalIntoDb } = await import("@/lib/client-portal");
  if (await fetchCloudConfigured()) {
    try {
      const res = await fetch("/api/auth/client-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, plate }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        token?: string;
        portal?: import("@/lib/client-sign").ClientPortalSlice;
        user?: User;
      };
      if (res.ok && data.ok && data.token && data.portal && data.user) {
        mergeClientPortalIntoDb(data.portal);
        persistSession(data.token, "client", data.user.id);
        saveClientCredentials(phone, plate);
        return { ok: true, role: "client", user: data.user };
      }
      if (data.error === "phone_exists") return { ok: false, error: "phone_exists" };
      if (!res.ok) return { ok: false, error: "invalid_credentials" };
    } catch {
      return { ok: false, error: "invalid_credentials" };
    }
  }

  if (siteConfig.adminPhone && normalized === normalizePhone(siteConfig.adminPhone)) {
    return { ok: false, error: "invalid_credentials" };
  }

  const db = loadDb();
  const exists = db.users.some(
    (u) => u.role === "client" && normalizePhone(u.phone) === normalized
  );
  if (exists) return { ok: false, error: "phone_exists" };

  const plateTaken = db.vehicles.some((v) => normalizePlateKey(v.plate) === plateKey);
  if (plateTaken) return { ok: false, error: "phone_exists" };

  const passwordHash = await hashPassword(plateKey);
  const userId = `user-${Date.now()}`;
  const displayPlate = plate.trim();

  const user: User = {
    id: userId,
    phone: normalized,
    name: `Client ${normalized.slice(-4)}`,
    role: "client",
    passwordHash,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  const vehicle: Vehicle = {
    id: `v-${Date.now()}`,
    vin: "",
    plate: displayPlate,
    mileage: 0,
    make: "",
    model: "",
    engine: "",
    trim: "",
    power: "",
    transmission: "",
    userId,
  };

  ensureReferralCode(user, db);
  db.users.push(user);
  db.vehicles.push(vehicle);
  db.currentUserId = userId;
  linkGuestBookingsToClient(db, userId, normalized);
  applyPendingReferralForUser(db, userId);
  saveDb(db);

  const token = await issueToken(user.id, "client", user.phone);
  persistSession(token, "client", user.id);
  saveClientCredentials(phone, plate);
  return { ok: true, role: "client", user };
}

export function getSessionRole(): AuthRole | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(SESSION_ROLE_KEY);
  if (role === "admin" || role === "client" || role === "mechanic") return role;
  return null;
}

/** Re-issue staff JWT via server (matches production JWT_SECRET). */
export async function refreshStaffSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const role = getSessionRole();
  if (role !== "admin" && role !== "mechanic") return null;
  const user = getCurrentUser();
  if (!user || user.role !== role) return null;
  const existing = localStorage.getItem(TOKEN_KEY);
  if (!existing) return null;
  const fresh = await refreshStaffTokenFromApi(existing);
  if (!fresh) return null;
  persistSession(fresh, role, user.id);
  return fresh;
}

/** Re-issue client JWT via server (matches production JWT_SECRET). */
export async function refreshClientSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (getSessionRole() !== "client") return null;
  const user = getCurrentUser();
  if (!user || user.role !== "client") return null;
  const existing = localStorage.getItem(TOKEN_KEY);
  if (!existing) return null;
  const fresh = await refreshClientTokenFromApi(existing);
  if (!fresh) return null;
  persistSession(fresh, "client", user.id);
  return fresh;
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  if (getSessionRole() !== "admin" || !localStorage.getItem(TOKEN_KEY)) return false;
  const user = getCurrentUser();
  return !user || user.role === "admin";
}

export function isMechanicAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const user = getCurrentUser();
  return getSessionRole() === "mechanic" && !!localStorage.getItem(TOKEN_KEY) && user?.role === "mechanic";
}

export function getMechanicProfileId(): string | null {
  const user = getCurrentUser();
  if (!user || user.role !== "mechanic") return null;
  return user.id;
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
