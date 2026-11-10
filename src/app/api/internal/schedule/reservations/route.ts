import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { workshopHours } from "@/lib/businessConfig";
import { guardScheduler, isGuardError, mechanicMayPlan } from "@/lib/smart-scheduler/access";
import { parseOperationCatalog } from "@/lib/smart-scheduler/catalog";
import { schedulerOwnerWritePilotEnabled, schedulerTestWritesEnabled } from "@/lib/smart-scheduler/flag";
import { commitSchedulerToCrm } from "@/lib/smart-scheduler/live-crm";
import { planOperationMinutes, resolveDuration, type PartsStatus } from "@/lib/smart-scheduler/schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  action?: "create" | "move" | "cancel";
  idempotencyKey?: string;
  reservationId?: string;
  date?: string;
  start?: string;
  arrivalTime?: string;
  mechanicId?: string;
  operationCode?: string;
  resourceIds?: string[];
  parts?: PartsStatus;
  appointmentId?: string | null;
  durationMinutes?: number;
  reason?: string;
  expectedVersion?: number;
  clientName?: string;
  clientPhone?: string;
  userId?: string;
  vehicleId?: string;
  vin?: string;
  plate?: string;
  make?: string;
  model?: string;
  serviceIds?: string[];
  comment?: string;
  confirmNewClient?: boolean;
  confirmNewVehicle?: boolean;
};

function refused(error: string, status: number) {
  return NextResponse.json({ ok: false, error, persisted: false, crmWritten: false }, { status });
}

export async function POST(req: Request) {
  const actor = await guardScheduler(req, { allowTestBoard: true });
  if (isGuardError(actor)) return actor;
  const ownerPilot = schedulerOwnerWritePilotEnabled();
  if (!schedulerTestWritesEnabled() && !ownerPilot) return refused("test_writes_disabled", 403);
  if (ownerPilot && !schedulerTestWritesEnabled() && actor.role !== "owner") return refused("owner_only", 403);
  if (actor.role !== "owner" && actor.role !== "admin" && !actor.canEdit) return refused("forbidden", 403);
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return refused("invalid", 400);
  if (ownerPilot && !schedulerTestWritesEnabled() && body.mechanicId === "mech-2") return refused("mechanic_not_confirmed", 409);
  if (actor.role !== "owner" && actor.role !== "admin" && actor.role !== "mechanic") return refused("forbidden", 403);
  const appointmentId = body.appointmentId
    || (body.reservationId?.startsWith("res-") ? body.reservationId.slice(4) : body.reservationId)
    || (body.idempotencyKey ? `apt-${body.idempotencyKey}` : "");
  if (body.action === "cancel") {
    if (!appointmentId || body.expectedVersion == null) return refused("version_required", 400);
  } else if (body.action === "move") {
    if (!appointmentId || body.expectedVersion == null) return refused("version_required", 400);
    if (!body.date || !body.start || !body.mechanicId || !body.operationCode || !mechanicMayPlan(actor, body.mechanicId)) return refused("forbidden", 403);
  } else {
    if (!body.idempotencyKey || !appointmentId) return refused("forbidden", 403);
    if (!body.date || !body.start || !body.mechanicId || !body.operationCode || !mechanicMayPlan(actor, body.mechanicId)) return refused("forbidden", 403);
  }
  const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
  const operation = catalog.find((item) => item.operationCode === (body.operationCode || "MA-001"));
  if (!operation) return refused("unknown_operation", 400);
  if (body.action !== "cancel") {
    if (operation.bookingMode === "MANUAL") return refused("manual", 409);
    const planned = planOperationMinutes(operation);
    const duration = planned.minutes == null
      ? resolveDuration(0, body.durationMinutes ? { minutes: body.durationMinutes, reason: body.reason ?? "" } : undefined)
      : resolveDuration(planned.minutes, body.durationMinutes ? { minutes: body.durationMinutes, reason: body.reason ?? "" } : undefined);
    if (planned.minutes == null && !body.durationMinutes) return refused("unconfirmed", 409);
    if (!duration.ok) return refused(duration.error, 400);
    const result = await commitSchedulerToCrm({
      action: body.action === "move" ? "move" : "create",
      kind: "scheduler",
      appointmentId,
      mechanicId: body.mechanicId || "",
      date: body.date || "",
      workStart: body.start || "",
      workMinutes: duration.minutes,
      resourceId: body.resourceIds?.[0],
      arrivalTime: body.arrivalTime,
      clientPhone: body.clientPhone,
      clientName: body.clientName,
      userId: body.userId,
      vehicleId: body.vehicleId,
      vin: body.vin,
      plate: body.plate,
      make: body.make,
      model: body.model,
      serviceIds: body.serviceIds,
      comment: body.comment || body.reason,
      confirmNewClient: body.confirmNewClient,
      confirmNewVehicle: body.confirmNewVehicle,
      hours: workshopHours(),
      actor: { role: actor.role, mechanicId: actor.mechanicId, canEdit: actor.canEdit, id: actor.staffId, staffId: actor.staffId },
      expectedVersion: body.expectedVersion,
      operation,
      parts: body.parts ?? "unknown",
      idempotencyKey: body.idempotencyKey,
    });
    return NextResponse.json({ ok: result.status === 200, ...result }, { status: result.status });
  }
  const result = await commitSchedulerToCrm({
    action: "cancel",
    kind: "scheduler",
    appointmentId,
    mechanicId: body.mechanicId || "mech-1",
    date: body.date || "2026-11-10",
    workStart: body.start || "09:00",
    workMinutes: 30,
    hours: workshopHours(),
    actor: { role: actor.role, mechanicId: actor.mechanicId, canEdit: actor.canEdit, id: actor.staffId, staffId: actor.staffId },
    expectedVersion: body.expectedVersion,
    operation,
    parts: "available",
    comment: body.reason,
  });
  return NextResponse.json({ ok: result.status === 200, ...result }, { status: result.status });
}
