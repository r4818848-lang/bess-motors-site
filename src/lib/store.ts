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
  powerKw?: string;
  transmission: string;
  drivetrain?: string;
  year?: string;
  color?: string;
  colorHex?: string;
  imageUrl?: string;
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
  /** Linked Telegram client bot chat */
  telegramChatId?: string;
  telegramUserId?: number;
  telegramUsername?: string;
  telegramLinkedAt?: string;
  /** Client Telegram bot UI language */
  telegramLocale?: "pl" | "ru" | "uk" | "en";
  /** Who referred this client (user id) */
  referredByUserId?: string;
  /** When referral link was applied */
  referredAt?: string;
  /** Short code for referral links */
  referralCode?: string;
  /** Cached count of referred clients with paid+delivered work orders */
  referralQualifiedCount?: number;
  /** ISO — 5 qualified referrals reached */
  referralRewardUnlockedAt?: string;
  /** ISO — 15% discount consumed */
  referralDiscountUsedAt?: string;
  referralDiscountUsedOnOrderId?: string;
  /** 15% reward valid until (ISO) — default 90 days after unlock */
  referralDiscountExpiresAt?: string;
  /** Referred friend: 5% unlocked after first paid+delivered visit */
  referredFriendRewardUnlockedAt?: string;
  referredFriendDiscountUsedAt?: string;
  /** Paid oil changes counted toward loyalty (10 = 10% reward) */
  loyaltyOilChanges?: number;
  loyaltyRewardUsedAt?: string;
  /** Browser Web Push subscription */
  pushSubscription?: {
    endpoint: string;
    p256dh: string;
    auth: string;
    updatedAt: string;
  };
  /** Suppress Telegram pushes 22:00–08:00 Warsaw */
  botQuietHours?: boolean;
  /** Mute all non-critical Telegram pushes until this ISO time */
  botMuteUntil?: string;
  /** Per-category Telegram notification toggles */
  botNotifyPrefs?: {
    booking?: boolean;
    status?: boolean;
    promo?: boolean;
  };
  /** Preferred vehicle for Telegram bot context */
  telegramActiveVehicleId?: string;
  /** Quick-book favorite service in Telegram */
  favoriteServiceId?: string;
  lastMileageRemindAt?: string;
  /** Auto: VIP when lifetime spend exceeds threshold */
  clientTags?: string[];
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
  /** Supabase Storage public URL when uploaded */
  storageUrl?: string;
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
  /** ISO date — client notified when status became ready */
  readyNotifiedAt?: string;
  /** Show before/after photos on public /gallery */
  showInGallery?: boolean;
  /** Client star rating 1–5 */
  clientRating?: { stars: number; comment?: string; createdAt: string };
  ratingRequestSentAt?: string;
  postFollowup3dSentAt?: string;
  postFollowup7dSentAt?: string;
  postFollowup14dSentAt?: string;
  /** Client must approve before lines are merged into services */
  pendingExtraApproval?: {
    id: string;
    lines: WorkOrderLine[];
    note: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
  };
  /** Snapshot for estimate-change notifications */
  lastNotifiedClientTotal?: number;
  /** 15% referral reward applied to this order */
  referralDiscountApplied?: boolean;
  /** 5% invitee (referred friend) discount */
  referralInviteeDiscountApplied?: boolean;
  /** Client-visible parts pipeline */
  clientPartsStatus?: "ordered" | "in_transit" | "arrived";
  /** Auto ETA shown to client (ISO date) */
  estimatedReadyAt?: string;
  slaLevel?: "ok" | "warn" | "critical";
  auditLog?: { at: string; field: string; from?: string; to?: string }[];
  receptionChecklist?: Record<string, boolean>;
  deliveryChecklist?: Record<string, boolean>;
  /** Language for printed/signed work order (pl | ru | en) */
  documentLocale?: "pl" | "ru" | "en";
  /** electronic = client signs via link; physical = signs in person on paper */
  signatureMode?: SignatureMode;
}

export type SignatureMode = "electronic" | "physical";

export interface ClientRating {
  id: string;
  userId?: string;
  workOrderId?: string;
  stars: number;
  comment?: string;
  clientName?: string;
  showOnSite: boolean;
  source: "telegram" | "cabinet" | "site";
  tag?: string;
  createdAt: string;
}

export type ClientNotificationType =
  | "car_ready"
  | "status_change"
  | "appointment_invite"
  | "sign_required"
  | "referral_friend_joined"
  | "referral_friend_qualified"
  | "referral_reward_unlocked"
  | "referral_invitee_reward";

export interface ClientNotification {
  id: string;
  userId: string;
  type: ClientNotificationType;
  workOrderId?: string;
  appointmentId?: string;
  /** Repair status for status_change / car_ready context */
  status?: RepairStatus;
  appointmentDate?: string;
  appointmentTime?: string;
  /** scheduled = received, confirmed = approved, rescheduled = date/time changed */
  appointmentKind?: "scheduled" | "confirmed" | "rescheduled";
  read: boolean;
  createdAt: string;
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

export interface AbandonedBookingDraft {
  id: string;
  phone: string;
  name?: string;
  step: string;
  serviceSummary?: string;
  date?: string;
  time?: string;
  updatedAt: string;
  reminderSentAt?: string;
}

export interface AppSettings {
  defaultLaborPercent: number;
  defaultPartsPercent: number;
  /** Default VAT % (Poland 23%) */
  vatRate: number;
  vatEnabledByDefault: boolean;
  /** Incomplete online bookings for recovery cron */
  abandonedBookingDrafts?: AbandonedBookingDraft[];
  /** Master switch for runCrmAutomation */
  automationDisabled?: boolean;
  /** Auto WO when appointment date is today and no WO yet */
  autoCreateWorkOrderFromBooking?: boolean;
  defaultWarrantyMonths?: number;
  /** Auto-confirm website appointments (default on) */
  autoConfirmWebBookings?: boolean;
  /** Blocked slots: "yyyy-MM-dd|HH:mm" */
  blockedBookingSlots?: string[];
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
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

export type CallRequestStatus = "needs_call" | "called" | "done";

export type OrderSource = "website" | "manual" | "telegram";

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
  priority?: "normal" | "urgent";
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
  /** Registration plate — used for cabinet login after online booking */
  clientPlate?: string;
  source?: OrderSource;
  createdAt: string;
  reminderDayBeforeSentAt?: string;
  reminder2hSentAt?: string;
}

export interface WarehouseItem {
  id: string;
  name: string;
  sku: string;
  qty: number;
  minQty?: number;
  purchasePrice: number;
  sellPrice: number;
  supplier: string;
  qrCode: string;
}

import { DB_SAVED_EVENT, notifyDbChanged } from "./db-events";
import { clearDbCache, getCachedDb, setCachedDb } from "./db-cache";
import { trimDatabaseFiles } from "./file-storage-trim";
import { runCrmAutomation } from "./crm-automation";
import { migrateWarehouseItem } from "./warehouse-stock";

const STORAGE_KEY = "bess-motors-db";
const DB_BACKUP_KEY = "bess-motors-db-backup";
const DB_BACKUP_PREV_KEY = "bess-motors-db-backup-prev";
/** One-time wipe of all client accounts from localStorage */
const PURGE_CLIENTS_MIGRATION_KEY = "bess-motors-migration:purge-clients-v1";
/** One-time removal of gibberish test bookings/work orders */
const PURGE_TEST_DATA_MIGRATION_KEY = "bess-motors-migration:purge-test-bookings-v1";

const TEST_PHONE_DIGITS = new Set(["123123123", "876767867897"]);
const TEST_CLIENT_NAMES = new Set(["дожыф", "прврп", "ненгжбжд"]);
const TEST_PLATE_KEYS = new Set(["ЦЙК"]);
const TEST_ORDER_NUMBERS = new Set(["BM-2026-0001"]);

function phoneDigitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function isTestPhone(phone: string): boolean {
  const digits = phoneDigitsOnly(phone);
  if (!digits) return false;
  for (const test of TEST_PHONE_DIGITS) {
    if (digits === test || digits.endsWith(test)) return true;
  }
  return false;
}

function isTestName(name: string): boolean {
  return TEST_CLIENT_NAMES.has(name.trim().toLowerCase());
}

function isTestPlate(plate: string): boolean {
  const key = plate.replace(/\s/g, "").replace(/-/g, "").toUpperCase();
  return TEST_PLATE_KEYS.has(key);
}

function appointmentContact(db: Database, apt: Appointment): { name: string; phone: string } {
  if (apt.clientName || apt.clientPhone) {
    return {
      name: apt.clientName?.trim() ?? "",
      phone: apt.clientPhone?.trim() ?? "",
    };
  }
  const client = db.users.find((u) => u.id === apt.userId);
  return {
    name: client?.name?.trim() ?? "",
    phone: client?.phone?.trim() ?? "",
  };
}

function isTestAppointment(db: Database, apt: Appointment): boolean {
  const { name, phone } = appointmentContact(db, apt);
  return isTestPhone(phone) || isTestName(name);
}

export function isKnownTestAppointment(db: Database, apt: Appointment): boolean {
  return isTestAppointment(db, apt);
}

function isTestWorkOrder(db: Database, order: WorkOrder): boolean {
  if (TEST_ORDER_NUMBERS.has(order.number)) return true;
  const user = db.users.find((u) => u.id === order.userId);
  if (user && isTestName(user.name)) return true;
  if (user && isTestPhone(user.phone)) return true;
  const vehicle = db.vehicles.find((v) => v.id === order.vehicleId);
  if (vehicle && isTestPlate(vehicle.plate)) return true;
  return false;
}

/** Remove known gibberish test bookings and work orders */
export function purgeTestRecordsFromDb(db: Database): {
  db: Database;
  removedAppointmentIds: string[];
} {
  const removedAppointmentIds = db.appointments
    .filter((a) => isTestAppointment(db, a))
    .map((a) => a.id);
  const removedWorkOrderIds = new Set(
    db.workOrders.filter((o) => isTestWorkOrder(db, o)).map((o) => o.id)
  );
  const removedUserIds = new Set(
    db.users
      .filter((u) => u.role === "client" && (isTestName(u.name) || isTestPhone(u.phone)))
      .map((u) => u.id)
  );
  const removedVehicleIds = new Set(
    db.vehicles
      .filter(
        (v) =>
          isTestPlate(v.plate) ||
          removedUserIds.has(v.userId) ||
          db.workOrders.some((o) => o.vehicleId === v.id && removedWorkOrderIds.has(o.id))
      )
      .map((v) => v.id)
  );

  for (const apt of db.appointments) {
    if (apt.workOrderId && removedWorkOrderIds.has(apt.workOrderId)) {
      removedAppointmentIds.push(apt.id);
    }
  }
  const removedAptSet = new Set(removedAppointmentIds);

  return {
    db: {
      ...db,
      users: db.users.filter((u) => !removedUserIds.has(u.id)),
      vehicles: db.vehicles.filter((v) => !removedVehicleIds.has(v.id)),
      workOrders: db.workOrders.filter((o) => !removedWorkOrderIds.has(o.id)),
      appointments: db.appointments.filter((a) => !removedAptSet.has(a.id)),
      callRequests: db.callRequests.filter((c) => {
        const user = db.users.find((u) => u.id === c.userId);
        if (removedUserIds.has(c.userId)) return false;
        if (isTestPhone(c.phone)) return false;
        if (c.clientName && isTestName(c.clientName)) return false;
        if (user && isTestPhone(user.phone)) return false;
        return true;
      }),
      vehicleHistory: db.vehicleHistory.filter(
        (h) => !removedUserIds.has(h.userId) && !removedVehicleIds.has(h.vehicleId)
      ),
      notifications: (db.notifications ?? []).filter(
        (n) =>
          !removedUserIds.has(n.userId) &&
          (!n.workOrderId || !removedWorkOrderIds.has(n.workOrderId)) &&
          (!n.appointmentId || !removedAptSet.has(n.appointmentId))
      ),
    },
    removedAppointmentIds: [...removedAptSet],
  };
}

function rotateDbBackupBeforeSave(nextJson: string): void {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (!current || current === nextJson) return;
    const oldBackup = localStorage.getItem(DB_BACKUP_KEY);
    if (oldBackup) localStorage.setItem(DB_BACKUP_PREV_KEY, oldBackup);
    localStorage.setItem(DB_BACKUP_KEY, current);
  } catch {
    /* ignore quota */
  }
}

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
    notifications: (db.notifications ?? []).filter((n) => !clientIds.has(n.userId)),
    clientRatings: (db.clientRatings ?? []).filter(
      (r) => !r.userId || !clientIds.has(r.userId)
    ),
    settings: {
      ...db.settings,
      abandonedBookingDrafts: [],
    },
  };
}

/** Production reset: drop all clients and empty warehouse stock. */
export function sanitizeProductionDb(db: Database): Database {
  return {
    ...purgeAllClientsFromDb(db),
    warehouse: [],
    clientRatings: [],
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
  notifications: ClientNotification[];
  clientRatings: ClientRating[];
}

const defaultDb: Database = {
  users: [
    { id: "admin-1", phone: "+48888838688", name: "Administrator BESS MOTORS", role: "admin", createdAt: "2024-01-01" },
    { id: "mech-1", phone: "+48792929884", name: "Siergiej", role: "mechanic", password: "11788245", createdAt: "2024-01-01" },
    { id: "mech-2", phone: "+48911122233", name: "Piotr Nowak", role: "mechanic", password: "1234", createdAt: "2024-02-01" },
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
    { id: "mech-1", name: "Siergiej", laborPercent: 50, partsPercent: 50, bonusPerOrder: 0 },
    { id: "mech-2", name: "Piotr Nowak", laborPercent: 50, partsPercent: 50, bonusPerOrder: 0 },
  ],
  settings: {
    defaultLaborPercent: 50,
    defaultPartsPercent: 50,
    vatRate: 23,
    vatEnabledByDefault: true,
    autoCreateWorkOrderFromBooking: true,
    autoConfirmWebBookings: true,
    defaultWarrantyMonths: 12,
    lunchBreakStart: "13:00",
    lunchBreakEnd: "14:00",
  },
  passwordResets: [],
  warehouse: [
    { id: "wh1", name: "Filtr oleju Mann", sku: "HU7008z", qty: 24, purchasePrice: 22, sellPrice: 45, supplier: "Inter Cars", qrCode: "BM-WH-001" },
    { id: "wh2", name: "Klocki hamulcowe Brembo", sku: "P85020", qty: 12, purchasePrice: 120, sellPrice: 220, supplier: "Auto Partner", qrCode: "BM-WH-002" },
  ],
  currentUserId: null,
  notifications: [],
  clientRatings: [],
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
    signatureMode: o.signatureMode ?? "electronic",
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
    powerKw: v.powerKw ?? "",
    transmission: v.transmission ?? "",
    drivetrain: v.drivetrain ?? "",
    year: v.year ?? "",
    color: v.color ?? "",
    colorHex: v.colorHex ?? "",
    imageUrl: v.imageUrl ?? "",
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

export function mergeStoredDb(parsed: Partial<Database>): Database {
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
    notifications: parsed.notifications ?? defaultDb.notifications,
    clientRatings: parsed.clientRatings ?? defaultDb.clientRatings,
    warehouse: (parsed.warehouse ?? defaultDb.warehouse).map(migrateWarehouseItem),
  };
}

export function loadDb(): Database {
  if (typeof window === "undefined") return defaultDb;
  const mem = getCachedDb();
  if (mem) return mem;
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

    // Safe one-time update of the default mechanic profile/credentials.
    // Only apply when the DB still uses the previous baked-in demo mechanic.
    const u = db.users.find((x) => x.id === "mech-1" && x.role === "mechanic");
    if (u && u.phone === "+48987654321" && u.name === "Jan Kowalski") {
      u.phone = "+48792929884";
      u.name = "Siergiej";
      u.password = "11788245";
      delete u.passwordHash;
      const mp = db.mechanics.find((x) => x.id === "mech-1");
      if (mp && mp.name === "Jan Kowalski") mp.name = "Siergiej";
      saveDb(db);
    }

    if (!localStorage.getItem(PURGE_TEST_DATA_MIGRATION_KEY)) {
      const { db: cleaned, removedAppointmentIds } = purgeTestRecordsFromDb(db);
      const changed =
        cleaned.workOrders.length !== db.workOrders.length ||
        cleaned.appointments.length !== db.appointments.length ||
        cleaned.users.length !== db.users.length ||
        cleaned.vehicles.length !== db.vehicles.length;
      if (changed) {
        db = cleaned;
        saveDb(db);
      }
      localStorage.setItem(PURGE_TEST_DATA_MIGRATION_KEY, "1");
      if (removedAppointmentIds.length) {
        import("./cloud-appointments")
          .then(({ deleteAppointmentFromCloud }) =>
            Promise.all([...new Set(removedAppointmentIds)].map((id) => deleteAppointmentFromCloud(id)))
          )
          .catch(() => null);
      }
    }

    setCachedDb(db);
    return db;
  } catch {
    /* ignore */
  }
  const fallback = { ...defaultDb };
  setCachedDb(fallback);
  return fallback;
}

export function saveDb(db: Database, options?: { skipCloudPush?: boolean }): void {
  if (typeof window === "undefined") return;
  try {
    const prev = getCachedDb();
    runCrmAutomation(db, prev);
    const trimmed = trimDatabaseFiles(db);
    setCachedDb(trimmed);
    const json = JSON.stringify(trimmed);
    rotateDbBackupBeforeSave(json);
    localStorage.setItem(STORAGE_KEY, json);
    notifyDbChanged();
    if (!options?.skipCloudPush) {
      window.dispatchEvent(new CustomEvent(DB_SAVED_EVENT, { detail: db }));
    }
  } catch {
    /* quota or private mode — avoid crashing the app */
  }
}

// Legacy exports — delegate to workorder-calc
export { calcServiceLine as calcServiceTotal, calcPartLine as calcPartTotal, calcPartLineProfit as calcPartProfit } from "./workorder-calc";
export { calcClientTotal as calcOrderClientTotal, calcPartsProfit as calcOrderAdminProfit } from "./workorder-calc";
