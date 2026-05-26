import type { OrderSignature, User, Vehicle, WorkOrder } from "@/lib/store";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";
import {
  cloudClientPortalAccess,
  type ClientPortalSlice,
} from "@/lib/server/client-portal-cloud";
import { ensureClientForSign, pickWorkOrderForClient } from "@/lib/client-sign";
import { normalizePhone, normalizePlateKey } from "@/lib/server/normalize-phone";

export type SignOrderPayload = {
  order: WorkOrder;
  client: User;
  vehicle: Vehicle | null;
  portal: ClientPortalSlice;
};

export async function cloudAccessSignOrder(
  phone: string,
  plate: string,
  orderId?: string
): Promise<SignOrderPayload | null> {
  const result = await cloudClientPortalAccess(phone, plate, orderId);
  if (!result) return null;

  const vehicle =
    result.slice.vehicles.find((v) => v.id === result.order.vehicleId) ?? null;

  return {
    order: result.order,
    client: result.slice.user,
    vehicle,
    portal: result.slice,
  };
}

/** @deprecated Use cloudAccessSignOrder */
export async function cloudVerifySignOrder(
  orderId: string,
  phone: string,
  plate?: string
): Promise<SignOrderPayload | null> {
  if (!plate?.trim()) return null;
  return cloudAccessSignOrder(phone, plate, orderId);
}

export async function cloudSubmitWorkOrderSignature(
  orderId: string,
  phone: string,
  plate: string,
  signature: OrderSignature,
  clientSignature: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const snap = await cloudGetCrmStore();
  if (!snap) return false;

  const db = snap.doc;
  const orderHint = db.workOrders.find((o) => o.id === orderId) ?? null;
  if (!orderHint) return false;

  try {
    await ensureClientForSign(db, phone, plate, orderHint);
  } catch {
    return false;
  }

  const order = pickWorkOrderForClient(db, orderHint.userId, orderId);
  if (!order || order.id !== orderId) return false;

  const client = db.users.find((u) => u.id === order.userId);
  if (!client || normalizePhone(client.phone) !== normalizePhone(phone)) {
    return false;
  }

  const plateKey = normalizePlateKey(plate);
  if (plateKey.length < 2) return false;

  const wo = db.workOrders.find((o) => o.id === orderId);
  if (!wo) return false;

  wo.confirmationStatus = "confirmed";
  wo.signature = signature;
  wo.clientSignature = clientSignature;
  wo.updatedAt = new Date().toISOString().slice(0, 10);
  wo.documentStatus =
    wo.status === "delivered"
      ? "delivered"
      : wo.status === "ready"
        ? "completed"
        : "signed";

  const result = await cloudPutCrmStore(db);
  return result.ok;
}
