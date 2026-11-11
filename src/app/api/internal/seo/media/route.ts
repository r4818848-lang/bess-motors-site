import { NextResponse } from "next/server";
import { requireSeoAdmin } from "@/lib/server/seo-access";
import { attachPhoto } from "@/lib/seo-growth/case-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireSeoAdmin(req);
  if ("error" in auth) return auth.error;
  const form = await req.formData();
  const caseId = String(form.get("caseId") ?? "");
  const version = Number(form.get("version"));
  const file = form.get("file");
  if (!caseId || !Number.isInteger(version) || !(file instanceof File)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await attachPhoto(caseId, version, bytes, req.headers.get("idempotency-key"));
  const status = result.ok ? 200 : result.error === "STORAGE_NOT_CONFIGURED" || result.error === "STORAGE_UNAVAILABLE" ? 503 : 400;
  return NextResponse.json(result, { status });
}
