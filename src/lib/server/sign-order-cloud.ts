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
): Promise<{ ok: true; order: WorkOrder } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "cloud_disabled" };
  const snap = await cloudGetCrmStore();
  if (!snap) return { ok: false, error: "cloud_read_failed" };

  const db = snap.doc;
  const orderHint = db.workOrders.find((o) => o.id === orderId) ?? null;
  if (!orderHint) return { ok: false, error: "order_not_found" };

  try {
    await ensureClientForSign(db, phone, plate, orderHint);
  } catch {
    return { ok: false, error: "client_verify_failed" };
  }

  const order = pickWorkOrderForClient(db, orderHint.userId, orderId);
  if (!order || order.id !== orderId) {
    return { ok: false, error: "order_not_found" };
  }

  const client = db.users.find((u) => u.id === order.userId);
  if (!client || normalizePhone(client.phone) !== normalizePhone(phone)) {
    return { ok: false, error: "phone_mismatch" };
  }

  const plateKey = normalizePlateKey(plate);
  if (plateKey.length < 2) return { ok: false, error: "invalid_plate" };

  const wo = db.workOrders.find((o) => o.id === orderId);
  if (!wo) return { ok: false, error: "order_not_found" };

  wo.confirmationStatus = "confirmed";
  wo.signature = signature;
  wo.clientSignature = clientSignature;
  wo.updatedAt = new Date().toISOString();
  wo.documentStatus =
    wo.status === "delivered"
      ? "delivered"
      : wo.status === "ready"
        ? "completed"
        : "signed";

  const result = await cloudPutCrmStore(db);
  if (!result.ok) {
    return { ok: false, error: result.error ?? "cloud_save_failed" };
  }
  return { ok: true, order: { ...wo } };
}
