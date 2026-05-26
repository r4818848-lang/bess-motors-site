import { hashPassword } from "@/lib/crypto";
import {
  ensureClientForSign,
  pickWorkOrderForClient,
  sliceForClient,
  type ClientPortalSlice,
} from "@/lib/client-sign";
import { normalizePlateKey } from "@/lib/server/normalize-phone";
import { verifyPassword } from "@/lib/crypto";
import type { WorkOrder } from "@/lib/store";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";

export type { ClientPortalSlice };

export async function cloudClientPortalAccess(
  phone: string,
  plate: string,
  orderId?: string
): Promise<{ slice: ClientPortalSlice; order: WorkOrder } | null> {
  if (!isSupabaseConfigured()) return null;
  const snap = await cloudGetCrmStore();
  if (!snap) return null;

  const db = snap.doc;
  const orderHint = orderId
    ? db.workOrders.find((o) => o.id === orderId) ?? null
    : null;

  const { user } = await ensureClientForSign(db, phone, plate, orderHint);
  const order = pickWorkOrderForClient(db, user.id, orderId);
  if (!order) return null;

  const put = await cloudPutCrmStore(db);
  if (!put.ok) return null;

  const slice = sliceForClient(db, user.id);
  if (!slice) return null;

  return { slice, order };
}

export async function cloudGetClientPortal(userId: string): Promise<ClientPortalSlice | null> {
  if (!isSupabaseConfigured()) return null;
  const snap = await cloudGetCrmStore();
  if (!snap) return null;
  return sliceForClient(snap.doc, userId);
}

export async function cloudChangeClientPassword(
  userId: string,
  currentPlate: string,
  newPlate: string
): Promise<"ok" | "invalid_current" | "invalid_new" | "cloud_error"> {
  if (!isSupabaseConfigured()) return "cloud_error";
  const snap = await cloudGetCrmStore();
  if (!snap) return "cloud_error";

  const user = snap.doc.users.find((u) => u.id === userId && u.role === "client");
  if (!user?.passwordHash) return "invalid_current";

  const currentKey = normalizePlateKey(currentPlate);
  const valid = await verifyPassword(currentKey, user.passwordHash);
  if (!valid) return "invalid_current";

  const newKey = normalizePlateKey(newPlate);
  if (newKey.length < 2) return "invalid_new";

  user.passwordHash = await hashPassword(newKey);
  delete user.password;

  const put = await cloudPutCrmStore(snap.doc);
  return put.ok ? "ok" : "cloud_error";
}
