import { normalizePhone } from "@/lib/auth";
import { handleWorkOrderClientNotifications } from "@/lib/client-notifications";
import { createWorkOrderFromAppointment } from "@/lib/create-work-order-from-booking";
import { getPriceItem } from "@/lib/price-list";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import type {
  Database,
  ExpenseCategory,
  RepairStatus,
  ServiceExpense,
  WorkOrder,
} from "@/lib/store";
import { calcClientTotal } from "@/lib/workorder-calc";
import { parseFlexibleDateKey } from "@/lib/display-date";

export async function loadCrmFromCloud(): Promise<Database | null> {
  const snap = await cloudGetCrmStore();
  return snap?.doc ?? null;
}

export async function mutateCrm(
  mutator: (db: Database) => void | string | false
): Promise<{ ok: boolean; error?: string; result?: string }> {
  return cloudMutateCrmStore(mutator);
}

function findOrder(db: Database, orderNumber: string): WorkOrder | undefined {
  return db.workOrders.find((x) => x.number === orderNumber);
}

function serviceLabel(id: string): string {
  return getPriceItem(id)?.nameRu ?? id;
}

export async function applyWorkOrderStatus(
  orderNumber: string,
  status: RepairStatus
): Promise<{ ok: boolean; error?: string }> {
  const snap = await cloudGetCrmStore();
  const previous = snap?.doc
    ? structuredClone(findOrder(snap.doc as Database, orderNumber))
    : undefined;

  const result = await mutateCrm((db) => {
    const order = findOrder(db, orderNumber);
    if (!order) return false;
    const prev = { ...order };
    order.status = status;
    order.updatedAt = new Date().toISOString();
    handleWorkOrderClientNotifications(db, order, prev);
    return orderNumber;
  });

  if (result.ok && previous) {
    const snap2 = await cloudGetCrmStore();
    const order = snap2?.doc ? findOrder(snap2.doc as Database, orderNumber) : undefined;
    if (order) {
      const { runReferralTelegramEffects } = await import("@/lib/server/referral-telegram-notify");
      await runReferralTelegramEffects(snap2!.doc as Database, order, previous);
    }
  }

  return result;
}

export async function markWorkOrderPaid(
  orderNumber: string,
  paid: boolean
): Promise<{ ok: boolean; error?: string }> {
  const snap = await cloudGetCrmStore();
  const previous = snap?.doc
    ? structuredClone(findOrder(snap.doc as Database, orderNumber))
    : undefined;

  const result = await mutateCrm((db) => {
    const order = findOrder(db, orderNumber);
    if (!order) return false;
    const prev = { ...order };
    order.paymentStatus = paid ? "paid" : "unpaid";
    order.updatedAt = new Date().toISOString();
    handleWorkOrderClientNotifications(db, order, prev);
    return orderNumber;
  });

  if (result.ok && previous) {
    const snap2 = await cloudGetCrmStore();
    const order = snap2?.doc
      ? findOrder(snap2.doc as Database, orderNumber)
      : undefined;
    if (order) {
      const { runReferralTelegramEffects } = await import("@/lib/server/referral-telegram-notify");
      await runReferralTelegramEffects(snap2!.doc as Database, order, previous);
    }
  }

  return result;
}

export async function confirmHotBooking(aptId: string): Promise<{ ok: boolean; error?: string; woNumber?: string }> {
  const res = await mutateCrm((db) => {
    const apt = db.appointments.find((x) => x.id === aptId);
    if (!apt) return false;
    createWorkOrderFromAppointment(db, apt, serviceLabel);
    const wo = db.workOrders.find((o) => o.id === apt.workOrderId);
    return wo?.number ?? apt.workOrderId ?? "";
  });
  return { ok: res.ok, error: res.error, woNumber: res.result };
}

export async function markCallAsCalled(callId: string): Promise<{ ok: boolean; error?: string }> {
  return mutateCrm((db) => {
    const call = db.callRequests.find((x) => x.id === callId);
    if (!call) return false;
    call.status = "called";
    return callId;
  });
}

export async function addExpenseToCrm(expense: Omit<ServiceExpense, "id">): Promise<{ ok: boolean; error?: string }> {
  return mutateCrm((db) => {
    db.expenses.push({
      id: `ex-${Date.now()}`,
      ...expense,
    });
  });
}

export function parseExpenseInput(
  text: string,
  category: ExpenseCategory
): { ok: true; expense: Omit<ServiceExpense, "id"> } | { ok: false } {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\d+(?:[.,]\d{1,2})?)\s+(.+)$/);
  if (!match) return { ok: false };

  const amount = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false };

  let rest = match[2].trim();
  let date = new Date().toISOString().slice(0, 10);
  const isoDateMatch = rest.match(/\s(\d{4}-\d{2}-\d{2})$/);
  const euDateMatch = rest.match(/\s(\d{1,2}\.\d{1,2}\.\d{4})$/);
  if (isoDateMatch) {
    date = isoDateMatch[1];
    rest = rest.slice(0, -isoDateMatch[0].length).trim();
  } else if (euDateMatch) {
    const parsed = parseFlexibleDateKey(euDateMatch[1]);
    if (!parsed) return { ok: false };
    date = parsed;
    rest = rest.slice(0, -euDateMatch[0].length).trim();
  }
  if (!rest) return { ok: false };

  return {
    ok: true,
    expense: { category, description: rest, amount, date },
  };
}

export function isValidDateKey(s: string): boolean {
  return parseFlexibleDateKey(s) !== null;
}

export function normalizeDateKey(s: string): string | null {
  return parseFlexibleDateKey(s);
}

export type SearchHit =
  | { kind: "order"; order: WorkOrder; label: string }
  | { kind: "client"; name: string; phone: string; userId: string }
  | { kind: "vehicle"; plate: string; make: string; model: string; userId: string };

export function searchCrm(db: Database, query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const hits: SearchHit[] = [];
  const phoneDigits = q.replace(/\D/g, "");
  const plateKey = q.replace(/\s/g, "").replace(/-/g, "").toUpperCase();

  for (const o of db.workOrders) {
    if (
      o.number.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    ) {
      const vehicle = db.vehicles.find((v) => v.id === o.vehicleId);
      hits.push({
        kind: "order",
        order: o,
        label: `${o.number} · ${vehicle?.plate ?? "—"}`,
      });
    }
  }

  for (const u of db.users.filter((x) => x.role === "client")) {
    const phone = normalizePhone(u.phone);
    if (
      u.name.toLowerCase().includes(q) ||
      (phoneDigits && phone.replace(/\D/g, "").includes(phoneDigits))
    ) {
      hits.push({ kind: "client", name: u.name, phone: u.phone, userId: u.id });
    }
  }

  for (const v of db.vehicles) {
    const pk = v.plate.replace(/\s/g, "").replace(/-/g, "").toUpperCase();
    if (
      pk.includes(plateKey) ||
      v.vin.toLowerCase().includes(q) ||
      `${v.make} ${v.model}`.toLowerCase().includes(q)
    ) {
      hits.push({
        kind: "vehicle",
        plate: v.plate,
        make: v.make,
        model: v.model,
        userId: v.userId,
      });
    }
  }

  const seen = new Set<string>();
  return hits.filter((h) => {
    const key =
      h.kind === "order"
        ? `o:${h.order.id}`
        : h.kind === "client"
          ? `c:${h.userId}`
          : `v:${h.plate}:${h.userId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

export function getUnpaidOrders(db: Database): { order: WorkOrder; total: number }[] {
  return db.workOrders
    .filter((o) => o.paymentStatus !== "paid")
    .map((o) => ({ order: o, total: calcClientTotal(o) }))
    .sort((a, b) => b.total - a.total);
}
