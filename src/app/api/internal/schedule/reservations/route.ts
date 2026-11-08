import { NextResponse } from "next/server";
import { guardScheduler, isGuardError, mechanicMayPlan } from "@/lib/smart-scheduler/access";
import { commitReservation, type Hold, type SchedulerStore } from "@/lib/smart-scheduler/schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const actor = await guardScheduler(req);
  if (isGuardError(actor)) return actor;
  const body = (await req.json().catch(() => null)) as {
    expectedVersion?: number;
    idempotencyKey?: string;
    holds?: Hold[];
    store?: SchedulerStore;
  } | null;
  const holds = body?.holds ?? [];
  if (!actor.canEdit || !body?.idempotencyKey || holds.some((hold) => !mechanicMayPlan(actor, hold.mechanicId))) {
    return NextResponse.json({ ok: false, error: "forbidden", persisted: false }, { status: 403 });
  }
  const result = commitReservation(body.store ?? { version: body.expectedVersion ?? 0, reservations: [] }, {
    expectedVersion: body.expectedVersion ?? 0,
    idempotencyKey: body.idempotencyKey,
    holds,
  });
  return NextResponse.json({
    ok: result.status === 200,
    persisted: false,
    authoritative: false,
    price: null,
    error: result.error ?? null,
    replayed: Boolean(result.replayed),
    version: result.store.version,
  }, { status: result.status });
}
