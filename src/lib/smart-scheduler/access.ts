import { NextResponse } from "next/server";
import { schedulerTestBoardOpen, smartWorkSchedulerEnabled } from "@/lib/smart-scheduler/flag";
import { verifyToken } from "@/lib/server/verify-session";
import { verifyTelegramWebAppInitData } from "@/lib/server/telegram-webapp-auth";
import { resolveStaffCalendarActor } from "@/lib/server/staff-calendar-access";

export function mechanicMayPlan(actor: { role: string; mechanicId?: string; canEdit?: boolean }, mechanicId: string): boolean {
  if (actor.role === "owner" || actor.role === "admin") return true;
  if (actor.canEdit === false) return false;
  return actor.role === "mechanic" && Boolean(actor.mechanicId) && actor.mechanicId === mechanicId;
}

export async function guardScheduler(req: Request, options?: { allowTestBoard?: boolean }): Promise<NextResponse | { role: string; mechanicId?: string; canEdit: boolean }> {
  if (!smartWorkSchedulerEnabled()) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }
  const initData = req.headers.get("x-telegram-init-data");
  if (initData) {
    const auth = verifyTelegramWebAppInitData(initData);
    if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
    const actor = await resolveStaffCalendarActor(auth.user.id);
    if (!actor) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    return { role: actor.role, mechanicId: actor.mechanicId, canEdit: actor.canEdit };
  }
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    const session = await verifyToken(header.slice("Bearer ".length).trim());
    if (!session || session.role === "client") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    if (session.role === "admin") return { role: "admin", canEdit: true };
    return { role: "mechanic", mechanicId: session.sub, canEdit: false };
  }
  if (options?.allowTestBoard && schedulerTestBoardOpen()) return { role: "owner", canEdit: true };
  return NextResponse.json({ ok: false, error: "missing" }, { status: 401 });
}

export function isGuardError(value: NextResponse | { role: string }): value is NextResponse {
  return value instanceof NextResponse;
}
