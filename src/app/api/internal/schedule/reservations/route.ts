import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { workshopHours } from "@/lib/businessConfig";
import { guardScheduler, isGuardError, mechanicMayPlan } from "@/lib/smart-scheduler/access";
import { parseOperationCatalog } from "@/lib/smart-scheduler/catalog";
import { schedulerTestWritesEnabled } from "@/lib/smart-scheduler/flag";
import { bookInDatabase, cancelInDatabase, connectSchedulerDatabase, moveInDatabase, schedulerDatabaseUrl } from "@/lib/smart-scheduler/postgres";
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
  const actor = await guardScheduler(req, { allowTestBoard: true });
  if (isGuardError(actor)) return actor;
  if (!schedulerTestWritesEnabled()) {
    return NextResponse.json({ ok: false, error: "test_writes_disabled", persisted: false, crmWritten: false }, { status: 403 });
  }
  if (!schedulerDatabaseUrl()) {
    return NextResponse.json({ ok: false, error: "database_required", persisted: false, crmWritten: false }, { status: 503 });
  }
  if (!actor.canEdit) return NextResponse.json({ ok: false, error: "forbidden", persisted: false, crmWritten: false }, { status: 403 });
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid", persisted: false, crmWritten: false }, { status: 400 });
  const client = await connectSchedulerDatabase();
  try {
    if (body.action === "cancel" && body.reservationId) {
      const result = await cancelInDatabase(client, body.reservationId);
      return NextResponse.json({ ok: result.status === 200, ...result }, { status: result.status });
    }
    if (body.action === "move" && !body.reservationId) {
      return NextResponse.json({ ok: false, error: "invalid", persisted: false, crmWritten: false }, { status: 400 });
    }
    if (body.action !== "move" && !body.idempotencyKey) {
      return NextResponse.json({ ok: false, error: "forbidden", persisted: false, crmWritten: false }, { status: 403 });
    }
    if (!body.date || !body.start || !body.mechanicId || !body.operationCode || !mechanicMayPlan(actor, body.mechanicId)) {
      return NextResponse.json({ ok: false, error: "forbidden", persisted: false, crmWritten: false }, { status: 403 });
    }
    const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
    const operation = catalog.find((item) => item.operationCode === body.operationCode);
    if (!operation) return NextResponse.json({ ok: false, error: "unknown_operation", persisted: false, crmWritten: false }, { status: 400 });
    const planned = planOperationMinutes(operation);
    if (planned.minutes == null) return NextResponse.json({ ok: false, error: "unconfirmed", persisted: false, crmWritten: false }, { status: 409 });
    const duration = resolveDuration(planned.minutes, body.durationMinutes ? { minutes: body.durationMinutes, reason: body.reason ?? "" } : undefined);
    if (!duration.ok) return NextResponse.json({ ok: false, error: duration.error, persisted: false, crmWritten: false }, { status: 400 });
    let workOrderId: string | null = null;
    if (body.appointmentId && process.env.SCHEDULER_CRM_SOURCE === "cloud") {
      const { loadCrmFromCloud } = await import("@/lib/server/telegram-bot/crm-actions");
      const db = await loadCrmFromCloud();
      workOrderId = db?.appointments.find((item) => item.id === body.appointmentId)?.workOrderId ?? null;
    }
    const request = {
      date: body.date,
      start: body.start,
      minutes: duration.minutes,
      mechanicId: body.mechanicId,
      resourceIds: body.resourceIds ?? [],
      operation,
      parts: body.parts ?? "unknown",
      hours: workshopHours(),
      appointmentId: body.appointmentId,
      workOrderId,
    };
    const result = body.action === "move" && body.reservationId
      ? await moveInDatabase(client, { ...request, reservationId: body.reservationId })
      : await bookInDatabase(client, { ...request, idempotencyKey: body.idempotencyKey ?? "" });
    return NextResponse.json({ ok: result.status === 200, ...result }, { status: result.status });
  } finally {
    await client.end();
  }
}
