import { NextResponse } from "next/server";
import { smartWorkSchedulerEnabled } from "@/lib/smart-scheduler/flag";
import { verifyTelegramWebAppInitData } from "@/lib/server/telegram-webapp-auth";
import { resolveStaffCalendarActor } from "@/lib/server/staff-calendar-access";

export function mechanicMayPlan(actor: { role: string; mechanicId?: string }, mechanicId: string): boolean {
  if (actor.role === "owner" || actor.role === "admin") return true;
  return actor.role === "mechanic" && Boolean(actor.mechanicId) && actor.mechanicId === mechanicId;
}

export async function guardScheduler(req: Request): Promise<NextResponse | { role: string; mechanicId?: string; canEdit: boolean }> {
  if (!smartWorkSchedulerEnabled()) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }
  const auth = verifyTelegramWebAppInitData(req.headers.get("x-telegram-init-data"));
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  const actor = await resolveStaffCalendarActor(auth.user.id);
  if (!actor) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  return { role: actor.role, mechanicId: actor.mechanicId, canEdit: actor.canEdit };
}

export function isGuardError(value: NextResponse | { role: string }): value is NextResponse {
  return value instanceof NextResponse;
}
