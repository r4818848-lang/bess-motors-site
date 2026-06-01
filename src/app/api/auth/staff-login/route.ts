import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { normalizePhone, phoneDigitsMatch } from "@/lib/server/normalize-phone";
import { getJwtSecretBytes } from "@/lib/server/jwt-secret";
import { verifyPassword } from "@/lib/crypto";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import type { Database, User } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function stripEnvQuotes(value: string): string {
  const s = value.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1).trim();
  }
  return s;
}

function adminCredentials(): { phone: string; password: string } | null {
  const phone = process.env.ADMIN_PHONE?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!phone || !password) return null;
  return { phone: stripEnvQuotes(phone), password: stripEnvQuotes(password) };
}

async function issueStaffToken(
  userId: string,
  role: "admin" | "mechanic",
  phone?: string
): Promise<string> {
  const claims: { role: "admin" | "mechanic"; phone?: string } = { role };
  if (phone) claims.phone = normalizePhone(phone);
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecretBytes());
}

async function verifyMechanicPassword(
  user: User,
  passwordInput: string
): Promise<boolean> {
  if (user.passwordHash) {
    return verifyPassword(passwordInput, user.passwordHash);
  }
  if (user.password) {
    return user.password === passwordInput;
  }
  return false;
}

export async function POST(req: Request) {
  let body: { phone?: string; password?: string };
  try {
    body = (await req.json()) as { phone?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const phone = stripEnvQuotes(String(body.phone ?? "")).trim();
  const password = stripEnvQuotes(String(body.password ?? "")).trim();
  if (!phone || !password) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const admin = adminCredentials();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "admin_not_configured" },
      { status: 503 }
    );
  }

  const adminPassword = admin.password.trim();
  if (phoneDigitsMatch(admin.phone, phone) && password === adminPassword) {
    const token = await issueStaffToken("admin-1", "admin", admin.phone);
    return NextResponse.json({
      ok: true,
      role: "admin" as const,
      token,
      user: {
        id: "admin-1",
        phone: admin.phone,
        name: "Administrator BESS MOTORS",
        role: "admin",
      },
    });
  }

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) {
    return NextResponse.json({ ok: false, error: "cloud_unavailable" }, { status: 503 });
  }

  const db = snap.doc as Database;
  const mechanic = db.users.find(
    (u) => u.role === "mechanic" && normalizePhone(u.phone) === normalized
  );
  if (!mechanic) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const valid = await verifyMechanicPassword(mechanic, password);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const token = await issueStaffToken(mechanic.id, "mechanic", mechanic.phone);
  return NextResponse.json({
    ok: true,
    role: "mechanic" as const,
    token,
    user: {
      id: mechanic.id,
      phone: mechanic.phone,
      name: mechanic.name,
      role: "mechanic",
    },
  });
}
