import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import { ensureClientForSign, sliceForClient, type ClientPortalSlice } from "@/lib/client-sign";
import { verifyPassword } from "@/lib/crypto";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import type { Database, User, WorkOrder } from "@/lib/store";
import type { BotLocale } from "./client-i18n";
import { ensureReferralCode } from "./client-extras";
import { loadCrmFromCloud } from "./crm-actions";

export type TelegramProfile = {
  chatId: string;
  telegramUserId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
};

export function findClientByTelegramChat(db: Database, chatId: string): User | undefined {
  return db.users.find(
    (u) => u.role === "client" && u.telegramChatId === String(chatId)
  );
}

export function findClientByTelegramUserId(
  db: Database,
  telegramUserId: number
): User | undefined {
  return db.users.find(
    (u) => u.role === "client" && u.telegramUserId === telegramUserId
  );
}

function displayName(profile: TelegramProfile, fallback?: string): string {
  const fromTg = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  if (fromTg) return fromTg;
  if (profile.username) return `@${profile.username}`;
  return fallback ?? "Клиент";
}

function applyTelegramProfile(user: User, profile: TelegramProfile): void {
  user.telegramChatId = profile.chatId;
  user.telegramUserId = profile.telegramUserId;
  user.telegramUsername = profile.username;
  user.telegramLinkedAt = new Date().toISOString();
}

export async function getClientPortalByChat(
  chatId: string
): Promise<ClientPortalSlice | null> {
  const db = await loadCrmFromCloud();
  if (!db) return null;
  const user = findClientByTelegramChat(db, chatId);
  if (!user) return null;
  return sliceForClient(db, user.id);
}

export async function findPendingSignOrderByPhone(
  phone: string
): Promise<WorkOrder | null> {
  const db = await loadCrmFromCloud();
  if (!db) return null;
  return findPendingSignOrderInDb(db, phone);
}

function findPendingSignOrderInDb(db: Database, phone: string): WorkOrder | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const orders = db.workOrders
    .filter(
      (o) =>
        o.confirmationStatus !== "confirmed" &&
        (o.documentStatus === "awaiting_signature" ||
          o.confirmationStatus === "awaiting_confirmation")
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  for (const order of orders) {
    const client = db.users.find((u) => u.id === order.userId);
    if (client && normalizePhone(client.phone) === normalized) return order;
  }

  for (const order of orders) {
    const apt = db.appointments.find((a) => a.workOrderId === order.id);
    if (apt && normalizePhone(apt.clientPhone ?? "") === normalized) return order;
  }

  return null;
}

export async function linkTelegramClient(params: {
  profile: TelegramProfile;
  phone: string;
  plate: string;
  name?: string;
  orderId?: string;
  locale?: BotLocale;
}): Promise<{ ok: boolean; error?: string; userId?: string }> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return { ok: false, error: "cloud_empty" };

  const db = structuredClone(snap.doc) as Database;
  const orderHint = params.orderId
    ? db.workOrders.find((o) => o.id === params.orderId) ?? null
    : findPendingSignOrderInDb(db, params.phone);

  try {
    const { user } = await ensureClientForSign(
      db,
      params.phone,
      params.plate,
      orderHint
    );
    if (params.name?.trim()) user.name = params.name.trim();
    else if (!user.name || user.name.startsWith("Client ")) {
      user.name = displayName(params.profile);
    }
    applyTelegramProfile(user, params.profile);
    if (params.locale) {
      user.telegramLocale = params.locale;
    }
    ensureReferralCode(user);

    const put = await cloudPutCrmStore(db);
    if (!put.ok) return { ok: false, error: put.error ?? "save_failed" };
    return { ok: true, userId: user.id };
  } catch {
    return { ok: false, error: "invalid_credentials" };
  }
}

export async function verifyClientPlateForTelegram(
  chatId: string,
  plate: string
): Promise<{ ok: boolean; user?: User }> {
  const db = await loadCrmFromCloud();
  if (!db) return { ok: false };

  const user = findClientByTelegramChat(db, chatId);
  if (!user?.passwordHash) return { ok: false };

  const plateKey = normalizePlateKey(plate);
  if (plateKey.length < 2) return { ok: false };

  const valid = await verifyPassword(plateKey, user.passwordHash);
  return valid ? { ok: true, user } : { ok: false };
}
