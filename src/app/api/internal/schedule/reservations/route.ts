import { NextResponse } from "next/server";
import { workshopHours } from "@/lib/businessConfig";
import { guardScheduler, isGuardError, mechanicMayPlan } from "@/lib/smart-scheduler/access";
import { schedulerTestWritesEnabled } from "@/lib/smart-scheduler/flag";
import { syntheticSnapshot } from "@/lib/smart-scheduler/fixture";
import { cancelOnLedger, linkExistingWorkOrder, moveOnLedger, reserveOnLedger } from "@/lib/smart-scheduler/ledger";
import { canAutoBook } from "@/lib/smart-scheduler/policy";
import { parseOperationCatalog } from "@/lib/smart-scheduler/catalog";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { planOperationMinutes, resolveDuration, type PartsStatus } from "@/lib/smart-scheduler/schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  action?: "create" | "move" | "cancel";
  idempotencyKey?: string;
  reservationId?: string;
  date?: string;
  start?: string;
  mechanicId?: string;
  operationCode?: string;
  resourceIds?: string[];
  parts?: PartsStatus;
  appointmentId?: string | null;
  durationMinutes?: number;
  reason?: string;
};

export async function POST(req: Request) {
  const actor = await guardScheduler(req);
  if (isGuardError(actor)) return actor;
  if (!schedulerTestWritesEnabled()) {
    return NextResponse.json({ ok: false, error: "test_writes_disabled", persisted: false }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.idempotencyKey || !actor.canEdit) {
    return NextResponse.json({ ok: false, error: "forbidden", persisted: false }, { status: 403 });
  }
  const snapshot = syntheticSnapshot(new Date(), workshopHours());
  if (body.action === "cancel" && body.reservationId) {
    const result = await cancelOnLedger(body.reservationId);
    return NextResponse.json(result, { status: result.status });
  }
  if (!body.date || !body.start || !body.mechanicId || !body.operationCode || !mechanicMayPlan(actor, body.mechanicId)) {
    return NextResponse.json({ ok: false, error: "forbidden", persisted: false }, { status: 403 });
  }
  const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
  const operation = catalog.find((item) => item.operationCode === body.operationCode);
  if (!operation) return NextResponse.json({ ok: false, error: "unknown_operation", persisted: false }, { status: 400 });
  const planned = planOperationMinutes(operation);
  if (planned.minutes == null) return NextResponse.json({ ok: false, error: "unconfirmed", persisted: false }, { status: 409 });
  const duration = resolveDuration(planned.minutes, body.durationMinutes ? { minutes: body.durationMinutes, reason: body.reason ?? "" } : undefined);
  if (!duration.ok) return NextResponse.json({ ok: false, error: duration.error, persisted: false }, { status: 400 });
  const resources = body.resourceIds ?? [];
  const permission = canAutoBook({ operation, parts: body.parts, resources: snapshot.settings.resources, resourceIds: resources });
  if (!permission.auto && permission.reason !== "approval") {
    return NextResponse.json({ ok: false, error: permission.reason, persisted: false }, { status: 409 });
  }
  const link = linkExistingWorkOrder({
    appointmentId: body.appointmentId,
    appointments: snapshot.appointments.map((item) => ({ id: item.id, workOrderId: item.workOrderId, clientId: item.clientId })),
  });
  const request = {
    idempotencyKey: body.idempotencyKey,
    date: body.date,
    start: body.start,
    minutes: duration.minutes,
    mechanicId: body.mechanicId,
    resourceIds: resources,
    operationCode: operation.operationCode,
    appointmentId: body.appointmentId,
    workOrderId: link.workOrderId,
    crmHolds: snapshot.crmHolds,
    breaks: snapshot.settings.breaks,
    hours: workshopHours(),
  };
  const result = body.action === "move" && body.reservationId
    ? await moveOnLedger({ ...request, reservationId: body.reservationId })
    : await reserveOnLedger(request);
  return NextResponse.json({ ...result, auto: permission.auto }, { status: result.status });
}
