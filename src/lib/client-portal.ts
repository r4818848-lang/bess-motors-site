"use client";

import { verifyPassword, hashPassword } from "@/lib/crypto";
import { normalizePlateKey } from "@/lib/auth";
import {
  ensureClientForSign,
  pickWorkOrderForClient,
  sliceForClient,
  type ClientPortalSlice,
} from "@/lib/client-sign";
import { loadDb, saveDb, type WorkOrder } from "@/lib/store";

export type { ClientPortalSlice };

export function mergeClientPortalIntoDb(slice: ClientPortalSlice): void {
  const db = loadDb();

  const ui = db.users.findIndex((u) => u.id === slice.user.id);
  if (ui >= 0) db.users[ui] = slice.user;
  else db.users.push(slice.user);

  for (const v of slice.vehicles) {
    const i = db.vehicles.findIndex((x) => x.id === v.id);
    if (i >= 0) db.vehicles[i] = v;
    else db.vehicles.push(v);
  }

  for (const o of slice.workOrders) {
    const i = db.workOrders.findIndex((x) => x.id === o.id);
    if (i >= 0) db.workOrders[i] = o;
    else db.workOrders.push(o);
  }

  for (const a of slice.appointments) {
    const i = db.appointments.findIndex((x) => x.id === a.id);
    if (i >= 0) db.appointments[i] = a;
    else db.appointments.push(a);
  }

  if (!db.notifications) db.notifications = [];
  for (const n of slice.notifications) {
    const i = db.notifications.findIndex((x) => x.id === n.id);
    if (i >= 0) db.notifications[i] = n;
    else db.notifications.push(n);
  }

  db.currentUserId = slice.user.id;
  saveDb(db, { skipCloudPush: true });
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

  const res = await fetch("/api/client-portal", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { ok?: boolean; portal?: ClientPortalSlice };
  if (!data.ok || !data.portal) return null;

  mergeClientPortalIntoDb(data.portal);
  return data.portal;
}
