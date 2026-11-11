import { NextResponse } from "next/server";
import { requireSeoAdmin } from "@/lib/server/seo-access";
import { createCase, listCases, reviewPhoto, transitionCase, updateCase } from "@/lib/seo-growth/case-store";
import type { CaseServiceId, WorkCaseStatus } from "@/lib/seo-growth/work-cases";
import { CASE_SERVICES, CASE_STATUSES } from "@/lib/seo-growth/work-cases";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isService(value: string): value is CaseServiceId {
  return CASE_SERVICES.some((service) => service.id === value);
}

function statusFor(error: string): number {
  if (error === "STORAGE_NOT_CONFIGURED" || error === "STORAGE_UNAVAILABLE") return 503;
  if (error === "conflict") return 409;
  return 400;
}

export async function GET(req: Request) {
  const auth = await requireSeoAdmin(req);
  if ("error" in auth) return auth.error;
  const listed = await listCases();
  if (!listed.ok) return NextResponse.json({ error: listed.error, cases: null }, { status: statusFor(listed.error) });
  return NextResponse.json({ cases: listed.cases });
}

export async function POST(req: Request) {
  const auth = await requireSeoAdmin(req);
  if ("error" in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as Record<string, string> | null;
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const version = Number(body.version);
  const key = req.headers.get("idempotency-key");
  if (body.id && body.photoId) {
    if (!Number.isInteger(version)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const result = await reviewPhoto(body.id, body.photoId, version);
    return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.error) });
  }
  if (body.id && body.to) {
    if (!CASE_STATUSES.includes(body.to as WorkCaseStatus) || !Number.isInteger(version)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const result = await transitionCase(body.id, version, body.to as WorkCaseStatus);
    return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.error) });
  }
  if (!isService(body.serviceId ?? "")) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (body.id) {
    if (!Number.isInteger(version)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const result = await updateCase(body.id, version, {
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
    return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.error) });
  }
  const result = await createCase(
    {
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
    },
    key
  );
  return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.error) });
}
