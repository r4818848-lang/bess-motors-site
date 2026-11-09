import { NextResponse } from "next/server";
import { guardScheduler, isGuardError } from "@/lib/smart-scheduler/access";
import { connectSchedulerDatabase, loadSchedulerSettings, saveOwnerSettings, schedulerDatabaseUrl } from "@/lib/smart-scheduler/postgres";
import type { SchedulerSettings } from "@/lib/smart-scheduler/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const actor = await guardScheduler(req, { allowTestBoard: true });
  if (isGuardError(actor)) return actor;
  if (actor.role !== "owner") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (!schedulerDatabaseUrl()) return NextResponse.json({ ok: false, error: "database_required" }, { status: 503 });
  const client = await connectSchedulerDatabase();
  try {
    return NextResponse.json({ ok: true, settings: await loadSchedulerSettings(client) });
  } finally {
    await client.end();
  }
}

export async function PUT(req: Request) {
  const actor = await guardScheduler(req, { allowTestBoard: true });
  if (isGuardError(actor)) return actor;
  if (actor.role !== "owner") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (!schedulerDatabaseUrl()) return NextResponse.json({ ok: false, error: "database_required" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as SchedulerSettings | null;
  if (!body?.resources || !body.schedules || !body.displayNames) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const client = await connectSchedulerDatabase();
  try {
    await saveOwnerSettings(client, body);
    return NextResponse.json({ ok: true, settings: await loadSchedulerSettings(client) });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  } finally {
    await client.end();
  }
}
