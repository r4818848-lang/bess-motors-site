import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { workshopHours } from "@/lib/businessConfig";
import { guardScheduler, isGuardError } from "@/lib/smart-scheduler/access";
import { parseOperationCatalog } from "@/lib/smart-scheduler/catalog";
import { schedulerPageOpen } from "@/lib/smart-scheduler/flag";
import { assignmentRefusal, planCombinedJob, recommendMechanics } from "@/lib/smart-scheduler/workshop-plan";
import type { Hold, OverlapRule } from "@/lib/smart-scheduler/schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  date?: string;
  start?: string;
  operationCodes?: string[];
  mechanicId?: string;
  mechanicConfirmed?: boolean;
  source?: "live" | "fixture";
  resourceIds?: string[];
  occupied?: Hold[];
};

/** Read-only planning. It never writes CRM or the scheduler ledger. */
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
  if (plan.minutes == null) {
    return NextResponse.json({ ok: false, error: "unconfirmed", plan, persisted: false, crmWritten: false }, { status: 409 });
  }
  const source = body.source === "fixture" ? "fixture" : "live";
  const occupied = body.occupied ?? [];
  const refusal = body.mechanicId
    ? assignmentRefusal({
      date: body.date,
      start: body.start,
      minutes: plan.minutes,
      mechanicId: body.mechanicId,
      confirmed: body.mechanicConfirmed !== false && body.mechanicId !== "mech-2",
      source,
      resourceIds: body.resourceIds ?? [],
      hours: workshopHours(),
      occupied,
    })
    : null;
  const options = recommendMechanics({
    mechanics: [
      { id: "mech-1", confirmed: true, label: "Сергей" },
      { id: "mech-2", confirmed: false, label: "Механик 2" },
    ],
    source,
    date: body.date,
    start: body.start,
    minutes: plan.minutes,
    resourceIds: body.resourceIds ?? [],
    hours: workshopHours(),
    occupied,
  });
  return NextResponse.json({
    ok: refusal == null,
    plan,
    refusal,
    options,
    persisted: false,
    crmWritten: false,
  }, { status: refusal ? 409 : 200 });
}
