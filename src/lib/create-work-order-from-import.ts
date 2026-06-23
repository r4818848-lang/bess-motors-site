import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import { createCrmClientWithVehicle } from "@/lib/crm-create-client";
import { storeUnitPriceFromDisplay } from "@/lib/crm-display-price";
import type { ImportWorkOrderDraft } from "@/lib/motowarsztat-import-parser";
import { generateOrderNumber } from "@/lib/workorder-calc";
import { applyWorkOrderCompletedAt } from "@/lib/work-order-dates";
import { applyWorkOrderClosure } from "@/lib/work-order-lifecycle";
import { applyKnownScreenshotToOrder } from "@/lib/apply-known-screenshot-to-order";
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

function findVehicleForVin(db: Database, userId: string, vin?: string) {
  const key = vin?.trim().toUpperCase();
  if (!key) return undefined;
  return db.vehicles.find(
    (v) => v.userId === userId && v.vin?.trim().toUpperCase() === key
  );
}

function findVehicleForPlate(db: Database, userId: string, plate: string) {
  const key = normalizePlateKey(plate);
  return db.vehicles.find(
    (v) => v.userId === userId && normalizePlateKey(v.plate) === key
  );
}

function mapImportServices(
  draft: ImportWorkOrderDraft,
  defaultMechanicId: string,
  vatRate: number,
  vatEnabled: boolean
): WorkOrderLine[] {
  const ts = Date.now();
  return draft.services
    .filter((s) => s.name.trim())
    .map((s, i) => ({
      id: `s-imp-${ts}-${i}`,
      name: s.name.trim(),
      qty: s.qty > 0 ? s.qty : 1,
      price: storeUnitPriceFromDisplay(
        Math.max(0, s.price) / (s.qty > 0 ? s.qty : 1),
        "gross",
        vatRate,
        vatEnabled
      ),
      discount: 0,
      mechanicId: defaultMechanicId || undefined,
    }));
}

function mapImportParts(
  draft: ImportWorkOrderDraft,
  vatRate: number,
  vatEnabled: boolean
): PartLine[] {
  const ts = Date.now();
  return draft.parts
    .filter((p) => p.name.trim())
    .map((p, i) => ({
      id: `p-imp-${ts}-${i}`,
      name: p.name.trim(),
      partNumber: p.partNumber ?? "",
      supplier: "",
      qty: p.qty > 0 ? p.qty : 1,
      purchasePrice: storeUnitPriceFromDisplay(
        Math.max(0, p.purchasePrice),
        "gross",
        vatRate,
        vatEnabled
      ),
      sellPrice: storeUnitPriceFromDisplay(
        Math.max(0, p.sellPrice) / (p.qty > 0 ? p.qty : 1),
        "gross",
        vatRate,
        vatEnabled
      ),
      discount: 0,
    }));
}

function parseOrderDateFromNumber(orderNumber?: string): string | undefined {
  const m = orderNumber?.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (!m) return undefined;
  const [, day, month, year] = m;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
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
      if (!vehicleId && input.vin?.trim()) {
        const byVin = findVehicleForVin(db, userId, input.vin);
        if (byVin) {
          vehicleId = byVin.id;
          if (input.make?.trim()) byVin.make = input.make.trim();
          if (input.model?.trim()) byVin.model = input.model.trim();
          if (input.mileage != null && input.mileage > 0) byVin.mileage = input.mileage;
        } else {
          const created = await createCrmClientWithVehicle(db, {
            phone,
            name: user.name,
            vin: input.vin,
            make: input.make,
            model: input.model,
            mileage: input.mileage,
          });
          if (created.ok) vehicleId = created.vehicleId;
        }
      }
      if (!vehicleId) {
        const created = await createCrmClientWithVehicle(db, {
          phone,
          name: user.name,
          plate: plateRaw !== "—" ? plateRaw : undefined,
          vin: input.vin,
          make: input.make,
          model: input.model,
          mileage: input.mileage,
        });
        if (created.ok) vehicleId = created.vehicleId;
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

  const orderDate =
    parseOrderDateFromNumber(input.orderNumber) ??
    new Date().toISOString().slice(0, 10);

  const vatEnabled = db.settings.vatEnabledByDefault ?? true;
  const vatRate = db.settings.vatRate ?? 23;

  const order: WorkOrder = applyWorkOrderCompletedAt(
    applyWorkOrderClosure({
    id: `wo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    number: input.orderNumber?.trim() || generateOrderNumber(db.workOrders),
    userId,
    vehicleId,
    status: "delivered",
    services: mapImportServices(
      input,
      db.mechanics[0]?.id ?? "",
      vatRate,
      vatEnabled
    ),
    parts: mapImportParts(input, vatRate, vatEnabled),
    mechanicId: db.mechanics[0]?.id ?? "",
    mechanicLaborPercent: -1,
    mechanicPartsPercent: -1,
    orderDiscount: 0,
    internalNotes: input.internalNotes ?? "",
    clientNotes: "",
    files,
    createdAt: orderDate,
    updatedAt: `${orderDate}T12:00:00.000Z`,
    confirmationStatus: "confirmed",
    documentStatus: "delivered",
    vatEnabled,
    paymentStatus: "paid",
    signatureMode: "electronic",
    receptionChecklist: {},
    completedAt: orderDate,
  })
  );

  applyKnownScreenshotToOrder(order, vatRate);

  db.workOrders.push(order);
  syncWarehouseFromWorkOrder(db, order);

  return { ok: true, orderId: order.id, orderNumber: order.number };
}
