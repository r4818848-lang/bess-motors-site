import { SignJWT } from "jose";
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
        | "password_required";
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
export function isHiddenAdminCredentials(phone: string, password: string): boolean {
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

export async function verifyToken(
  token: string
): Promise<{ sub: string; role: AuthRole; phone?: string } | null> {
  return verifyTokenServer(token);
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
  if (user.role === "client") {
    linkGuestBookingsToClient(db, user.id, user.phone);
  }
  saveDb(db);
  localStorage.setItem(SESSION_ROLE_KEY, session.role);

  // Refresh long-lived tokens on visit
  if (user.role === "client" || user.role === "mechanic") {
    const freshToken = await issueToken(user.id, user.role, user.phone);
    localStorage.setItem(TOKEN_KEY, freshToken);
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

async function tryStaffLoginViaApi(
  phone: string,
  password: string
): Promise<AuthResult | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/auth/staff-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      role?: "admin" | "mechanic";
      token?: string;
      user?: User;
    };
    if (!res.ok || !data.ok || !data.token || !data.user || !data.role) {
      return null;
    }
    if (data.role === "admin") {
      const admin = ensureAdminUser();
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
  if (staffFromApi) return staffFromApi;

  if (isHiddenAdminCredentials(phone, credential)) {
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
      if (typeof window !== "undefined") {
        const { loginClientViaCloudApi } = await import("@/lib/client-cloud-login");
        const cloud = await loginClientViaCloudApi(phone, credential);
        if (cloud) {
          const db2 = loadDb();
          ensureReferralCode(cloud.user, db2);
          applyPendingReferralForUser(db2, cloud.user.id);
          saveDb(db2);
          return { ok: true, role: "client", user: cloud.user };
        }
      }
      return { ok: false, error: "invalid_credentials" };
    }
  } else if (typeof window !== "undefined") {
    const { loginClientViaCloudApi } = await import("@/lib/client-cloud-login");
    const cloud = await loginClientViaCloudApi(phone, credential);
    if (cloud) {
      const db2 = loadDb();
      ensureReferralCode(cloud.user, db2);
      applyPendingReferralForUser(db2, cloud.user.id);
      saveDb(db2);
      return { ok: true, role: "client", user: cloud.user };
    }
    return { ok: false, error: "invalid_credentials" };
  } else {
    return { ok: false, error: "invalid_credentials" };
  }

  ensureReferralCode(user!, db);
  applyPendingReferralForUser(db, user!.id);
  saveDb(db);

  const token = await issueToken(user!.id, "client", user!.phone);
  persistSession(token, "client", user!.id);
  saveClientCredentials(phone, credential);
  return { ok: true, role: "client", user: user! };
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

  if (normalized === normalizePhone(siteConfig.adminPhone)) {
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

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return getSessionRole() === "admin" && !!localStorage.getItem(TOKEN_KEY);
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
