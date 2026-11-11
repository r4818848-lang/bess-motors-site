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
  const file = form.get("file");
  if (!caseId || !(file instanceof File)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = attachPhoto(caseId, bytes);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
