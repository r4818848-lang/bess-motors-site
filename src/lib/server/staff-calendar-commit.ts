import { ensureClientCredentialsForBooking } from "@/lib/create-work-order-from-booking";
import { runCrmAutomation } from "@/lib/crm-automation";
import {
  clampStaffDuration,
  evaluateStaffArrival,
  findMechanicConflict,
  type LunchWindow,
} from "@/lib/staff-calendar";
import { workshopHours } from "@/lib/businessConfig";
import type { Appointment, AppointmentStatus, Database, Vehicle } from "@/lib/store";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";
import { cloudUpsertAppointment } from "@/lib/server/appointments-cloud";
import { normalizePhone } from "@/lib/server/normalize-phone";
import { getSupabaseConfig } from "@/lib/server/supabase-config";

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

async function putIfUnchanged(
  doc: Database,
  expectedUpdatedAt: string
): Promise<"ok" | "stale" | "error"> {
  const cfg = getSupabaseConfig();
  if (!cfg) return "error";
  const updatedAt = new Date().toISOString();
  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/crm_store?id=eq.main&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
      {
        method: "PATCH",
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ doc, updated_at: updatedAt }),
      }
    );
    if (!res.ok) return "error";
    const rows = (await res.json()) as unknown[];
    return rows.length ? "ok" : "stale";
  } catch {
    return "error";
  }
}

export async function commitStaffAppointment(
  input: StaffAppointmentInput,
  now = new Date()
): Promise<StaffCommitResult> {
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
    const put = await putIfUnchanged(payload, snap.updatedAt);
    if (put === "stale") continue;
    if (put === "error") {
      const fallback = await cloudPutCrmStore(payload);
      if (!fallback.ok) return { ok: false, error: fallback.error ?? "put_failed", status: 502 };
    } else {
      const { notifyAfterCrmCloudSave } = await import("@/lib/server/crm-cloud-notify");
      void notifyAfterCrmCloudSave(snap.doc, payload);
    }

    const row = await cloudUpsertAppointment(saved);
    return { ok: true, appointment: saved, rowSynced: row.ok };
  }

  return { ok: false, error: "conflict", status: 409 };
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
      lead.status = "booked";
      lead.appointmentId = apt.id;
      lead.updatedAt = now.toISOString();
      lead.contacts = [
        ...(lead.contacts ?? []),
        { id: `contact-${now.getTime()}`, kind: "booked", at: now.toISOString() },
      ];
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
