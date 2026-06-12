import { normalizePhone } from "@/lib/auth";
import { createCrmClientWithVehicle } from "@/lib/crm-create-client";
import { handleWorkOrderClientNotifications } from "@/lib/client-notifications";
import { applyWorkOrderCompletedAt } from "@/lib/work-order-dates";
import { syncWarehouseFromWorkOrder } from "@/lib/warehouse-stock";
import type { Database, WorkOrder, WorkOrderLine } from "@/lib/store";
import { generateOrderNumber } from "@/lib/workorder-calc";

export type QuickWorkOrderDraft = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  plate?: string;
  make?: string;
  model?: string;
  mileage?: number;
  work?: string;
  internalNotes?: string;
};

export type QuickWorkOrderResult =
  | { ok: true; orderId: string; orderNumber: string }
  | {
      ok: false;
      error: "phone_required" | "name_required" | "client_vehicle_required" | string;
    };

export function buildClientDisplayName(draft: QuickWorkOrderDraft): string {
  const parts = [draft.firstName?.trim(), draft.lastName?.trim()].filter(Boolean);
  return parts.join(" ").trim() || "Klient";
}

export function parseMakeModelLine(text: string): { make?: string; model?: string } {
  const trimmed = text.trim();
  if (!trimmed) return {};
  const space = trimmed.indexOf(" ");
  if (space === -1) return { make: trimmed };
  return {
    make: trimmed.slice(0, space).trim(),
    model: trimmed.slice(space + 1).trim(),
  };
}

export async function createQuickWorkOrderFromTelegram(
  db: Database,
  draft: QuickWorkOrderDraft
): Promise<QuickWorkOrderResult> {
  const phone = normalizePhone(draft.phone?.trim() ?? "");
  if (!phone) return { ok: false, error: "phone_required" };

  const name = buildClientDisplayName(draft);
  const plate = draft.plate?.trim() || undefined;
  const make = draft.make?.trim() || undefined;
  const model = draft.model?.trim() || undefined;

  const client = await createCrmClientWithVehicle(db, {
    phone,
    name,
    plate,
    make,
    model,
    mileage: draft.mileage,
    contactFirstName: draft.firstName?.trim() || undefined,
    contactLastName: draft.lastName?.trim() || undefined,
  });

  if (!client.ok) {
    return { ok: false, error: client.error };
  }

  const defaultMechanicId = db.mechanics[0]?.id ?? "";
  const workName = draft.work?.trim();
  const services: WorkOrderLine[] = workName
    ? [
        {
          id: `s-qwo-${Date.now()}`,
          name: workName,
          qty: 1,
          price: 0,
          discount: 0,
          mechanicId: defaultMechanicId || undefined,
        },
      ]
    : [{ id: `s-qwo-${Date.now()}`, name: "—", qty: 1, price: 0, discount: 0, mechanicId: defaultMechanicId || undefined }];

  const internalNotes = [draft.internalNotes?.trim(), "Создано: Telegram CRM"]
    .filter(Boolean)
    .join("\n");

  const order: WorkOrder = applyWorkOrderCompletedAt({
    id: `wo-${Date.now()}`,
    number: generateOrderNumber(db.workOrders),
    userId: client.userId,
    vehicleId: client.vehicleId,
    status: "received",
    services,
    parts: [],
    mechanicId: defaultMechanicId,
    mechanicLaborPercent: -1,
    mechanicPartsPercent: -1,
    orderDiscount: 0,
    internalNotes,
    clientNotes: "",
    files: [],
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString(),
    confirmationStatus: "awaiting_confirmation",
    documentStatus: "awaiting_signature",
    vatEnabled: db.settings.vatEnabledByDefault ?? true,
    paymentStatus: "unpaid",
    signatureMode: "electronic",
    receptionChecklist: {},
  });

  db.workOrders.push(order);
  handleWorkOrderClientNotifications(db, order, null);
  syncWarehouseFromWorkOrder(db, order);

  return { ok: true, orderId: order.id, orderNumber: order.number };
}
