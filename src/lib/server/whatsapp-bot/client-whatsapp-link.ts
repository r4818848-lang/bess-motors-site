import { normalizePhone } from "@/lib/auth";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import type { Database, User } from "@/lib/store";
import { phoneToWaId, phonesMatchWa } from "./whatsapp-phone";

export function findClientByWhatsAppWaId(db: Database, waId: string): User | undefined {
  const key = phoneToWaId(waId);
  return db.users.find((u) => u.role === "client" && u.whatsappWaId === key);
}

export function findClientByPhoneForWhatsApp(db: Database, waId: string): User | undefined {
  const matches = db.users.filter(
    (u) => u.role === "client" && phonesMatchWa(u.phone, waId)
  );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    const linked = matches.find((u) => u.whatsappWaId === phoneToWaId(waId));
    return linked ?? matches[0];
  }
  return undefined;
}

export function applyWhatsAppProfile(
  user: User,
  waId: string,
  profileName?: string
): void {
  user.whatsappWaId = phoneToWaId(waId);
  user.whatsappLinkedAt = new Date().toISOString();
  if (profileName?.trim()) user.whatsappProfileName = profileName.trim();
}

/** Link inbound WhatsApp chat to CRM client by phone match */
export async function linkWhatsAppInbound(
  waId: string,
  profileName?: string
): Promise<User | null> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return null;

  const db = structuredClone(snap.doc) as Database;
  const key = phoneToWaId(waId);

  let user = findClientByWhatsAppWaId(db, key);
  if (!user) {
    user = findClientByPhoneForWhatsApp(db, key);
    if (!user) return null;

    const owner = findClientByWhatsAppWaId(db, key);
    if (owner && owner.id !== user.id) return owner;
  }

  applyWhatsAppProfile(user, key, profileName);
  const put = await cloudPutCrmStore(db);
  if (!put.ok) return null;
  return user;
}

export function tryLinkWhatsAppOnBooking(
  db: Database,
  userId: string,
  waId: string,
  profileName?: string
): void {
  const user = db.users.find((u) => u.id === userId && u.role === "client");
  if (!user) return;

  const key = phoneToWaId(waId);
  const owner = findClientByWhatsAppWaId(db, key);
  if (owner && owner.id !== userId) return;

  if (user.whatsappWaId && user.whatsappWaId !== key) return;
  if (!phonesMatchWa(user.phone, key) && user.whatsappWaId) return;

  applyWhatsAppProfile(user, key, profileName);
}

export async function linkWhatsAppClientByCredentials(params: {
  waId: string;
  phone: string;
  plate: string;
  name?: string;
  profileName?: string;
}): Promise<{ ok: boolean; error?: string; userId?: string }> {
  const normalized = normalizePhone(params.phone);
  if (!normalized) return { ok: false, error: "invalid_phone" };

  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return { ok: false, error: "cloud_empty" };

  const db = structuredClone(snap.doc) as Database;
  const { ensureClientForSign } = await import("@/lib/client-sign");
  const { findPendingSignOrderByPhone } = await import(
    "@/lib/server/telegram-bot/client-telegram-link"
  );

  try {
    const orderHint = await findPendingSignOrderByPhone(params.phone);
    const { user } = await ensureClientForSign(db, params.phone, params.plate, orderHint);
    if (params.name?.trim()) user.name = params.name.trim();
    applyWhatsAppProfile(user, params.waId, params.profileName);
    const put = await cloudPutCrmStore(db);
    if (!put.ok) return { ok: false, error: put.error ?? "save_failed" };
    return { ok: true, userId: user.id };
  } catch {
    return { ok: false, error: "invalid_credentials" };
  }
}
