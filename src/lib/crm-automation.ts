import { createWorkOrderFromAppointment } from "@/lib/create-work-order-from-booking";
import { handleWorkOrderClientNotifications } from "@/lib/client-notifications";
import { recomputeAllReferrals } from "@/lib/referral-system";
import { getPriceItem } from "@/lib/price-list";
import { syncWarehouseFromWorkOrder } from "@/lib/warehouse-stock";
import { calcClientTotal } from "@/lib/workorder-calc";
import type {
  AppSettings,
  Database,
  RepairStatus,
  WorkOrder,
} from "@/lib/store";

const VIP_SPEND_PLN = 3000;

export type WorkOrderAuditEntry = {
  at: string;
  field: string;
  from?: string;
  to?: string;
};

export type WorkOrderSlaLevel = "ok" | "warn" | "critical";

const ACTIVE: RepairStatus[] = ["received", "diagnostic", "repair", "waitingParts"];

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysSince(isoDate: string): number {
  const a = new Date(`${isoDate}T12:00:00`).getTime();
  const b = Date.now();
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

function pushAudit(order: WorkOrder, field: string, from?: string, to?: string): void {
  const log = order.auditLog ?? [];
  if (from === to) return;
  log.push({ at: new Date().toISOString(), field, from, to });
  order.auditLog = log.slice(-40);
}

function autoEstimateReady(order: WorkOrder, today: string): void {
  const offsets: Partial<Record<RepairStatus, number>> = {
    received: 3,
    diagnostic: 2,
    repair: 2,
    waitingParts: 5,
    ready: 0,
    delivered: 0,
  };
  const off = offsets[order.status] ?? 2;
  const eta = off === 0 ? today : addDays(today, off);
  if (order.estimatedReadyAt !== eta) {
    pushAudit(order, "estimatedReadyAt", order.estimatedReadyAt, eta);
    order.estimatedReadyAt = eta;
  }
}

function autoPartsPipeline(order: WorkOrder, prev?: WorkOrder): void {
  if (order.status === "waitingParts" && !order.clientPartsStatus) {
    order.clientPartsStatus = "ordered";
    pushAudit(order, "clientPartsStatus", undefined, "ordered");
  }
  if (
    prev?.status === "waitingParts" &&
    order.status === "repair" &&
    order.clientPartsStatus === "ordered"
  ) {
    order.clientPartsStatus = "arrived";
    pushAudit(order, "clientPartsStatus", "ordered", "arrived");
  }
}

function autoWarranty(order: WorkOrder, prev: WorkOrder | undefined, months: number): void {
  if (order.status !== "delivered" || prev?.status === "delivered") return;
  if (order.warrantyUntil) return;
  const until = addDays(order.updatedAt || new Date().toISOString().slice(0, 10), months * 30);
  order.warrantyUntil = until;
  pushAudit(order, "warrantyUntil", undefined, until);
}

function autoSla(order: WorkOrder): WorkOrderSlaLevel {
  if (!ACTIVE.includes(order.status)) {
    order.slaLevel = "ok";
    return "ok";
  }
  const days = daysSince(order.updatedAt);
  let level: WorkOrderSlaLevel = "ok";
  if (order.status === "waitingParts" && days >= 3) level = "warn";
  if (days >= 5) level = "critical";
  else if (days >= 3) level = "warn";
  order.slaLevel = level;
  return level;
}

function pickMechanicId(db: Database): string {
  const counts = new Map<string, number>();
  for (const m of db.mechanics) counts.set(m.id, 0);
  for (const o of db.workOrders) {
    if (ACTIVE.includes(o.status)) {
      counts.set(o.mechanicId, (counts.get(o.mechanicId) ?? 0) + 1);
    }
  }
  let best = db.mechanics[0]?.id ?? "mech-1";
  let min = Infinity;
  for (const [id, n] of counts) {
    if (n < min) {
      min = n;
      best = id;
    }
  }
  return best;
}

function autoMechanic(order: WorkOrder, db: Database): void {
  if (order.mechanicId && db.mechanics.some((m) => m.id === order.mechanicId)) return;
  const id = pickMechanicId(db);
  pushAudit(order, "mechanicId", order.mechanicId, id);
  order.mechanicId = id;
}

function autoConfirmWebBookings(db: Database, settings: AppSettings): void {
  if (settings.autoConfirmWebBookings === false) return;
  for (const apt of db.appointments) {
    if (apt.appointmentStatus !== "scheduled") continue;
    if (apt.source === "website") {
      apt.appointmentStatus = "confirmed";
    }
  }
}

function autoClientVipTags(db: Database): void {
  for (const u of db.users) {
    if (u.role !== "client") continue;
    const spend = db.workOrders
      .filter((o) => o.userId === u.id && o.status === "delivered")
      .reduce((s, o) => s + calcClientTotal(o), 0);
    const tags = new Set(u.clientTags ?? []);
    if (spend >= VIP_SPEND_PLN) tags.add("VIP");
    else tags.delete("VIP");
    const next = [...tags];
    if (JSON.stringify(next) !== JSON.stringify(u.clientTags ?? [])) {
      u.clientTags = next.length ? next : undefined;
    }
  }
}

function autoAppointments(db: Database, settings: AppSettings): number {
  if (settings.autoCreateWorkOrderFromBooking === false) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = addDays(today, 1);
  let created = 0;
  for (const apt of db.appointments) {
    if (apt.workOrderId) continue;
    if (apt.appointmentStatus === "cancelled" || apt.appointmentStatus === "completed") continue;
    if (apt.date !== today && apt.date !== tomorrow) continue;
    createWorkOrderFromAppointment(db, apt, (id) => getPriceItem(id)?.namePl ?? id);
    created++;
  }
  return created;
}

function autoSyncOrders(db: Database, prev?: Database): void {
  const today = new Date().toISOString().slice(0, 10);
  for (const order of db.workOrders) {
    const p = prev?.workOrders.find((x) => x.id === order.id);
    order.updatedAt = order.updatedAt || today;
    autoMechanic(order, db);
    autoEstimateReady(order, today);
    autoPartsPipeline(order, p);
    autoWarranty(order, p, db.settings.defaultWarrantyMonths ?? 12);
    autoSla(order);
    if (order.status === "ready" && !order.readyNotifiedAt) {
      order.readyNotifiedAt = new Date().toISOString();
    }
    if (p && JSON.stringify(p) !== JSON.stringify(order)) {
      handleWorkOrderClientNotifications(db, order, p);
    }
    if (order.status === "delivered" && p?.status !== "delivered") {
      syncWarehouseFromWorkOrder(db, order);
    }
  }
}

/** Run all CRM automations in-place on db. Returns summary for logs. */
export function runCrmAutomation(
  db: Database,
  prev?: Database | null
): { createdWorkOrders: number } {
  if (db.settings.automationDisabled) {
    return { createdWorkOrders: 0 };
  }

  autoConfirmWebBookings(db, db.settings);
  const created = autoAppointments(db, db.settings);
  autoSyncOrders(db, prev ?? undefined);
  autoClientVipTags(db);
  recomputeAllReferrals(db);
  return { createdWorkOrders: created };
}

export function getActiveWorkOrder(
  db: Database,
  userId: string
): WorkOrder | undefined {
  return db.workOrders
    .filter((o) => o.userId === userId && o.status !== "delivered")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}
