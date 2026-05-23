"use client";

export type RepairStatus =
  | "received"
  | "diagnostic"
  | "repair"
  | "waitingParts"
  | "ready"
  | "delivered";

export type ExpenseCategory =
  | "rent"
  | "tax"
  | "purchase"
  | "tools"
  | "utilities"
  | "marketing"
  | "salary"
  | "other";

export type FileCategory = "before" | "after" | "repair" | "invoice" | "warranty" | "document" | "internal";

export interface Vehicle {
  id: string;
  vin: string;
  plate: string;
  mileage: number;
  make: string;
  model: string;
  engine: string;
  engineVolume?: string;
  trim: string;
  power: string;
  transmission: string;
  drivetrain?: string;
  year?: string;
  color?: string;
  fuelType?: string;
  notes?: string;
  userId: string;
}

export interface VehicleHistoryEntry {
  id: string;
  vehicleId: string;
  userId: string;
  changedAt: string;
  changedBy: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  /** PBKDF2 hash — preferred */
  passwordHash?: string;
  /** Legacy plain password (migrated on login) */
  password?: string;
  name: string;
  role: "client" | "admin" | "mechanic";
  createdAt: string;
}

export type ConfirmationStatus = "awaiting_confirmation" | "confirmed";

/** Client-facing document lifecycle */
export type DocumentStatus =
  | "awaiting_signature"
  | "signed"
  | "in_progress"
  | "completed"
  | "delivered";

export interface OrderSignature {
  dataUrl: string;
  signedAt: string;
  signedBy: string;
  ip: string;
  userAgent: string;
  deviceInfo?: string;
  priceAgreed: boolean;
  repairAgreed: boolean;
  confirmationText?: string;
}

export interface WorkOrderLine {
  id: string;
  name: string;
  qty: number;
  price: number;
  discount: number;
}

export interface PartLine {
  id: string;
  name: string;
  /** Catalog / OEM number — CRM only */
  partNumber?: string;
  /** Supplier / brand — CRM only */
  supplier?: string;
  qty: number;
  purchasePrice: number;
  sellPrice: number;
  discount: number;
}

export type PaymentMethod =
  | "cash"
  | "cash_receipt"
  | "card"
  | "transfer"
  | "blik"
  | "card_cash";

export type PaymentStatus = "unpaid" | "paid";

export interface AttachedFile {
  id: string;
  name: string;
  type: "pdf" | "image" | "video" | "document";
  category: FileCategory;
  dataUrl?: string;
  uploadedAt: string;
}

export interface WorkOrder {
  id: string;
  number: string;
  userId: string;
  vehicleId: string;
  status: RepairStatus;
  services: WorkOrderLine[];
  parts: PartLine[];
  mechanicId: string;
  /** % from labor; -1 = use mechanic/settings default */
  mechanicLaborPercent: number;
  /** % from parts profit; -1 = use mechanic/settings default */
  mechanicPartsPercent: number;
  orderDiscount: number;
  internalNotes: string;
  clientNotes: string;
  files: AttachedFile[];
  warrantyUntil?: string;
  createdAt: string;
  updatedAt: string;
  confirmationStatus: ConfirmationStatus;
  documentStatus?: DocumentStatus;
  /** VAT on client total (net + VAT) */
  vatEnabled?: boolean;
  signature?: OrderSignature;
  /** @deprecated use signature.dataUrl */
  clientSignature?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  /** For paymentMethod card_cash — cash portion (PLN) */
  paidCashAmount?: number;
  /** For paymentMethod card_cash — card/transfer portion (PLN) */
  paidCardAmount?: number;
}

export interface ServiceExpense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
}

export interface MechanicProfile {
  id: string;
  name: string;
  laborPercent: number;
  partsPercent: number;
  bonusPerOrder: number;
}

export interface AppSettings {
  defaultLaborPercent: number;
  defaultPartsPercent: number;
  /** Default VAT % (Poland 23%) */
  vatRate: number;
  vatEnabledByDefault: boolean;
}

export interface PasswordResetRecord {
  id: string;
  phone: string;
  codeHash: string;
  expiresAt: string;
  attempts: number;
  verified: boolean;
  resetToken?: string;
  tokenExpiresAt?: string;
  createdAt: string;
}

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

export type ClientNotificationType = "status_change" | "appointment" | "sign_required";

export interface ClientNotification {
  id: string;
  userId: string;
  type: ClientNotificationType;
  workOrderId?: string;
  workOrderNumber?: string;
  appointmentId?: string;
  statusKey?: RepairStatus;
  appointmentDate?: string;
  appointmentTime?: string;
  /** For appointment notifications */
  appointmentKind?: "created" | "confirmed" | "rescheduled";
  read: boolean;
  createdAt: string;
}

export type CallRequestStatus = "needs_call" | "called" | "done";

export type OrderSource = "website" | "manual";

export interface MarketingAttributionFields {
  marketing?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    landingPage?: string;
  };
}

export interface CallRequest extends MarketingAttributionFields {
  id: string;
  phone: string;
  clientName?: string;
  userId: string;
  serviceId: string;
  serviceLabel: string;
  comment: string;
  status: CallRequestStatus;
  source?: OrderSource;
  createdAt: string;
}

export interface Appointment extends MarketingAttributionFields {
  id: string;
  userId: string;
  vehicleId: string;
  serviceIds: string[];
  date: string;
  time: string;
  mechanicId: string;
  repairStatus: RepairStatus;
  appointmentStatus: AppointmentStatus;
  workOrderId?: string;
  comment: string;
  clientName?: string;
  clientPhone?: string;
  source?: OrderSource;
  createdAt: string;
}

export interface WarehouseItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  purchasePrice: number;
  sellPrice: number;
  supplier: string;
  qrCode: string;
}

import { notifyDbChanged } from "./db-events";

const STORAGE_KEY = "bess-motors-db";
/** One-time wipe of all client accounts from localStorage */
const PURGE_CLIENTS_MIGRATION_KEY = "bess-motors-migration:purge-clients-v1";

/** Remove every client user and related records; keep admin, mechanics, CRM data */
export function purgeAllClientsFromDb(db: Database): Database {
  const clientIds = new Set(
    db.users.filter((u) => u.role === "client").map((u) => u.id)
  );
  return {
    ...db,
    users: db.users.filter((u) => u.role !== "client"),
    vehicles: db.vehicles.filter((v) => !clientIds.has(v.userId)),
    workOrders: db.workOrders.filter((w) => !clientIds.has(w.userId)),
    appointments: db.appointments.filter((a) => !clientIds.has(a.userId)),
    callRequests: db.callRequests.filter((c) => !clientIds.has(c.userId)),
    vehicleHistory: db.vehicleHistory.filter((h) => !clientIds.has(h.userId)),
    passwordResets: [],
    currentUserId:
      db.currentUserId && clientIds.has(db.currentUserId) ? null : db.currentUserId,
    clientNotifications: (db.clientNotifications ?? []).filter(
      (n) => !clientIds.has(n.userId)
    ),
  };
}

export interface Database {
  users: User[];
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
  appointments: Appointment[];
  callRequests: CallRequest[];
  vehicleHistory: VehicleHistoryEntry[];
  warehouse: WarehouseItem[];
  expenses: ServiceExpense[];
  mechanics: MechanicProfile[];
  settings: AppSettings;
  passwordResets: PasswordResetRecord[];
  currentUserId: string | null;
  clientNotifications: ClientNotification[];
}

const defaultDb: Database = {
  users: [
    { id: "admin-1", phone: "+48888838688", name: "Administrator BESS MOTORS", role: "admin", createdAt: "2024-01-01" },
    { id: "mech-1", phone: "+48987654321", name: "Jan Kowalski", role: "mechanic", createdAt: "2024-01-01" },
    { id: "mech-2", phone: "+48911122233", name: "Piotr Nowak", role: "mechanic", createdAt: "2024-02-01" },
  ],
  vehicles: [],
  workOrders: [],
  callRequests: [],
  vehicleHistory: [],
  appointments: [],
  expenses: [
    { id: "ex1", category: "rent", description: "Czynsz warsztat", amount: 4500, date: "2025-05-01" },
    { id: "ex2", category: "utilities", description: "Prąd + woda", amount: 680, date: "2025-05-05" },
  ],
  mechanics: [
    { id: "mech-1", name: "Jan Kowalski", laborPercent: 50, partsPercent: 50, bonusPerOrder: 0 },
    { id: "mech-2", name: "Piotr Nowak", laborPercent: 50, partsPercent: 50, bonusPerOrder: 0 },
  ],
  settings: { defaultLaborPercent: 50, defaultPartsPercent: 50, vatRate: 23, vatEnabledByDefault: true },
  passwordResets: [],
  warehouse: [
    { id: "wh1", name: "Filtr oleju Mann", sku: "HU7008z", qty: 24, purchasePrice: 22, sellPrice: 45, supplier: "Inter Cars", qrCode: "BM-WH-001" },
    { id: "wh2", name: "Klocki hamulcowe Brembo", sku: "P85020", qty: 12, purchasePrice: 120, sellPrice: 220, supplier: "Auto Partner", qrCode: "BM-WH-002" },
  ],
  currentUserId: null,
  clientNotifications: [],
};

export function deriveDocumentStatus(
  repairStatus: RepairStatus,
  confirmationStatus: ConfirmationStatus
): DocumentStatus {
  if (confirmationStatus !== "confirmed") return "awaiting_signature";
  if (repairStatus === "delivered") return "delivered";
  if (repairStatus === "ready") return "completed";
  return "in_progress";
}

function migrateWorkOrder(o: Partial<WorkOrder> & { id: string; mechanicCommissionPercent?: number }): WorkOrder {
  const legacy = o as { mechanicCommissionPercent?: number };
  const labor =
    o.mechanicLaborPercent ??
    legacy.mechanicCommissionPercent ??
    -1;
  const parts = o.mechanicPartsPercent ?? -1;
  const confirmationStatus =
    o.confirmationStatus ??
    (o.signature || o.clientSignature ? "confirmed" : "awaiting_confirmation");
  const documentStatus =
    o.documentStatus ??
    deriveDocumentStatus(o.status ?? "received", confirmationStatus);
  let signature = o.signature;
  if (!signature && o.clientSignature) {
    signature = {
      dataUrl: o.clientSignature,
      signedAt: o.updatedAt ?? new Date().toISOString(),
      signedBy: "Client",
      ip: "—",
      userAgent: "—",
      priceAgreed: true,
      repairAgreed: true,
    };
  }
  return {
    orderDiscount: 0,
    internalNotes: "",
    clientNotes: "",
    updatedAt: o.createdAt ?? new Date().toISOString().slice(0, 10),
    ...o,
    mechanicLaborPercent: labor,
    mechanicPartsPercent: parts,
    confirmationStatus,
    documentStatus,
    vatEnabled: o.vatEnabled ?? true,
    signature,
    services: o.services ?? [],
    parts: (o.parts ?? []).map((p) => ({
      ...p,
      discount: p.discount ?? 0,
      partNumber: p.partNumber ?? "",
      supplier: p.supplier ?? "",
    })),
    files: o.files ?? [],
    paymentStatus: o.paymentStatus ?? "unpaid",
    paymentMethod: o.paymentMethod,
    paidAt: o.paidAt,
    paidCashAmount: o.paidCashAmount,
    paidCardAmount: o.paidCardAmount,
  } as WorkOrder;
}

function migrateAppointment(a: Partial<Appointment> & { serviceId?: string }): Appointment {
  const legacy = a as { serviceId?: string };
  const serviceIds = a.serviceIds ?? (legacy.serviceId ? [legacy.serviceId] : ["diagnostic"]);
  return {
    vehicleId: a.vehicleId ?? "",
    repairStatus: a.repairStatus ?? "received",
    appointmentStatus: a.appointmentStatus ?? "scheduled",
    comment: a.comment ?? "",
    createdAt: a.createdAt ?? new Date().toISOString().slice(0, 10),
    ...a,
    serviceIds,
    mechanicId: a.mechanicId && a.mechanicId !== "auto" ? a.mechanicId : "mech-1",
  } as Appointment;
}

function migrateVehicle(v: Partial<Vehicle> & { id: string; userId: string }): Vehicle {
  return {
    vin: v.vin ?? "",
    plate: v.plate ?? "",
    mileage: v.mileage ?? 0,
    make: v.make ?? "",
    model: v.model ?? "",
    engine: v.engine ?? "",
    engineVolume: v.engineVolume ?? "",
    trim: v.trim ?? "",
    power: v.power ?? "",
    transmission: v.transmission ?? "",
    drivetrain: v.drivetrain ?? "",
    year: v.year ?? "",
    color: v.color ?? "",
    fuelType: v.fuelType ?? "",
    notes: v.notes ?? "",
    ...v,
  } as Vehicle;
}

function migrateMechanic(m: Partial<MechanicProfile> & { id: string; commissionPercent?: number }): MechanicProfile {
  const legacy = m as { commissionPercent?: number };
  return {
    name: m.name ?? "",
    laborPercent: m.laborPercent ?? legacy.commissionPercent ?? 50,
    partsPercent: m.partsPercent ?? 50,
    bonusPerOrder: m.bonusPerOrder ?? 0,
    id: m.id,
  };
}

function mergeStoredDb(parsed: Partial<Database>): Database {
  return {
    ...defaultDb,
    ...parsed,
    workOrders: (parsed.workOrders ?? defaultDb.workOrders).map(migrateWorkOrder),
    appointments: (parsed.appointments ?? defaultDb.appointments).map(migrateAppointment),
    callRequests: parsed.callRequests ?? defaultDb.callRequests,
    vehicleHistory: parsed.vehicleHistory ?? defaultDb.vehicleHistory,
    vehicles: (parsed.vehicles ?? defaultDb.vehicles).map(migrateVehicle),
    expenses: parsed.expenses ?? defaultDb.expenses,
    mechanics: (parsed.mechanics ?? defaultDb.mechanics).map(migrateMechanic),
    settings: {
      ...defaultDb.settings,
      ...(parsed.settings ?? {}),
    },
    passwordResets: parsed.passwordResets ?? defaultDb.passwordResets,
    clientNotifications: parsed.clientNotifications ?? defaultDb.clientNotifications,
  };
}

export function loadDb(): Database {
  if (typeof window === "undefined") return defaultDb;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let db: Database;
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Database>;
      db = mergeStoredDb(parsed);
    } else {
      db = { ...defaultDb };
    }

    if (!localStorage.getItem(PURGE_CLIENTS_MIGRATION_KEY)) {
      const purged = purgeAllClientsFromDb(db);
      saveDb(purged);
      localStorage.setItem(PURGE_CLIENTS_MIGRATION_KEY, "1");
      return purged;
    }

    return db;
  } catch {
    /* ignore */
  }
  return { ...defaultDb };
}

export function saveDb(db: Database): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    notifyDbChanged();
  } catch {
    /* quota or private mode — avoid crashing the app */
  }
}

// Legacy exports — delegate to workorder-calc
export { calcServiceLine as calcServiceTotal, calcPartLine as calcPartTotal, calcPartLineProfit as calcPartProfit } from "./workorder-calc";
export { calcClientTotal as calcOrderClientTotal, calcPartsProfit as calcOrderAdminProfit } from "./workorder-calc";
