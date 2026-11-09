import { NextResponse } from "next/server";
import { workshopHours } from "@/lib/businessConfig";
import { guardScheduler, isGuardError } from "@/lib/smart-scheduler/access";
import { assembleBoard } from "@/lib/smart-scheduler/board";
import { schedulerReadOnlyPilotEnabled, schedulerTestBoardOpen, smartWorkSchedulerEnabled } from "@/lib/smart-scheduler/flag";
import { connectSchedulerDatabase, loadSchedulerSettings, schedulerDatabaseUrl } from "@/lib/smart-scheduler/postgres";
import { defaultSchedulerSettings } from "@/lib/smart-scheduler/settings";
import { responseLeaksSecrets } from "@/lib/smart-scheduler/visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function settingsOrDefault() {
  if (!schedulerDatabaseUrl()) return defaultSchedulerSettings;
  const client = await connectSchedulerDatabase();
  try {
    return await loadSchedulerSettings(client);
  } finally {
    await client.end();
  }
}

export async function GET(req: Request) {
  const mode = new URL(req.url).searchParams.get("mode") === "test" ? "test" : "live";
  if (mode === "test" && process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }
  const actor = await guardScheduler(req, { allowTestBoard: mode === "test", readOnly: true });
  if (isGuardError(actor)) {
    if (mode === "live" && schedulerTestBoardOpen()) {
      const empty = assembleBoard({ mode: "live", actor: { role: "owner", canEdit: true }, now: new Date(), hours: workshopHours(), crm: null, settings: await settingsOrDefault() });
      return NextResponse.json({ ok: true, mode: "live", canConfigure: true, writable: false, message: empty.message, snapshot: empty.snapshot });
    }
    return actor;
  }
  if (mode === "live" && process.env.SCHEDULER_CRM_SOURCE !== "cloud") {
    return NextResponse.json({ ok: false, error: "crm_unavailable", writable: false }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
  const settings = await settingsOrDefault();
  let crm = null;
  if (mode === "live" && process.env.SCHEDULER_CRM_SOURCE === "cloud") {
    const { loadCrmFromCloud } = await import("@/lib/server/telegram-bot/crm-actions");
    crm = await loadCrmFromCloud();
    if (!crm) return NextResponse.json({ ok: false, error: "cloud_empty", writable: false }, { status: 503 });
  }
  const board = assembleBoard({ mode, actor, now: new Date(), hours: workshopHours(), crm, settings });
  if (responseLeaksSecrets(board) || JSON.stringify(board).includes("service_role")) {
    return NextResponse.json({ ok: false, error: "redacted", writable: false }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    mode,
    canConfigure: actor.role === "owner" && smartWorkSchedulerEnabled() && !schedulerReadOnlyPilotEnabled(),
    writable: false,
    writeRequired: false,
    message: board.message,
    snapshot: board.snapshot,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
