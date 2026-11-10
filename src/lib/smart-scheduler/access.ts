import { NextResponse } from "next/server";
import { schedulerOwnerWritePilotEnabled, schedulerReadOnlyPilotEnabled, schedulerTestBoardOpen, smartWorkSchedulerEnabled } from "@/lib/smart-scheduler/flag";
import { verifyToken } from "@/lib/server/verify-session";
import { verifyTelegramWebAppInitData } from "@/lib/server/telegram-webapp-auth";
import { resolveStaffCalendarActor } from "@/lib/server/staff-calendar-access";

export function mechanicMayPlan(actor: { role: string; mechanicId?: string; canEdit?: boolean }, mechanicId: string): boolean {
  if (actor.role === "owner" || actor.role === "admin") return true;
  if (actor.canEdit === false) return false;
  return actor.role === "mechanic" && Boolean(actor.mechanicId) && actor.mechanicId === mechanicId;
}

export async function guardScheduler(req: Request, options?: { allowTestBoard?: boolean; readOnly?: boolean }): Promise<NextResponse | { role: string; mechanicId?: string; canEdit: boolean; staffId: string }> {
  const readOnlyPilot = Boolean(options?.readOnly && schedulerReadOnlyPilotEnabled());
  const ownerWrite = schedulerOwnerWritePilotEnabled();
  if (!smartWorkSchedulerEnabled() && !readOnlyPilot && !ownerWrite) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }
  const initData = req.headers.get("x-telegram-init-data");
  if (initData) {
    const auth = verifyTelegramWebAppInitData(initData);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
    const actor = await resolveStaffCalendarActor(auth.user.id);
    if (!actor) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    const canEdit = readOnlyPilot ? false : ownerWrite ? actor.role === "owner" : actor.canEdit;
    return { role: actor.role, mechanicId: actor.mechanicId, canEdit, staffId: `tg:${auth.user.id}` };
  }
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    const session = await verifyToken(header.slice("Bearer ".length).trim());
    if (!session || session.role === "client") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    if (session.role === "admin") {
      const canEdit = readOnlyPilot ? false : ownerWrite ? false : true;
      return { role: "admin", canEdit, staffId: session.sub };
    }
    return { role: "mechanic", mechanicId: session.sub, canEdit: false, staffId: session.sub };
  }
  if (options?.allowTestBoard && schedulerTestBoardOpen() && !readOnlyPilot) return { role: "owner", canEdit: true, staffId: "test-board" };
  return NextResponse.json({ ok: false, error: "missing" }, { status: 401 });
}

export function isGuardError(value: NextResponse | { role: string }): value is NextResponse {
  return value instanceof NextResponse;
}
