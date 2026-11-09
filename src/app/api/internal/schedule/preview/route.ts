import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { workshopHours } from "@/lib/businessConfig";
import { guardScheduler, isGuardError, mechanicMayPlan } from "@/lib/smart-scheduler/access";
import { parseOperationCatalog } from "@/lib/smart-scheduler/catalog";
import { effectiveMode, explainOverlap, planOperationMinutes, splitWorkBlocks, type PartsStatus } from "@/lib/smart-scheduler/schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Job = { operationCode?: string; mechanicId?: string; start?: string; date?: string; partsStatus?: PartsStatus };

export async function POST(req: Request) {
  const actor = await guardScheduler(req);
  if (isGuardError(actor)) return actor;
  const body = (await req.json().catch(() => null)) as { jobs?: Job[]; date?: string; priority?: "reference" | "formula" } | null;
  const jobs = body?.jobs ?? [];
  if (!actor.canEdit || jobs.some((job) => !mechanicMayPlan(actor, job.mechanicId ?? ""))) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
  const hours = workshopHours();
  const planned = jobs.map((job) => {
    const operation = catalog.find((item) => item.operationCode === job.operationCode);
    if (!operation || !job.date || !job.start || !job.mechanicId) return { ok: false as const, error: "invalid" };
    const minutes = planOperationMinutes(operation, { priority: body?.priority });
    const mode = effectiveMode(operation, job.partsStatus, false);
    if (minutes.minutes == null) return { ok: false as const, error: "unconfirmed", operation: minutes };
    const blocks = splitWorkBlocks({
      id: operation.operationCode,
      date: job.date,
      start: job.start,
      minutes: minutes.minutes,
      hours,
      mechanicId: job.mechanicId,
      resourceIds: [],
      operationCode: operation.operationCode,
    });
    return { ok: blocks.ok, minutes, mode, blocks: blocks.ok ? blocks.blocks : [], error: blocks.ok ? undefined : blocks.error };
  });
  return NextResponse.json({
    ok: planned.every((item) => item.ok),
    persisted: false,
    authoritative: false,
    price: null,
    overlap: explainOverlap(jobs.map((job) => job.operationCode ?? ""), catalog),
    planned,
  });
}
