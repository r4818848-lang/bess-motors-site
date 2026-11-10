import { NextResponse } from "next/server";
import { guardScheduler, isGuardError } from "@/lib/smart-scheduler/access";
import { schedulerPageOpen } from "@/lib/smart-scheduler/flag";
import { connectLiveCrmCopy, liveCrmCopyUrl } from "@/lib/smart-scheduler/live-crm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Local audit only. No CRM row is read or written. */
export async function GET(req: Request) {
  if (!schedulerPageOpen()) {
    return NextResponse.json({ ok: false, error: "disabled", persisted: false, crmWritten: false }, { status: 404 });
  }
  const actor = await guardScheduler(req, { readOnly: true });
  if (isGuardError(actor)) return actor;
  if (actor.role !== "owner" && actor.role !== "admin") {
    return NextResponse.json({ ok: false, error: "forbidden", persisted: false, crmWritten: false }, { status: 403 });
  }
  if (!liveCrmCopyUrl()) {
    return NextResponse.json({ ok: false, error: "database_required", persisted: false, crmWritten: false }, { status: 503 });
  }
  const appointmentId = new URL(req.url).searchParams.get("appointmentId")?.trim() ?? "";
  let client;
  try {
    client = await connectLiveCrmCopy();
  } catch {
    return NextResponse.json({ ok: false, error: "database_required", persisted: false, crmWritten: false }, { status: 503 });
  }
  try {
    const rows = appointmentId
      ? await client.query<{ action: string; actor_id: string; version: number; reason: string; created_at: string }>(
        "select action, actor_id, version, reason, created_at from scheduler_change_log where appointment_id = $1 order by created_at",
        [appointmentId]
      )
      : await client.query<{ action: string; actor_id: string; version: number; reason: string; created_at: string }>(
        "select action, actor_id, version, reason, created_at from scheduler_change_log order by created_at desc limit 50"
      );
    return NextResponse.json({
      ok: true,
      entries: rows.rows.map((row) => ({
        action: row.action,
        actorId: row.actor_id,
        version: row.version,
        reason: row.reason,
        createdAt: row.created_at,
      })),
      persisted: false,
      crmWritten: false,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "history_unavailable", persisted: false, crmWritten: false }, { status: 503 });
  } finally {
    await client.end();
  }
}
