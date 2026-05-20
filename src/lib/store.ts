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
  trim: string;
  power: string;
  transmission: string;
  userId: string;
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

export interface OrderSignature {
  dataUrl: string;
  signedAt: string;
  signedBy: string;
  ip: string;
  userAgent: string;
  priceAgreed: boolean;
  repairAgreed: boolean;
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
  qty: number;
  purchasePrice: number;
  sellPrice: number;
  discount: number;
}

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
  signature?: OrderSignature;
  /** @deprecated use signature.dataUrl */
  clientSignature?: string;
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
}

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
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

const STORAGE_KEY = "bess-motors-db";

export interface Database {
  users: User[];
  vehicles: Vehicle[];
  workOrders: WorkOrder[];
  appointments: Appointment[];
  warehouse: WarehouseItem[];
  expenses: ServiceExpense[];
  mechanics: MechanicProfile[];
  settings: AppSettings;
  currentUserId: string | null;
}

const sampleOrder: WorkOrder = {
  id: "wo1",
  number: "BM-2025-0042",
  userId: "client-demo",
  vehicleId: "v1",
  status: "repair",
  mechanicId: "mech-1",
  mechanicLaborPercent: -1,
  mechanicPartsPercent: -1,
  orderDiscount: 5,
  internalNotes: "Sprawdzić układ wydechowy przy odbiorze",
  clientNotes: "Proszę o kontakt przed rozpoczęciem prac",
  files: [],
  warrantyUntil: "2026-05-15",
  createdAt: "2025-05-15",
  updatedAt: "2025-05-15",
  confirmationStatus: "awaiting_confirmation",
  services: [
    { id: "s1", name: "Diagnostyka komputerowa", qty: 1, price: 250, discount: 0 },
    { id: "s2", name: "Wymiana oleju", qty: 1, price: 180, discount: 10 },
  ],
  parts: [
    { id: "p1", name: "Filtr oleju", qty: 1, purchasePrice: 25, sellPrice: 45, discount: 0 },
    { id: "p2", name: "Olej 5W30 5L", qty: 1, purchasePrice: 80, sellPrice: 140, discount: 0 },
  ],
};

const defaultDb: Database = {
  users: [
    { id: "admin-1", phone: "+48791257229", name: "Administrator BESS MOTORS", role: "admin", createdAt: "2024-01-01" },
    { id: "mech-1", phone: "+48987654321", name: "Jan Kowalski", role: "mechanic", createdAt: "2024-01-01" },
    { id: "mech-2", phone: "+48911122233", name: "Piotr Nowak", role: "mechanic", createdAt: "2024-02-01" },
    {
      id: "client-demo",
      phone: "+48555111222",
      email: "demo@bessmotors.pl",
      password: "demo123",
      name: "Michał Kowalski",
      role: "client",
      createdAt: "2024-06-01",
    },
  ],
  vehicles: [
    {
      id: "v1",
      vin: "WBA3A5C50EK123456",
      plate: "WA 12345",
      mileage: 85000,
      make: "BMW",
      model: "320d",
      engine: "2.0 Diesel",
      trim: "M Sport",
      power: "190 HP",
      transmission: "Automatic",
      userId: "client-demo",
    },
  ],
  workOrders: [sampleOrder],
  appointments: [
    {
      id: "apt-1",
      userId: "client-demo",
      vehicleId: "v1",
      serviceIds: ["diagnostic", "oil"],
      date: new Date().toISOString().slice(0, 10),
      time: "10:00",
      mechanicId: "mech-1",
      repairStatus: "received",
      appointmentStatus: "scheduled",
      workOrderId: "wo1",
      comment: "Kontrola + olej",
      createdAt: "2025-05-10",
    },
  ],
  expenses: [
    { id: "ex1", category: "rent", description: "Czynsz warsztat", amount: 4500, date: "2025-05-01" },
    { id: "ex2", category: "utilities", description: "Prąd + woda", amount: 680, date: "2025-05-05" },
  ],
  mechanics: [
    { id: "mech-1", name: "Jan Kowalski", laborPercent: 50, partsPercent: 50, bonusPerOrder: 0 },
    { id: "mech-2", name: "Piotr Nowak", laborPercent: 50, partsPercent: 50, bonusPerOrder: 0 },
  ],
  settings: { defaultLaborPercent: 50, defaultPartsPercent: 50 },
  warehouse: [
    { id: "wh1", name: "Filtr oleju Mann", sku: "HU7008z", qty: 24, purchasePrice: 22, sellPrice: 45, supplier: "Inter Cars", qrCode: "BM-WH-001" },
    { id: "wh2", name: "Klocki hamulcowe Brembo", sku: "P85020", qty: 12, purchasePrice: 120, sellPrice: 220, supplier: "Auto Partner", qrCode: "BM-WH-002" },
  ],
  currentUserId: null,
};

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
    files: [],
    updatedAt: o.createdAt ?? new Date().toISOString().slice(0, 10),
    ...o,
    mechanicLaborPercent: labor,
    mechanicPartsPercent: parts,
    confirmationStatus,
    signature,
    parts: (o.parts ?? []).map((p) => ({ ...p, discount: p.discount ?? 0 })),
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

export function loadDb(): Database {
  if (typeof window === "undefined") return defaultDb;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Database>;
      return {
        ...defaultDb,
        ...parsed,
        workOrders: (parsed.workOrders ?? defaultDb.workOrders).map(migrateWorkOrder),
        appointments: (parsed.appointments ?? defaultDb.appointments).map(migrateAppointment),
        expenses: parsed.expenses ?? defaultDb.expenses,
        mechanics: (parsed.mechanics ?? defaultDb.mechanics).map(migrateMechanic),
        settings: {
          ...defaultDb.settings,
          ...(parsed.settings ?? {}),
        },
      };
    }
  } catch {
    /* ignore */
  }
  return { ...defaultDb };
}

export function saveDb(db: Database): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Legacy exports — delegate to workorder-calc
export { calcServiceLine as calcServiceTotal, calcPartLine as calcPartTotal, calcPartLineProfit as calcPartProfit } from "./workorder-calc";
export { calcClientTotal as calcOrderClientTotal, calcPartsProfit as calcOrderAdminProfit } from "./workorder-calc";
