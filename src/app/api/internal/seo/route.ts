import { NextResponse } from "next/server";
import { requireSeoAdmin } from "@/lib/server/seo-access";
import { listActions, listCases, recordOwnerDecision } from "@/lib/seo-growth/case-store";
import { buildPanelSnapshot, weeklyReport } from "@/lib/seo-growth/panel";
import { gbpChecklist, gbpDrafts, describeGbpAccess } from "@/lib/seo-growth/gbp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function storageCode(error: string): "STORAGE_NOT_CONFIGURED" | "STORAGE_UNAVAILABLE" {
  return error === "STORAGE_NOT_CONFIGURED" ? "STORAGE_NOT_CONFIGURED" : "STORAGE_UNAVAILABLE";
}

export async function GET(req: Request) {
  const auth = await requireSeoAdmin(req);
  if ("error" in auth) return auth.error;
  const listed = await listCases();
  const actions = await listActions();
  const caseStorage = listed.ok ? "READY" : storageCode(listed.error);
  const snapshot = buildPanelSnapshot({
    env: process.env,
    cases: listed.ok ? listed.cases : [],
    actions: actions.ok ? actions.actions : [],
    gscTotals: null,
    gscAvailable: false,
    caseStorage,
  });
  return NextResponse.json({
    storage: caseStorage,
    snapshot,
    weekly: weeklyReport(snapshot),
    gbp: { access: describeGbpAccess(process.env), checklist: gbpChecklist(), drafts: gbpDrafts() },
    cases: listed.ok ? listed.cases : null,
    actions: actions.ok ? actions.actions : null,
  });
}

export async function POST(req: Request) {
  const auth = await requireSeoAdmin(req);
  if ("error" in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as { action?: string; note?: string } | null;
  if (!body?.action || body.action === "publish") {
    return NextResponse.json({ error: "refused" }, { status: 400 });
  }
  const entry = await recordOwnerDecision(body.action, body.note ?? "", null);
  if (!entry.ok) return NextResponse.json({ error: entry.error }, { status: 503 });
  return NextResponse.json({ ok: true, entry: entry.entry });
}
