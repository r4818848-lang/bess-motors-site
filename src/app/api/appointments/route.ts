import { evaluateArrivalTime } from "@/lib/arrival-window";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import {
  appointmentKeepsExistingSlot,
  assertBookingSlotAvailable,
} from "@/lib/server/booking-slot-validation";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { safeExternalNotify, withUnifiedCrm } from "@/lib/server/unified-calendar";
import { claimLeadNotice, completeLeadNotice, upsertWebsiteLead } from "@/lib/service-leads";
import { normalizePhone } from "@/lib/server/normalize-phone";
import type { Appointment, Database } from "@/lib/store";
import { notifyAdminTelegram } from "@/lib/server/admin-telegram";
import {
  cloudDeleteAppointment,
  cloudListAppointmentsByPhone,
  cloudListAppointmentsForAdmin,
  cloudUpsertAppointment,
  isCloudAppointmentsEnabled,
} from "@/lib/server/appointments-cloud";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function keepServerStaffFields(apt: Appointment): Promise<void> {
  const crm = await cloudGetCrmStore();
  const stored = crm?.doc?.appointments?.find((item) => item.id === apt.id);
  if (!stored) {
    delete apt.holdUntil;
    delete apt.multiDay;
    delete apt.adminReminder;
    delete apt.notifyMechanic;
    return;
  }
  apt.holdUntil = stored.holdUntil;
  apt.multiDay = stored.multiDay;
  apt.adminReminder = stored.adminReminder;
  apt.notifyMechanic = stored.notifyMechanic;
}

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export async function POST(req: Request) {
  let apt: Appointment;
  let durationMinutes: number | undefined;
  try {
    const body = (await req.json()) as Appointment & { durationMinutes?: number };
    apt = body;
    durationMinutes = body.durationMinutes;
    if (!apt?.id || !apt.date || !apt.time) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }
    const phone = normalizePhone(apt.clientPhone ?? "");
    if (phone.length < 9) {
      return NextResponse.json({ ok: false, error: "phone" }, { status: 400 });
    }
    apt.clientPhone = phone;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const unified = await saveWebsiteBookingUnified(apt);
  if (unified) return unified;
  await keepServerStaffFields(apt);

  const keepsSlot = await appointmentKeepsExistingSlot(apt.id, apt.date, apt.time);
  if (!keepsSlot) {
    const slotCheck = await assertBookingSlotAvailable({
      date: apt.date,
      time: apt.time,
      excludeAptId: apt.id,
      durationMinutes,
      serviceIds: apt.serviceIds,
      mechanicId: apt.mechanicId,
    });
    if (!slotCheck.ok) {
      const status = slotCheck.error === "slot_taken" ? 409 : 400;
      return NextResponse.json({ ok: false, error: slotCheck.error }, { status });
    }
  }

  if (!isCloudAppointmentsEnabled()) {
    return NextResponse.json(
      { ok: false, error: "cloud_disabled" },
      { status: 503 }
    );
  }

  const crmPut = await cloudMutateCrmStore(async (db) => {
    await applyWebsiteBooking(db, apt);
    const row = bookingLead(db, apt);
    return row ? claimLeadNotice(row, new Date()) : "skip";
  });

  if (!crmPut.ok) {
    console.error("[booking] CRM sync failed", apt.id, crmPut.error);
    return NextResponse.json(
      { ok: false, error: crmPut.error ?? "crm_sync_failed" },
      { status: 502 }
    );
  }

  const tablePut = await cloudUpsertAppointment(apt);
  if (!tablePut.ok) {
    console.error("[booking] appointments table sync failed", apt.id, tablePut.error);
    if (crmPut.result === "send") {
      await cloudMutateCrmStore((db) => {
        const row = bookingLead(db, apt);
        if (row) completeLeadNotice(row, false, new Date());
      }, { skipAutomation: true });
    }
    return NextResponse.json(
      { ok: false, error: tablePut.error ?? "appointments_sync_failed", crmSynced: true },
      { status: 502 }
    );
  }

  if (crmPut.result === "send") {
    const telegramOk = await notifyAdminTelegram(bookingNotice(apt));
    await cloudMutateCrmStore((db) => {
      const row = bookingLead(db, apt);
      if (row) completeLeadNotice(row, telegramOk, new Date());
    }, { skipAutomation: true });
    if (!telegramOk) {
      console.warn("[telegram] notify failed (check TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)");
    }
  }

  try {
    const { cloudGetCrmStore } = await import("@/lib/server/crm-cloud");
    const snap = await cloudGetCrmStore();
    const user = snap?.doc?.users.find((u) => u.id === apt.userId);
    if (user?.pushSubscription?.endpoint) {
      const { sendWebPushToUser } = await import("@/lib/server/web-push-send");
      await sendWebPushToUser(user, {
        title: "BESS MOTORS",
        body: `Zapisano wizytę: ${apt.date} ${apt.time}`,
        url: "/booking",
      });
    }
  } catch (e) {
    console.warn("[booking] web push failed", e);
  }

  return NextResponse.json({ ok: true, crmSynced: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function GET(req: Request) {
  if (!isCloudAppointmentsEnabled()) {
    return NextResponse.json({ appointments: [], cloud: false });
  }

  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (session.role === "admin") {
    const appointments = await cloudListAppointmentsForAdmin();
    return NextResponse.json({ appointments, cloud: true });
  }

  if (session.role === "client" && session.phone) {
    const appointments = await cloudListAppointmentsByPhone(session.phone);
    return NextResponse.json({ appointments, cloud: true });
  }

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

function bookingNotice(apt: Appointment): string {
  return [
    "<b>Nowa rezerwacja online</b>",
    `Data: <b>${apt.date}</b> ${apt.time}`,
    apt.clientName ? `Imię: <b>${escapeHtml(apt.clientName)}</b>` : null,
    apt.clientPhone ? `Telefon: <b>${escapeHtml(apt.clientPhone)}</b>` : null,
    apt.comment ? `Komentarz: ${escapeHtml(apt.comment).slice(0, 500)}` : null,
    `Язык сайта: ${(apt.siteLocale ?? "pl").toUpperCase()}`,
  ].filter(Boolean).join("\n");
}

function bookingLead(db: Database, apt: Appointment) {
  const requestId = apt.clientRequestId || apt.id;
  return (db.leads ?? []).find(
    (item) => item.appointmentId === apt.id || item.clientRequestId === requestId || item.id === `lead-${apt.id.replace(/^apt-/, "")}`
  );
}

async function applyWebsiteBooking(db: Database, apt: Appointment): Promise<void> {
  const { ensureClientCredentialsForBooking } = await import("@/lib/create-work-order-from-booking");
  const stored = db.appointments.find((item) => item.id === apt.id);
  if (stored) {
    apt.holdUntil = stored.holdUntil;
    apt.multiDay = stored.multiDay;
    apt.adminReminder = stored.adminReminder;
    apt.notifyMechanic = stored.notifyMechanic;
    apt.workStart = apt.workStart || stored.workStart;
    apt.workMinutes = apt.workMinutes || stored.workMinutes;
    apt.pickupDate = apt.pickupDate || stored.pickupDate;
    apt.clientName = apt.clientName || stored.clientName;
    apt.clientPhone = apt.clientPhone || stored.clientPhone;
    apt.userId = apt.userId && apt.userId !== "guest" ? apt.userId : stored.userId;
    apt.vehicleId = apt.vehicleId || stored.vehicleId;
  }
  const { userId, vehicleId } = await ensureClientCredentialsForBooking(
    db,
    apt.clientName ?? "—",
    apt.clientPhone ?? "",
    apt.clientPlate,
    apt.userId
  );
  apt.userId = userId;
  apt.vehicleId = vehicleId;
  const idx = db.appointments.findIndex((item) => item.id === apt.id);
  const duplicate = idx < 0
    ? db.appointments.find((item) => item.clientPhone === apt.clientPhone && item.date === apt.date && item.time === apt.time && item.appointmentStatus !== "cancelled" && !item.calendarHidden)
    : undefined;
  if (duplicate) {
    apt.id = duplicate.id;
    apt.userId = duplicate.userId;
    apt.vehicleId = duplicate.vehicleId;
  } else if (idx >= 0) db.appointments[idx] = apt;
  else db.appointments.push(apt);
  const vehicle = db.vehicles.find((item) => item.id === apt.vehicleId);
  const saved = upsertWebsiteLead(db, {
    id: `lead-${apt.id.replace(/^apt-/, "")}`,
    clientRequestId: apt.clientRequestId || apt.id,
    phone: apt.clientPhone ?? "",
    name: apt.clientName,
    make: vehicle?.make,
    model: vehicle?.model,
    plate: apt.clientPlate,
    vin: vehicle?.vin,
    serviceId: apt.serviceIds[0],
    serviceLabel: apt.problemText || apt.comment,
    desiredDate: apt.date,
    desiredTime: apt.time,
    siteLocale: apt.siteLocale,
    source: apt.source || "website",
  });
  if (!saved.lead.appointmentId) {
    saved.lead.status = "booked";
    saved.lead.appointmentId = apt.id;
    saved.lead.updatedAt = new Date().toISOString();
  }
}

async function saveWebsiteBookingUnified(apt: Appointment): Promise<NextResponse | null> {
  let decision: "send" | "skip" = "skip";
  const outcome = await withUnifiedCrm(async (db) => {
    const arrival = evaluateArrivalTime({ date: apt.date, time: apt.time });
    if (!arrival.ok) return { abort: { error: arrival.error, status: 400 } };
    const { runCrmAutomation } = await import("@/lib/crm-automation");
    const previous = structuredClone(db);
    await applyWebsiteBooking(db, apt);
    const row = bookingLead(db, apt);
    decision = row ? claimLeadNotice(row, new Date()) : "skip";
    runCrmAutomation(db, previous);
    return { value: apt, eventKey: `web:${apt.id}` };
  }, { notify: async (previous, next) => {
    await safeExternalNotify(previous, next);
    if (decision !== "send") return;
    const telegramOk = await notifyAdminTelegram(bookingNotice(apt));
    await cloudMutateCrmStore((db) => {
      const row = bookingLead(db, apt);
      if (row) completeLeadNotice(row, telegramOk, new Date());
    }, { skipAutomation: true });
  } });
  if (!outcome.handled) return null;
  if (!outcome.ok) {
    return NextResponse.json({ ok: false, error: outcome.error, reason: outcome.reason }, { status: outcome.status });
  }
  return NextResponse.json({ ok: true, crmSynced: true, unified: true });
}

export async function DELETE(req: Request) {
  const unifiedDelete = await deleteAppointmentUnified(req);
  if (unifiedDelete) return unifiedDelete;
  if (!isCloudAppointmentsEnabled()) {
    return NextResponse.json({ ok: false, error: "cloud_disabled" }, { status: 503 });
  }

  const token = bearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin_only" }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const result = await cloudDeleteAppointment(id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status === 401 ? 401 : 502 }
    );
  }

  await cloudMutateCrmStore((db) => {
    const idx = db.appointments.findIndex((a) => a.id === id);
    if (idx >= 0) db.appointments.splice(idx, 1);
  });

  return NextResponse.json({ ok: true });
}

async function deleteAppointmentUnified(req: Request): Promise<NextResponse | null> {
  const token = bearerToken(req);
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session || session.role !== "admin") return null;
  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  const outcome = await withUnifiedCrm(async (db) => {
    const index = db.appointments.findIndex((item) => item.id === id);
    if (index < 0) return { abort: { error: "not_found", status: 404 } };
    db.appointments.splice(index, 1);
    return { value: id, eventKey: `delete:${id}` };
  }, { notify: safeExternalNotify });
  if (!outcome.handled) return null;
  if (!outcome.ok) return NextResponse.json({ ok: false, error: outcome.error, reason: outcome.reason }, { status: outcome.status });
  return NextResponse.json({ ok: true, unified: true });
}
