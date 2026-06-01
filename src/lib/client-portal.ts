"use client";

import { verifyPassword, hashPassword } from "@/lib/crypto";
import { normalizePlateKey } from "@/lib/auth";
import {
  ensureClientForSign,
  pickWorkOrderForClient,
  sliceForClient,
  type ClientPortalSlice,
} from "@/lib/client-sign";
import { clientAuthenticatedFetch } from "@/lib/client-authenticated-fetch";
import { mergeClientPortalIntoLocal } from "@/lib/client-portal-merge";
import { loadDb, saveDb, type WorkOrder } from "@/lib/store";

export type { ClientPortalSlice };

export function mergeClientPortalIntoDb(slice: ClientPortalSlice): void {
  const db = loadDb();
  mergeClientPortalIntoLocal(db, slice);
  saveDb(db, { skipCloudPush: true });
}

export async function pushClientPortalPatchToCloud(
  patch: Partial<{ referralCode: string; notificationIdsRead: string[]; markAllRead: boolean }>
): Promise<boolean> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("bess-jwt") : null;
  if (!token) return false;

  const res = await clientAuthenticatedFetch("/api/client-portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sync-client-state", ...patch }),
  });
  return !!res?.ok;
}

export async function localClientPortalAccess(
  phone: string,
  plate: string,
  orderId?: string
): Promise<{ slice: ClientPortalSlice; order: WorkOrder } | null> {
  const db = loadDb();
  const orderHint = orderId
    ? db.workOrders.find((o) => o.id === orderId) ?? null
    : null;

  const { user } = await ensureClientForSign(db, phone, plate, orderHint);
  const order = pickWorkOrderForClient(db, user.id, orderId);
  if (!order) return null;

  saveDb(db, { skipCloudPush: true });
  const slice = sliceForClient(db, user.id);
  if (!slice) return null;

  return { slice, order };
}

export async function localChangeClientPassword(
  userId: string,
  currentPlate: string,
  newPlate: string
): Promise<"ok" | "invalid_current" | "invalid_new"> {
  const db = loadDb();
  const user = db.users.find((u) => u.id === userId && u.role === "client");
  if (!user?.passwordHash) return "invalid_current";

  const currentKey = normalizePlateKey(currentPlate);
  const valid = await verifyPassword(currentKey, user.passwordHash);
  if (!valid) return "invalid_current";

  const newKey = normalizePlateKey(newPlate);
  if (newKey.length < 2) return "invalid_new";

  user.passwordHash = await hashPassword(newKey);
  delete user.password;
  saveDb(db, { skipCloudPush: true });
  return "ok";
}

export async function pullClientPortalFromCloud(): Promise<ClientPortalSlice | null> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("bess-jwt") : null;
  if (!token) return null;

  try {
    const res = await clientAuthenticatedFetch("/api/client-portal", {
      cache: "no-store",
    });
    if (!res?.ok) return null;

    const data = (await res.json()) as { ok?: boolean; portal?: ClientPortalSlice };
    if (!data.ok || !data.portal) return null;

    mergeClientPortalIntoDb(data.portal);
    return data.portal;
  } catch {
    return null;
  }
}
