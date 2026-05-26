import { normalizePhone, normalizePlateKey } from "@/lib/server/normalize-phone";
import type { Database, OrderSignature, User, Vehicle, WorkOrder } from "@/lib/store";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { isSupabaseConfigured } from "@/lib/server/supabase-config";

export type SignOrderPayload = {
  order: WorkOrder;
  client: User;
  vehicle: Vehicle | null;
};

function orderAccessOk(
  db: Database,
  orderId: string,
  phone: string,
  plate?: string
): { order: WorkOrder; clientName: string } | null {
  const order = db.workOrders.find((o) => o.id === orderId);
  if (!order) return null;

  const client = db.users.find((u) => u.id === order.userId);
  if (!client) return null;

  if (normalizePhone(phone) !== normalizePhone(client.phone)) return null;

  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  if (vehicle?.plate?.trim()) {
    const plateKey = normalizePlateKey(plate ?? "");
    if (!plateKey || normalizePlateKey(vehicle.plate) !== plateKey) return null;
  }

  return { order, clientName: client.name };
}

export async function cloudVerifySignOrder(
  orderId: string,
  phone: string,
  plate?: string
): Promise<SignOrderPayload | null> {
  if (!isSupabaseConfigured()) return null;
  const snap = await cloudGetCrmStore();
  if (!snap) return null;

  const match = orderAccessOk(snap.doc, orderId, phone, plate);
  if (!match) return null;

  const client = snap.doc.users.find((u) => u.id === match.order.userId)!;
  const vehicle = snap.doc.vehicles.find((v) => v.id === match.order.vehicleId) ?? null;

  return {
    order: match.order,
    client,
    vehicle,
  };
}

export async function cloudSubmitWorkOrderSignature(
  orderId: string,
  phone: string,
  plate: string | undefined,
  signature: OrderSignature,
  clientSignature: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const snap = await cloudGetCrmStore();
  if (!snap) return false;

  const match = orderAccessOk(snap.doc, orderId, phone, plate);
  if (!match) return false;

  const db = snap.doc;
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
