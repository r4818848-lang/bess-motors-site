import { NextResponse } from "next/server";
import { requireSeoAdmin } from "@/lib/server/seo-access";
import { listActions, listCases, recordOwnerDecision } from "@/lib/seo-growth/case-store";
import { buildPanelSnapshot, weeklyReport } from "@/lib/seo-growth/panel";
import { gbpChecklist, gbpDrafts, describeGbpAccess } from "@/lib/seo-growth/gbp";
import { readFileSync } from "node:fs";
import path from "node:path";
import { seoStoreDirectory } from "@/lib/seo-growth/case-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readImportedTotals(): { clicks: number; impressions: number; ctr: number; position: number } | null {
  try {
    const raw = JSON.parse(readFileSync(path.join(seoStoreDirectory(), "gsc-summary.json"), "utf8")) as {
      clicks?: number;
      impressions?: number;
      ctr?: number;
      position?: number;
    };
    if (typeof raw.clicks !== "number" || typeof raw.impressions !== "number") return null;
    return {
      clicks: raw.clicks,
      impressions: raw.impressions,
      ctr: typeof raw.ctr === "number" ? raw.ctr : 0,
      position: typeof raw.position === "number" ? raw.position : 0,
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const auth = await requireSeoAdmin(req);
  if ("error" in auth) return auth.error;
  const cases = listCases();
  const snapshot = buildPanelSnapshot({
    env: process.env,
    cases,
    actions: listActions(),
    gscTotals: readImportedTotals(),
    gscAvailable: readImportedTotals() != null,
  });
  return NextResponse.json({
    snapshot,
    weekly: weeklyReport(snapshot),
    gbp: { access: describeGbpAccess(process.env), checklist: gbpChecklist(), drafts: gbpDrafts() },
    cases: cases.map(({ history, ...story }) => ({ ...story, history })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSeoAdmin(req);
  if ("error" in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as { action?: string; note?: string } | null;
  if (!body?.action || body.action === "publish") {
    return NextResponse.json({ error: "refused" }, { status: 400 });
  }
  const entry = recordOwnerDecision(body.action, body.note ?? "", null);
  return NextResponse.json({ ok: true, entry });
}
