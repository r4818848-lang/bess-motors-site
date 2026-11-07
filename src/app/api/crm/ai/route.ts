import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/server/require-staff";
import { getAiAuditLog, listAiToolCatalog, runErpAgent } from "@/lib/ai/agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireStaff(req, { adminOnly: true });
  if ("error" in auth) return auth.error;
  const url = new URL(req.url);
  if (url.searchParams.get("audit") === "1") {
    return NextResponse.json({ audit: getAiAuditLog().slice(0, 50) });
  }
  return NextResponse.json({
    tools: listAiToolCatalog(),
    llmConfigured: Boolean(process.env.ERP_AI_API_KEY?.trim()),
    spendNote:
      "Лимиты: ERP_AI_MAX_TOKENS, модели ERP_AI_MODEL_SIMPLE / ERP_AI_MODEL_COMPLEX. Бюджет ~200 zł/мес не гарантирован при высоком объёме.",
  });
}

export async function POST(req: Request) {
  const auth = await requireStaff(req);
  if ("error" in auth) return auth.error;

  let body: { prompt?: string; confirmActions?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const prompt = body.prompt?.trim();
  if (!prompt || prompt.length > 4000) {
    return NextResponse.json({ error: "prompt_required" }, { status: 400 });
  }

  const result = await runErpAgent({
    prompt,
    userId: auth.session.sub || "staff",
    role: auth.session.role,
    confirmActions: body.confirmActions,
  });
  return NextResponse.json(result);
}
