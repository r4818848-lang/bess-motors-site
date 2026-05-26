import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import type { Database, WorkOrder } from "@/lib/store";

const SIGN_ACCESS_PREFIX = "bess-sign-access-";

export function setSignOrderAccess(orderId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${SIGN_ACCESS_PREFIX}${orderId}`, String(Date.now()));
}

export function hasSignOrderAccess(orderId: string): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(sessionStorage.getItem(`${SIGN_ACCESS_PREFIX}${orderId}`));
}

/** Match order owner by phone; optional plate when vehicle exists */
export function verifyLocalSignAccess(
  db: Database,
  orderId: string,
  phone: string,
  plate?: string
): boolean {
  const order = db.workOrders.find((o) => o.id === orderId);
  if (!order) return false;

  const client = db.users.find((u) => u.id === order.userId);
  if (!client) return false;

  if (normalizePhone(phone) !== normalizePhone(client.phone)) return false;

  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  if (vehicle?.plate?.trim()) {
    const plateKey = normalizePlateKey(plate ?? "");
    if (!plateKey || normalizePlateKey(vehicle.plate) !== plateKey) return false;
  }

  return true;
}

export function getWorkOrderForSign(db: Database, orderId: string): WorkOrder | null {
  return db.workOrders.find((o) => o.id === orderId) ?? null;
}
