import { loadDb, saveDb } from "./store";
import type { ServiceId } from "./services-catalog";
import { getStoredAttribution } from "./utm";
import { handleAppointmentNotification } from "./client-notifications";
import { ensureClientCredentialsForBooking } from "./create-work-order-from-booking";
import { pushAppointmentToCloud } from "./cloud-appointments";
import { normalizePhone, normalizePlateKey } from "./auth";
import { saveClientCredentials } from "./client-credentials";

function newAppointmentId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `apt-${crypto.randomUUID()}`;
  }
  return `apt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function savedSiteLocale(): "pl" | "ru" | "en" | "uk" {
  if (typeof localStorage === "undefined") return "pl";
  const value = localStorage.getItem("bess-locale");
  if (value === "pl" || value === "ru" || value === "en" || value === "uk") return value;
  return "pl";
}

const inquiryIds = new Map<string, string>();

function stableInquiryId(phone: string, source: string, serviceLabel: string, vin: string): string {
  const key = [phone, source, serviceLabel, vin].join("|");
  const existing = inquiryIds.get(key);
  if (existing) return existing;
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  inquiryIds.set(key, id);
  return id;
}

export async function createCallRequest(params: {
  phone: string;
  clientName: string;
  serviceId: string;
  serviceLabel: string;
  comment?: string;
  vin?: string;
  vehicleLabel?: string;
  make?: string;
  model?: string;
  plate?: string;
  desiredDate?: string;
  desiredTime?: string;
  services?: { id?: string; label?: string; quantity?: number }[];
  source?: string;
}): Promise<{ ok: boolean; cloudOk: boolean; error?: string }> {
  const phone = normalizePhone(params.phone);
  if (phone.length < 9) {
    return { ok: false, cloudOk: false, error: "phone" };
  }

  const clientRequestId = stableInquiryId(phone, params.source ?? "website", params.serviceLabel, params.vin ?? "");
  try {
    const res = await fetch("/api/call-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        clientName: params.clientName,
        serviceId: params.serviceId,
        serviceLabel: params.serviceLabel,
        comment: params.comment,
        vin: params.vin,
        vehicleLabel: params.vehicleLabel,
        make: params.make,
        model: params.model,
        plate: params.plate,
        desiredDate: params.desiredDate,
        desiredTime: params.desiredTime,
        services: params.services,
        source: params.source,
        clientRequestId,
        siteLocale: savedSiteLocale(),
        sourceUrl: typeof window !== "undefined" ? window.location.href : "",
      }),
    });
    const data = (await res.json()) as { ok?: boolean; cloud?: boolean; error?: string };
    const cloudOk = res.ok && data.ok === true && data.cloud === true;
    if (!cloudOk) {
      return {
        ok: false,
        cloudOk: false,
        error: data.error ?? (res.status === 502 ? "cloud" : "network"),
      };
    }

    const db = loadDb();
    const user = db.currentUserId
      ? db.users.find((u) => u.id === db.currentUserId)
      : null;
    const marketing = getStoredAttribution() ?? undefined;
    const localId = `call-${clientRequestId}`;
    if (!db.callRequests.some((call) => call.id === localId)) db.callRequests.push({
      id: localId,
      phone,
      clientName: params.clientName,
      userId: user?.id ?? "guest",
      serviceId: params.serviceId,
      serviceLabel: params.serviceLabel,
      comment: params.comment ?? "",
      status: "needs_call",
      source: "website",
      marketing: marketing ?? undefined,
      createdAt: new Date().toISOString(),
    });
    saveDb(db, { skipCloudPush: true });
    return { ok: true, cloudOk: true };
  } catch {
    return { ok: false, cloudOk: false, error: "network" };
  }
}

export async function createBookingAppointment(params: {
  serviceId: ServiceId | string;
  serviceIds: string[];
  date: string;
  time: string;
  comment: string;
  clientName: string;
  clientPhone: string;
  clientPlate: string;
  /** Stable id so a repeated submit updates the same visit instead of adding another. */
  appointmentId?: string;
  estimatedTotal?: number;
  cartLines?: { itemId: string; label: string; lineTotal: number; priceFrom: boolean }[];
}): Promise<{ ok: boolean; cloudOk: boolean; error?: "slot_taken" | "network" | "save" }> {
  try {
    const phone = normalizePhone(params.clientPhone);
    if (phone.length < 9) {
      return { ok: false, cloudOk: false, error: "network" };
    }

    const plate = params.clientPlate.trim();
    const db = loadDb();
    const { userId, vehicleId } = await ensureClientCredentialsForBooking(
      db,
      params.clientName,
      phone,
      plate,
      db.currentUserId ?? undefined
    );
    const marketing = getStoredAttribution() ?? undefined;
    const requestedId = params.appointmentId?.trim() ?? "";
    const id = /^apt-[a-z0-9-]{8,80}$/i.test(requestedId) ? requestedId : newAppointmentId();
    const apt = {
      id,
      clientRequestId: id,
      userId,
      vehicleId,
      serviceIds: params.serviceIds.length ? params.serviceIds : [params.serviceId],
      date: params.date,
      time: params.time,
      mechanicId: db.mechanics[0]?.id ?? "mech-1",
      repairStatus: "received" as const,
      appointmentStatus: "scheduled" as const,
      comment: params.comment,
      clientName: params.clientName.trim(),
      clientPhone: phone,
      clientPlate: plate,
      source: "website" as const,
      marketing: marketing ?? undefined,
      siteLocale: savedSiteLocale(),
      createdAt: new Date().toISOString(),
    };

    const push = await pushAppointmentToCloud(apt);
    if (!push.ok) {
      return {
        ok: false,
        cloudOk: false,
        error: push.slotTaken ? "slot_taken" : "network",
      };
    }

    db.appointments.push(apt);
    handleAppointmentNotification(db, apt, "scheduled");
    saveDb(db, { skipCloudPush: true });

    if (normalizePlateKey(plate).length >= 2) {
      saveClientCredentials(phone, plate);
    }

    return { ok: true, cloudOk: true };
  } catch (e) {
    console.warn("[booking] createBookingAppointment failed", e);
    return { ok: false, cloudOk: false, error: "save" };
  }
}
