import { handleWorkOrderClientNotifications } from "@/lib/client-notifications";
import { applyWorkOrderCompletedAt } from "@/lib/work-order-dates";
import { applyWorkOrderClosure } from "@/lib/work-order-lifecycle";
import { syncWarehouseFromWorkOrder } from "@/lib/warehouse-stock";
import {
  deriveDocumentStatus,
  loadDb,
  saveDb,
  type Database,
  type RepairStatus,
  type WorkOrder,
} from "@/lib/store";

/** Apply status change in-memory (notifications + lifecycle). */
export function patchWorkOrderStatus(
  db: Database,
  orderId: string,
  status: RepairStatus
): WorkOrder | null {
  const idx = db.workOrders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;
  const previous = { ...db.workOrders[idx] };
  const order = db.workOrders[idx];
  let next: WorkOrder = {
    ...order,
    status,
    updatedAt: new Date().toISOString(),
    documentStatus:
      status === "delivered"
        ? "delivered"
        : order.documentStatus && order.confirmationStatus === "confirmed"
          ? order.documentStatus
          : deriveDocumentStatus(status, order.confirmationStatus),
  };
  if (status === "delivered") {
    next = applyWorkOrderClosure(next);
  }
  const updated = applyWorkOrderCompletedAt(next);
  db.workOrders[idx] = updated;
  handleWorkOrderClientNotifications(db, updated, previous);
  return updated;
}

/** Persist status change to local DB and schedule cloud push. */
export function saveWorkOrderStatus(orderId: string, status: RepairStatus): boolean {
  const fresh = loadDb();
  const updated = patchWorkOrderStatus(fresh, orderId, status);
  if (!updated) return false;
  saveDb(syncWarehouseFromWorkOrder(fresh, updated));
  return true;
}

/** Status change + immediate CRM cloud push (kanban, list actions). */
export async function saveWorkOrderStatusAndSync(
  orderId: string,
  status: RepairStatus
): Promise<boolean> {
  const fresh = loadDb();
  const updated = patchWorkOrderStatus(fresh, orderId, status);
  if (!updated) return false;
  const next = syncWarehouseFromWorkOrder(fresh, updated);
  const { saveDbAndPushCrm } = await import("@/lib/cloud-crm-db");
  return saveDbAndPushCrm(next);
}
