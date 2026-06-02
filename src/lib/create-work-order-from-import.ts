import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import { createCrmClientWithVehicle } from "@/lib/crm-create-client";
import type { ImportWorkOrderDraft } from "@/lib/motowarsztat-import-parser";
import { generateOrderNumber } from "@/lib/workorder-calc";
import { applyWorkOrderCompletedAt } from "@/lib/work-order-dates";
import { handleWorkOrderClientNotifications } from "@/lib/client-notifications";
import { syncWarehouseFromWorkOrder } from "@/lib/warehouse-stock";
import type {
  AttachedFile,
  Database,
  PartLine,
  WorkOrder,
  WorkOrderLine,
} from "@/lib/store";

export type CreateFromImportInput = ImportWorkOrderDraft & {
  attachment?: {
    name: string;
    mime: string;
    dataUrl: string;
  };
};

export type CreateFromImportResult =
  | { ok: true; orderId: string; orderNumber: string }
  | { ok: false; error: string };

function findClientByPhone(db: Database, phone: string) {
  const key = normalizePhone(phone);
  return db.users.find((u) => u.role === "client" && normalizePhone(u.phone) === key);
}

function findVehicleForPlate(db: Database, userId: string, plate: string) {
  const key = normalizePlateKey(plate);
  return db.vehicles.find(
    (v) => v.userId === userId && normalizePlateKey(v.plate) === key
  );
}

function mapImportServices(draft: ImportWorkOrderDraft): WorkOrderLine[] {
  const ts = Date.now();
  return draft.services
    .filter((s) => s.name.trim())
    .map((s, i) => ({
      id: `s-imp-${ts}-${i}`,
      name: s.name.trim(),
      qty: s.qty > 0 ? s.qty : 1,
      price: Math.max(0, s.price),
      discount: 0,
    }));
}

function mapImportParts(draft: ImportWorkOrderDraft): PartLine[] {
  const ts = Date.now();
  return draft.parts
    .filter((p) => p.name.trim())
    .map((p, i) => ({
      id: `p-imp-${ts}-${i}`,
      name: p.name.trim(),
      partNumber: p.partNumber ?? "",
      supplier: "",
      qty: p.qty > 0 ? p.qty : 1,
      purchasePrice: Math.max(0, p.purchasePrice),
      sellPrice: Math.max(0, p.sellPrice),
      discount: 0,
    }));
}

export async function createWorkOrderFromImport(
  db: Database,
  input: CreateFromImportInput
): Promise<CreateFromImportResult> {
  const phone = input.phone?.trim();
  const plateRaw = input.plate?.trim() || "—";
  const name = input.clientName?.trim() || "Klient (import)";

  let userId = "";
  let vehicleId = "";

  if (phone) {
    let user = findClientByPhone(db, phone);
    if (!user) {
      const created = await createCrmClientWithVehicle(db, {
        phone,
        name,
        plate: plateRaw !== "—" ? plateRaw : undefined,
        vin: input.vin,
        make: input.make,
        model: input.model,
        mileage: input.mileage,
      });
      if (!created.ok) {
        return { ok: false, error: created.error };
      }
      userId = created.userId;
      vehicleId = created.vehicleId;
    } else {
      userId = user.id;
      if (plateRaw !== "—") {
        const v = findVehicleForPlate(db, userId, plateRaw);
        if (v) {
          vehicleId = v.id;
          if (input.vin?.trim()) v.vin = input.vin.trim();
          if (input.make?.trim()) v.make = input.make.trim();
          if (input.model?.trim()) v.model = input.model.trim();
          if (input.mileage != null && input.mileage > 0) v.mileage = input.mileage;
        } else {
          const created = await createCrmClientWithVehicle(db, {
            phone,
            name: user.name,
            plate: plateRaw,
            vin: input.vin,
            make: input.make,
            model: input.model,
            mileage: input.mileage,
          });
          if (created.ok) vehicleId = created.vehicleId;
        }
      }
      if (!vehicleId) {
        const first = db.vehicles.find((v) => v.userId === userId);
        if (first) {
          vehicleId = first.id;
          if (input.vin?.trim()) first.vin = input.vin.trim();
          if (input.make?.trim()) first.make = input.make.trim();
          if (input.model?.trim()) first.model = input.model.trim();
          if (input.mileage != null && input.mileage > 0) first.mileage = input.mileage;
        }
      }
    }
  } else {
    return { ok: false, error: "phone_required" };
  }

  if (!userId || !vehicleId) {
    return { ok: false, error: "client_vehicle_required" };
  }

  const files: AttachedFile[] = [];
  if (input.attachment?.dataUrl) {
    files.push({
      id: `f-imp-${Date.now()}`,
      name: input.attachment.name,
      type: input.attachment.mime === "application/pdf" ? "pdf" : "image",
      category: "document",
      dataUrl: input.attachment.dataUrl,
      uploadedAt: new Date().toISOString(),
    });
  }

  const order: WorkOrder = applyWorkOrderCompletedAt({
    id: `wo-${Date.now()}`,
    number: input.orderNumber?.trim() || generateOrderNumber(db.workOrders),
    userId,
    vehicleId,
    status: "received",
    services: mapImportServices(input),
    parts: mapImportParts(input),
    mechanicId: db.mechanics[0]?.id ?? "",
    mechanicLaborPercent: -1,
    mechanicPartsPercent: -1,
    orderDiscount: 0,
    internalNotes: input.internalNotes ?? "",
    clientNotes: "",
    files,
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
