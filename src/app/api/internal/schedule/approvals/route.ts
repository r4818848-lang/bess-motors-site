import { NextResponse } from "next/server";
import { guardScheduler, isGuardError } from "@/lib/smart-scheduler/access";
import type { BookingActor } from "@/lib/smart-scheduler/booking-rules";
import { schedulerTestWritesEnabled } from "@/lib/smart-scheduler/flag";
import { connectSchedulerDatabase, recordApproval, schedulerDatabaseUrl } from "@/lib/smart-scheduler/postgres";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  operationCode?: string;
  mechanicId?: string;
  date?: string;
  start?: string;
  minutes?: number;
};

export async function POST(req: Request) {
  const actor = await guardScheduler(req, { allowTestBoard: true });
  if (isGuardError(actor)) return actor;
  if (!schedulerTestWritesEnabled()) return NextResponse.json({ ok: false, error: "test_writes_disabled", crmWritten: false }, { status: 403 });
  if (!schedulerDatabaseUrl()) return NextResponse.json({ ok: false, error: "database_required", crmWritten: false }, { status: 503 });
  if (actor.role !== "owner" && actor.role !== "admin") return NextResponse.json({ ok: false, error: "forbidden", crmWritten: false }, { status: 403 });
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.operationCode || !body.mechanicId || !body.date || !body.start || !body.minutes) {
    return NextResponse.json({ ok: false, error: "invalid", crmWritten: false }, { status: 400 });
  }
  const bookingActor: BookingActor = { role: actor.role, mechanicId: actor.mechanicId, canEdit: actor.canEdit, id: actor.mechanicId ?? actor.role };
  const client = await connectSchedulerDatabase();
  try {
    const result = await recordApproval(client, bookingActor, {
      operationCode: body.operationCode,
      mechanicId: body.mechanicId,
      date: body.date,
      start: body.start,
      minutes: body.minutes,
    });
    return NextResponse.json({ ok: result.status === 200, ...result }, { status: result.status });
  } finally {
    await client.end();
  }
}
