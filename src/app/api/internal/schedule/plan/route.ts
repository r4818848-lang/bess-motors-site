import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { workshopHours } from "@/lib/businessConfig";
import { guardScheduler, isGuardError } from "@/lib/smart-scheduler/access";
import { parseOperationCatalog } from "@/lib/smart-scheduler/catalog";
import { schedulerPageOpen } from "@/lib/smart-scheduler/flag";
import { loadCopyOccupancy } from "@/lib/smart-scheduler/live-crm";
import { resolveDuration, type OverlapRule } from "@/lib/smart-scheduler/schedule";
import { assignmentRefusal, planCombinedJob, recommendMechanics } from "@/lib/smart-scheduler/workshop-plan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  date?: string;
  start?: string;
  operationCodes?: string[];
  mechanicId?: string;
  resourceIds?: string[];
  durationMinutes?: number;
  reason?: string;
};

/** Read-only planning. Occupancy comes from the CRM copy, never from the browser. */
export async function POST(req: Request) {
  if (!schedulerPageOpen()) {
    return NextResponse.json({ ok: false, error: "disabled", persisted: false, crmWritten: false }, { status: 404 });
  }
  const actor = await guardScheduler(req, { readOnly: true });
  if (isGuardError(actor)) return actor;
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.date || !body.start || !body.operationCodes?.length) {
    return NextResponse.json({ ok: false, error: "invalid", persisted: false, crmWritten: false }, { status: 400 });
  }
  const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
  const rules = JSON.parse(readFileSync(join(process.cwd(), "data/smart-scheduler/overlap-rules.json"), "utf8")) as OverlapRule[];
  const operations = body.operationCodes.map((code) => catalog.find((item) => item.operationCode === code)).filter((item) => item != null);
  const plan = planCombinedJob(operations, rules);
  let minutes = plan.minutes;
  if (minutes == null) {
    const confirmed = resolveDuration(0, body.durationMinutes ? { minutes: body.durationMinutes, reason: body.reason ?? "" } : undefined);
    if (!body.durationMinutes || !confirmed.ok || confirmed.minutes === 0) {
      return NextResponse.json({ ok: false, error: "unconfirmed", plan, options: [], persisted: false, crmWritten: false }, { status: 409 });
    }
    minutes = confirmed.minutes;
  }
  const occupied = await loadCopyOccupancy(workshopHours());
  if (!occupied.ok) {
    return NextResponse.json({
      ok: false,
      error: "occupancy_unavailable",
      plan: { ...plan, minutes, normTrusted: false },
      refusal: "Занятость не прочитана с сервера. Свободное время не подтверждено.",
      options: [],
      persisted: false,
      crmWritten: false,
    }, { status: 503 });
  }
  const mechanics = [
    { id: "mech-1", confirmed: true, label: "Сергей" },
    { id: "mech-2", confirmed: false, label: "Механик 2" },
  ];
  const refusal = body.mechanicId
    ? assignmentRefusal({
      date: body.date,
      start: body.start,
      minutes,
      mechanicId: body.mechanicId,
      confirmed: mechanics.find((item) => item.id === body.mechanicId)?.confirmed === true,
      source: "live",
      resourceIds: body.resourceIds ?? [],
      hours: workshopHours(),
      occupied: occupied.holds,
    })
    : null;
  const options = recommendMechanics({
    mechanics,
    source: "live",
    date: body.date,
    start: body.start,
    minutes,
    resourceIds: body.resourceIds ?? [],
    hours: workshopHours(),
    occupied: occupied.holds,
  });
  return NextResponse.json({
    ok: refusal == null,
    plan: { ...plan, minutes, normTrusted: plan.normTrusted && plan.minutes != null },
    refusal,
    options,
    persisted: false,
    crmWritten: false,
  }, { status: refusal ? 409 : 200 });
}
