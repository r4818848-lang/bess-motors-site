import { NextResponse } from "next/server";
import { requireSeoAdmin } from "@/lib/server/seo-access";
import { createCase, listCases, transitionCase, updateCase } from "@/lib/seo-growth/case-store";
import type { CaseServiceId, WorkCaseStatus } from "@/lib/seo-growth/work-cases";
import { CASE_SERVICES, CASE_STATUSES } from "@/lib/seo-growth/work-cases";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isService(value: string): value is CaseServiceId {
  return CASE_SERVICES.some((service) => service.id === value);
}

export async function GET(req: Request) {
  const auth = await requireSeoAdmin(req);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ cases: listCases() });
}

export async function POST(req: Request) {
  const auth = await requireSeoAdmin(req);
  if ("error" in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as Record<string, string> | null;
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (body.id && body.to) {
    if (!CASE_STATUSES.includes(body.to as WorkCaseStatus)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const result = transitionCase(body.id, body.to as WorkCaseStatus);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }
  if (!isService(body.serviceId ?? "")) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (body.id) {
    const result = updateCase(body.id, {
      make: body.make,
      model: body.model,
      generation: body.generation,
      year: body.year,
      engine: body.engine,
      problemPl: body.problemPl,
      diagnosisPl: body.diagnosisPl,
      workPl: body.workPl,
      notesPl: body.notesPl,
      serviceId: body.serviceId as CaseServiceId,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }
  const result = createCase({
    make: body.make ?? "",
    model: body.model ?? "",
    generation: body.generation,
    year: body.year,
    engine: body.engine,
    problemPl: body.problemPl ?? "",
    diagnosisPl: body.diagnosisPl ?? "",
    workPl: body.workPl ?? "",
    notesPl: body.notesPl,
    serviceId: body.serviceId as CaseServiceId,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
