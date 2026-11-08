import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { workshopHours } from "@/lib/businessConfig";
import { guardScheduler, isGuardError, mechanicMayPlan } from "@/lib/smart-scheduler/access";
import type { BookingActor } from "@/lib/smart-scheduler/booking-rules";
import { parseOperationCatalog } from "@/lib/smart-scheduler/catalog";
import { schedulerTestWritesEnabled } from "@/lib/smart-scheduler/flag";
import { projectCrmOccupancy } from "@/lib/smart-scheduler/occupancy";
import { cancelInDatabase, commitUnifiedWorkshopWrite, connectSchedulerDatabase, issueCrmSnapshot, moveInDatabase, openActorSession, schedulerDatabaseUrl } from "@/lib/smart-scheduler/postgres";
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
  expectedVersion?: number;
};

async function confirmedCrm(client: { query: (sql: string) => Promise<{ rows: { n: number }[] }> }) {
  if (process.env.SCHEDULER_CRM_SOURCE !== "cloud") return "unavailable" as const;
  const { loadCrmFromCloud } = await import("@/lib/server/telegram-bot/crm-actions");
  const db = await loadCrmFromCloud();
  if (!db) return "unavailable" as const;
  const blocks = projectCrmOccupancy(db, workshopHours());
  const store = await client.query("select count(*)::int as n from scheduler_store_appointments where active");
  const rows = await client.query("select count(*)::int as n from scheduler_row_appointments where active");
  if (store.rows[0].n !== rows.rows[0].n || store.rows[0].n !== blocks.length) return "diverged" as const;
  return "ok" as const;
}

export async function POST(req: Request) {
  const actor = await guardScheduler(req, { allowTestBoard: true });
  if (isGuardError(actor)) return actor;
  if (!schedulerTestWritesEnabled()) {
    return NextResponse.json({ ok: false, error: "test_writes_disabled", persisted: false, crmWritten: false }, { status: 403 });
  }
  if (!schedulerDatabaseUrl()) {
    return NextResponse.json({ ok: false, error: "database_required", persisted: false, crmWritten: false }, { status: 503 });
  }
  if (actor.role !== "owner" && actor.role !== "admin" && !actor.canEdit) {
    return NextResponse.json({ ok: false, error: "forbidden", persisted: false, crmWritten: false }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ ok: false, error: "invalid", persisted: false, crmWritten: false }, { status: 400 });
  if (actor.role !== "owner" && actor.role !== "admin" && actor.role !== "mechanic") {
    return NextResponse.json({ ok: false, error: "forbidden", persisted: false, crmWritten: false }, { status: 403 });
  }
  const client = await connectSchedulerDatabase();
  try {
    const crm = await confirmedCrm(client);
    if (crm !== "ok") {
      const status = crm === "diverged" ? 409 : 503;
      return NextResponse.json({ ok: false, error: crm === "diverged" ? "crm_diverged" : "crm_unavailable", persisted: false, crmWritten: false }, { status });
    }
    const issued = await issueCrmSnapshot(client, true);
    if (!issued.ok) {
      const status = issued.error === "crm_diverged" ? 409 : 503;
      return NextResponse.json({ ok: false, error: issued.error, persisted: false, crmWritten: false }, { status });
    }
    const bookingActor: BookingActor = await openActorSession(client, {
      role: actor.role,
      staffId: actor.staffId,
      mechanicId: actor.mechanicId,
      canEdit: actor.canEdit,
    });
    if (body.action === "cancel" && body.reservationId) {
      if (body.expectedVersion == null) return NextResponse.json({ ok: false, error: "version_required", persisted: false, crmWritten: false }, { status: 400 });
      const result = await cancelInDatabase(client, body.reservationId, body.expectedVersion, bookingActor, issued.token);
      return NextResponse.json({ ok: result.status === 200, ...result }, { status: result.status });
    }
    if (body.action === "move" && (!body.reservationId || body.expectedVersion == null)) {
      return NextResponse.json({ ok: false, error: "version_required", persisted: false, crmWritten: false }, { status: 400 });
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
    if (operation.bookingMode === "MANUAL") {
      return NextResponse.json({ ok: false, error: "manual", persisted: false, crmWritten: false }, { status: 409 });
    }
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
      ? await moveInDatabase(client, { ...request, reservationId: body.reservationId, expectedVersion: body.expectedVersion ?? 0, actor: bookingActor, crmToken: issued.token, requestId: body.appointmentId ?? body.idempotencyKey })
      : await commitUnifiedWorkshopWrite(client, { ...request, idempotencyKey: body.idempotencyKey ?? "", actor: bookingActor, crmToken: issued.token, requestId: body.appointmentId ?? body.idempotencyKey });
    return NextResponse.json({ ok: result.status === 200, ...result }, { status: result.status });
  } finally {
    await client.end();
  }
}
