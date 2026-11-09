import { ensureClientCredentialsForBooking } from "@/lib/create-work-order-from-booking";
import { runCrmAutomation } from "@/lib/crm-automation";
import {
  clampStaffDuration,
  evaluateStaffArrival,
  findMechanicConflict,
  type LunchWindow,
} from "@/lib/staff-calendar";
import { workshopHours } from "@/lib/businessConfig";
import { compatibleResourceFields } from "@/lib/smart-scheduler/crm-reconcile";
import type { Appointment, AppointmentStatus, Database, Vehicle } from "@/lib/store";
import { cloudGetCrmStore, patchCrmIfUnchanged } from "@/lib/server/crm-cloud";
import { cloudUpsertAppointment } from "@/lib/server/appointments-cloud";
import { safeExternalNotify, withUnifiedCrm } from "@/lib/server/unified-calendar";
import { normalizePhone } from "@/lib/server/normalize-phone";
import { applyLeadAction } from "@/lib/service-leads";

export type StaffAppointmentInput = {
  mode: "create" | "update" | "cancel" | "arrive" | "noshow" | "remove";
  id?: string;
  expectedUpdatedAt?: string;
  clientRequestId?: string;
  clientName?: string;
  clientPhone?: string;
  make?: string;
  model?: string;
  plate?: string;
  vin?: string;
  vehicleId?: string;
  userId?: string;
  serviceIds?: string[];
  problemText?: string;
  date?: string;
  time?: string;
  durationMinutes?: number;
  holdUntil?: string;
  multiDay?: boolean;
  mechanicId?: string;
  comment?: string;
  appointmentStatus?: AppointmentStatus;
  notifyMechanic?: boolean;
  leavesCar?: boolean;
  pickupDate?: string;
  workStart?: string;
  workMinutes?: number;
  resourceId?: string;
  resourceIds?: string[];
  leadId?: string;
  siteLocale?: Appointment["siteLocale"];
};

export type StaffCommitResult =
  | { ok: true; appointment: Appointment; rowSynced: boolean }
  | { ok: false; error: string; status: number };

function lunchOf(db: Database): LunchWindow {
  return {
    start: db.settings?.lunchBreakStart || "13:00",
    end: db.settings?.lunchBreakEnd || "14:00",
  };
}

function applyVehicle(vehicle: Vehicle, input: StaffAppointmentInput): void {
  if (input.make?.trim()) vehicle.make = input.make.trim();
  if (input.model?.trim()) vehicle.model = input.model.trim();
  if (input.vin?.trim()) vehicle.vin = input.vin.trim().toUpperCase();
  if (input.plate?.trim()) vehicle.plate = input.plate.trim();
}

export async function commitStaffAppointment(
  input: StaffAppointmentInput,
  now = new Date()
): Promise<StaffCommitResult> {
  const unified = await commitStaffUnified(input, now);
  if (unified) return unified;

  for (let attempt = 0; attempt < 3; attempt++) {
    const snap = await cloudGetCrmStore();
    if (!snap?.doc) return { ok: false, error: "cloud_empty", status: 503 };

    const working = structuredClone(snap.doc) as Database;
    const built = await applyStaffChange(working, input, now);
    if (!built.ok) return built;

    runCrmAutomation(working, snap.doc);
    const saved = working.appointments.find((apt) => apt.id === built.appointment.id);
    if (!saved) return { ok: false, error: "not_found", status: 404 };

    const payload = { ...working, currentUserId: null };
    const put = await patchCrmIfUnchanged(payload, snap.updatedAt);
    if (put !== "ok") continue;
    const { notifyAfterCrmCloudSave } = await import("@/lib/server/crm-cloud-notify");
    void notifyAfterCrmCloudSave(snap.doc, payload);

    const row = await cloudUpsertAppointment(saved);
    return { ok: true, appointment: saved, rowSynced: row.ok };
  }

  return { ok: false, error: "conflict", status: 409 };
}

async function commitStaffUnified(input: StaffAppointmentInput, now: Date): Promise<StaffCommitResult | null> {
  const outcome = await withUnifiedCrm<Appointment>(async (db) => {
    const previous = structuredClone(db);
    const built = await applyStaffChange(db, input, now);
    if (!built.ok) return { abort: { error: built.error, status: built.status } };
    runCrmAutomation(db, previous);
    const saved = db.appointments.find((item) => item.id === built.appointment.id);
    if (!saved) return { abort: { error: "not_found", status: 404 } };
    const eventKey = input.mode === "create"
      ? `staff-create:${input.clientRequestId || saved.id}`
      : `staff:${saved.id}:${input.mode}:${saved.updatedAt ?? ""}`;
    return { value: saved, eventKey };
  }, { notify: safeExternalNotify });
  if (!outcome.handled) return null;
  if (!outcome.ok) return { ok: false, error: outcome.reason ? `${outcome.error}: ${outcome.reason}` : outcome.error, status: outcome.status };
  return { ok: true, appointment: outcome.value, rowSynced: true };
}

async function applyStaffChange(
  db: Database,
  input: StaffAppointmentInput,
  now: Date
): Promise<{ ok: true; appointment: Appointment } | StaffCommitResult> {
  if (input.mode === "create" && input.clientRequestId) {
    const existing = db.appointments.find((apt) => apt.clientRequestId === input.clientRequestId);
    if (existing) return { ok: true, appointment: existing };
  }

  if (input.mode !== "create") {
    const apt = db.appointments.find((item) => item.id === input.id);
    if (!apt) return { ok: false, error: "not_found", status: 404 };
    if (input.expectedUpdatedAt && apt.updatedAt && apt.updatedAt !== input.expectedUpdatedAt) {
      return { ok: false, error: "conflict", status: 409 };
    }
    if (input.mode === "cancel" || input.mode === "remove") {
      apt.appointmentStatus = "cancelled";
      apt.calendarHidden = true;
      apt.updatedAt = now.toISOString();
      apt.adminReminder = { ...(apt.adminReminder ?? {}), status: "cancelled" };
      return { ok: true, appointment: apt };
    }
    if (input.mode === "arrive" || input.mode === "noshow") {
      apt.visitState = input.mode === "arrive" ? "arrived" : "no_show";
      apt.updatedAt = now.toISOString();
      return { ok: true, appointment: apt };
    }
    return fillAppointment(db, apt, input, now, false);
  }

  const apt: Appointment = {
    id: `apt-${now.getTime()}`,
    userId: "guest",
    vehicleId: "",
    serviceIds: ["otherReason"],
    date: "",
    time: "",
    mechanicId: input.mechanicId || db.mechanics[0]?.id || "mech-1",
    repairStatus: "received",
    appointmentStatus: "scheduled",
    comment: "",
    source: "telegram",
    createdAt: now.toISOString(),
    clientRequestId: input.clientRequestId,
  };
  db.appointments.push(apt);
  return fillAppointment(db, apt, input, now, true);
}

async function fillAppointment(
  db: Database,
  apt: Appointment,
  input: StaffAppointmentInput,
  now: Date,
  creating: boolean
): Promise<{ ok: true; appointment: Appointment } | StaffCommitResult> {
  const previous = { date: apt.date, time: apt.time };
  const phone = normalizePhone(input.clientPhone ?? apt.clientPhone ?? "");
  if (phone.length < 9) return { ok: false, error: "phone", status: 400 };
  const name = (input.clientName ?? apt.clientName ?? "").trim();
  if (!name) return { ok: false, error: "name", status: 400 };
  const date = input.date ?? apt.date;
  const time = input.time ?? apt.time;
  const mechanicId = input.mechanicId || apt.mechanicId;
  if (!date || !time || !mechanicId) return { ok: false, error: "invalid", status: 400 };
  if (!db.mechanics.some((mechanic) => mechanic.id === mechanicId)) {
    return { ok: false, error: "mechanic", status: 400 };
  }

  const serviceIds = (input.serviceIds?.length ? input.serviceIds : apt.serviceIds).slice(0, 8);
  const durationMinutes = clampStaffDuration(
    input.durationMinutes ?? apt.durationMinutes,
    serviceIds
  );
  const holdUntil = input.holdUntil?.trim() || undefined;
  const multiDay = Boolean(input.multiDay || holdUntil);
  const hours = workshopHours();
  const lunch = lunchOf(db);
  const arrival = evaluateStaffArrival({
    date,
    time,
    durationMinutes,
    allowMultiDay: multiDay,
    hours,
    lunch,
    now,
  });
  if (!arrival.ok) return { ok: false, error: arrival.error, status: 400 };

  const workStart = input.workStart?.trim() || apt.workStart;
  const workMinutes = input.workMinutes ?? apt.workMinutes;
  const draft: Appointment = {
    ...apt,
    date,
    time,
    mechanicId,
    durationMinutes,
    holdUntil: multiDay ? holdUntil : undefined,
    multiDay,
    leavesCar: input.leavesCar ?? apt.leavesCar,
    pickupDate: input.pickupDate?.trim() || apt.pickupDate,
    workStart,
    workMinutes,
    serviceIds,
    appointmentStatus: input.appointmentStatus ?? apt.appointmentStatus ?? "scheduled",
  };
  if (draft.appointmentStatus !== "cancelled") {
    const conflict = findMechanicConflict(db.appointments, draft, hours, lunch);
    if (conflict) return { ok: false, error: "mechanic_conflict", status: 409 };
  }

  const plate = input.plate ?? apt.clientPlate;
  const linked = await ensureClientCredentialsForBooking(
    db,
    name,
    phone,
    plate,
    input.userId || apt.userId
  );
  let vehicleId = input.vehicleId || linked.vehicleId;
  const vehicle = db.vehicles.find((item) => item.id === vehicleId && item.userId === linked.userId);
  if (vehicle) applyVehicle(vehicle, input);
  else vehicleId = linked.vehicleId;

  const chosen = db.vehicles.find((item) => item.id === vehicleId);
  if (chosen) applyVehicle(chosen, input);

  apt.userId = linked.userId;
  apt.vehicleId = vehicleId;
  apt.clientName = name;
  apt.clientPhone = phone;
  apt.clientPlate = chosen?.plate || plate;
  apt.serviceIds = serviceIds;
  apt.problemText = input.problemText?.trim().slice(0, 500) || apt.problemText;
  apt.date = date;
  apt.time = time;
  apt.durationMinutes = durationMinutes;
  apt.holdUntil = draft.holdUntil;
  apt.multiDay = multiDay;
  apt.mechanicId = mechanicId;
  apt.comment = (input.comment ?? apt.comment ?? "").slice(0, 1000);
  apt.appointmentStatus = draft.appointmentStatus;
  apt.notifyMechanic = Boolean(input.notifyMechanic);
  apt.leavesCar = Boolean(draft.leavesCar);
  apt.pickupDate = draft.pickupDate;
  apt.workStart = workStart || undefined;
  apt.workMinutes = workMinutes && workMinutes > 0 ? workMinutes : undefined;
  if (input.resourceId !== undefined || input.resourceIds !== undefined) {
    const resources = compatibleResourceFields(input.resourceId, input.resourceIds);
    const stored = apt as Appointment & { resourceId?: string; resourceIds?: string[] };
    stored.resourceId = resources.resourceId;
    stored.resourceIds = resources.resourceIds;
  }
  apt.leadId = input.leadId ?? apt.leadId;
  apt.siteLocale = input.siteLocale ?? apt.siteLocale;
  apt.visitState = apt.visitState ?? "expected";
  apt.calendarHidden = false;
  apt.source = apt.source ?? "telegram";
  apt.updatedAt = now.toISOString();
  if (creating) apt.createdAt = now.toISOString();
  if (creating && apt.leadId) {
    const lead = (db.leads ?? []).find((item) => item.id === apt.leadId);
    if (lead && !lead.appointmentId) {
      lead.appointmentId = apt.id;
      applyLeadAction(lead, "booked", now);
    }
  }

  const slotChanged = previous.date !== apt.date || previous.time !== apt.time;
  if (slotChanged) {
    apt.adminReminder = { status: "pending", attempts: 0, deliveredChatIds: [] };
    apt.reminder2hSentAt = undefined;
    apt.reminderDayBeforeSentAt = undefined;
  }

  return { ok: true, appointment: apt };
}
