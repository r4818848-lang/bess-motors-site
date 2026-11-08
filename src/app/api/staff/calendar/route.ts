import { NextResponse } from "next/server";
import { workshopHours } from "@/lib/businessConfig";
import { addDateKeyDays, canStaff, weekdayWindowLabel } from "@/lib/staff-calendar";
import { staffCalendarMutationsEnabled } from "@/lib/server/cron-auth";
import { verifyTelegramWebAppInitData } from "@/lib/server/telegram-webapp-auth";
import { resolveStaffCalendarActor, type StaffCalendarActor } from "@/lib/server/staff-calendar-access";
import { commitStaffAppointment, type StaffAppointmentInput } from "@/lib/server/staff-calendar-commit";
import { loadCrmFromCloud } from "@/lib/server/telegram-bot/crm-actions";
import { normalizePhone } from "@/lib/server/normalize-phone";
import type { Appointment, CallRequest, Database, Vehicle } from "@/lib/store";
import { formatWarsawDateKey } from "@/lib/date-key";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = StaffAppointmentInput & {
  initData?: string;
  action?: string;
  from?: string;
  to?: string;
  q?: string;
};

function visible(actor: StaffCalendarActor, apt: Appointment): boolean {
  if (actor.seeAll) return true;
  return Boolean(actor.mechanicId && apt.mechanicId === actor.mechanicId);
}

function vehicleOf(db: Database, id: string): Vehicle | undefined {
  return db.vehicles.find((vehicle) => vehicle.id === id);
}

function card(db: Database, apt: Appointment) {
  const vehicle = vehicleOf(db, apt.vehicleId);
  const mechanic = db.mechanics.find((item) => item.id === apt.mechanicId);
  return {
    id: apt.id,
    date: apt.date,
    time: apt.time,
    durationMinutes: apt.durationMinutes ?? 60,
    holdUntil: apt.holdUntil ?? null,
    multiDay: Boolean(apt.multiDay || apt.holdUntil),
    clientName: apt.clientName ?? "",
    clientPhone: apt.clientPhone ?? "",
    plate: apt.clientPlate || vehicle?.plate || "",
    vin: vehicle?.vin || "",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    vehicleId: apt.vehicleId,
    userId: apt.userId,
    serviceIds: apt.serviceIds,
    problemText: apt.problemText ?? "",
    mechanicId: apt.mechanicId,
    mechanicName: mechanic?.name ?? "",
    comment: (apt.comment ?? "").slice(0, 1000),
    appointmentStatus: apt.appointmentStatus,
    visitState: apt.visitState ?? "expected",
    leavesCar: Boolean(apt.leavesCar),
    pickupDate: apt.pickupDate ?? "",
    workStart: apt.workStart ?? "",
    workMinutes: apt.workMinutes ?? 0,
    notifyMechanic: Boolean(apt.notifyMechanic),
    updatedAt: apt.updatedAt ?? null,
    source: apt.source ?? null,
  };
}

function callCard(call: CallRequest) {
  return {
    id: call.id,
    phone: call.phone,
    clientName: call.clientName ?? "",
    serviceLabel: call.serviceLabel,
    comment: call.comment.slice(0, 300),
    status: call.status,
    createdAt: call.createdAt,
  };
}

function matchesQuery(db: Database, apt: Appointment, q: string): boolean {
  const vehicle = vehicleOf(db, apt.vehicleId);
  const hay = [
    apt.clientName,
    apt.clientPhone,
    normalizePhone(apt.clientPhone ?? ""),
    apt.clientPlate,
    vehicle?.plate,
    vehicle?.make,
    vehicle?.model,
    vehicle?.vin,
    apt.problemText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase()) || hay.includes(normalizePhone(q));
}

async function actorFrom(req: Request, body: Body) {
  const initData = req.headers.get("x-telegram-init-data") || body.initData || "";
  const auth = verifyTelegramWebAppInitData(initData);
  if (!auth.ok) return { error: NextResponse.json({ ok: false, error: auth.error }, { status: 401 }) };
  const actor = await resolveStaffCalendarActor(auth.user.id);
  if (!actor) return { error: NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 }) };
  return { actor, language: auth.user.languageCode ?? "ru" };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const auth = await actorFrom(req, body);
  if ("error" in auth && auth.error) return auth.error;
  const actor = auth.actor;
  const db = await loadCrmFromCloud();
  if (!db) return NextResponse.json({ ok: false, error: "cloud_empty" }, { status: 503 });

  const action = body.action || "session";
  if (action === "session") {
    const today = formatWarsawDateKey();
    return NextResponse.json({
      ok: true,
      role: actor.role,
      canEdit: actor.canEdit,
      seeAll: actor.seeAll,
      mechanicId: actor.mechanicId ?? null,
      name: actor.name ?? null,
      language: auth.language ?? "ru",
      today,
      tomorrow: addDateKeyDays(today, 1),
      hours: workshopHours(),
      arrival: { from: "09:00", to: "13:30", step: 30, sundayClosed: true },
      todayWindow: weekdayWindowLabel(today, workshopHours()),
      mechanics: db.mechanics.map((mechanic) => ({ id: mechanic.id, name: mechanic.name })),
    });
  }

  if (action === "list") {
    const from = body.from || formatWarsawDateKey();
    const to = body.to || from;
    const appointments = db.appointments
      .filter(
        (apt) =>
          visible(actor, apt) &&
          !apt.calendarHidden &&
          apt.appointmentStatus !== "cancelled" &&
          apt.date >= from &&
          apt.date <= to
      )
      .map((apt) => card(db, apt));
    const calls =
      actor.seeAll && from === to
        ? db.callRequests
            .filter((call) => call.status !== "done" && call.createdAt.slice(0, 10) <= to)
            .slice(0, 30)
            .map(callCard)
        : [];
    return NextResponse.json({ ok: true, appointments, calls });
  }

  if (action === "search") {
    const q = (body.q ?? "").trim();
    if (q.length < 2) return NextResponse.json({ ok: false, error: "query" }, { status: 400 });
    const appointments = db.appointments
      .filter((apt) => visible(actor, apt) && matchesQuery(db, apt, q))
      .slice(0, 40)
      .map((apt) => card(db, apt));
    return NextResponse.json({ ok: true, appointments });
  }

  if (action === "clients") {
    if (!actor.canEdit && actor.role === "mechanic") {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    const q = (body.q ?? "").trim().toLowerCase();
    const digits = normalizePhone(q);
    const clients = db.users
      .filter((user) => user.role === "client")
      .filter((user) => {
        if (q.length < 2) return false;
        const phone = normalizePhone(user.phone);
        return (
          user.name.toLowerCase().includes(q) ||
          phone.includes(digits) ||
          db.vehicles.some(
            (vehicle) =>
              vehicle.userId === user.id &&
              `${vehicle.plate} ${vehicle.make} ${vehicle.model} ${vehicle.vin}`.toLowerCase().includes(q)
          )
        );
      })
      .slice(0, 12)
      .map((user) => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        vehicles: db.vehicles
          .filter((vehicle) => vehicle.userId === user.id)
          .slice(0, 8)
          .map((vehicle) => ({
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            plate: vehicle.plate,
            vin: vehicle.vin,
          })),
      }));
    return NextResponse.json({ ok: true, clients });
  }

  if (action === "lead") {
    if (!actor.seeAll) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    const lead = (db.leads ?? []).find((item) => item.id === body.leadId);
    if (!lead) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({
      ok: true,
      lead: {
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        phone: lead.phone,
        make: lead.make,
        model: lead.model,
        plate: lead.plate,
        vin: lead.vin,
        desiredDate: lead.desiredDate,
        desiredTime: lead.desiredTime,
        siteLocale: lead.siteLocale,
        services: lead.services,
        totalText: lead.totalText,
        status: lead.status,
      },
    });
  }

  const mutations = new Set(["create", "update", "cancel", "arrive", "noshow", "remove"]);
  if (!mutations.has(action)) {
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  }

  if (!staffCalendarMutationsEnabled()) {
    return NextResponse.json({ ok: false, error: "writes_disabled" }, { status: 403 });
  }

  const staffAction = action === "create" ? "create" : action === "cancel" || action === "remove" ? "cancel" : "update";
  if (!canStaff(actor.role, staffAction, { mechanicCanEdit: actor.canEdit })) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  if (actor.role === "mechanic") {
    const current = db.appointments.find((apt) => apt.id === body.id);
    if (action !== "create" && current && current.mechanicId !== actor.mechanicId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    if (body.mechanicId && body.mechanicId !== actor.mechanicId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
    body.mechanicId = actor.mechanicId;
  }

  const result = await commitStaffAppointment({
    ...body,
    mode: action as StaffAppointmentInput["mode"],
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }
  const fresh = await loadCrmFromCloud();
  const apt = fresh?.appointments.find((item) => item.id === result.appointment.id) ?? result.appointment;
  return NextResponse.json({
    ok: true,
    appointment: card(fresh ?? db, apt),
    rowSynced: result.rowSynced,
  });
}
