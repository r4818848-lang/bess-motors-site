import { NextResponse } from "next/server";
import { requireSeoAdmin } from "@/lib/server/seo-access";
import { buildGscReport, periodFromTables } from "@/lib/gsc-import";
import { describePeriodWindow, periodsAreComparable, rollupQueries, validateGscExport } from "@/lib/gsc-analysis";
import { recordOwnerDecision } from "@/lib/seo-growth/case-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireSeoAdmin(req);
  if ("error" in auth) return auth.error;
  const body = (await req.json().catch(() => null)) as {
    current?: { name: string; csv: string }[];
    previous?: { name: string; csv: string }[];
  } | null;
  const currentFiles = body?.current ?? [];
  const previousFiles = body?.previous ?? [];
  if (currentFiles.length === 0) {
    return NextResponse.json({ status: "NO_DATA", report: null });
  }
  const currentChecks = currentFiles.map((file) => validateGscExport(file.name, file.csv));
  const previousChecks = previousFiles.map((file) => validateGscExport(file.name, file.csv));
  const current = currentChecks.map((check) => check.table);
  const previous = previousChecks.map((check) => check.table);
  const report = buildGscReport({ env: {}, current, previous });
  const period = periodFromTables(current);
  const previousPeriod = periodFromTables(previous);
  const decision = await recordOwnerDecision("import_gsc", `rows:${current.reduce((sum, table) => sum + table.rows.length, 0)}`, null);
  return NextResponse.json({
    status: period?.totals ? "IMPORTED" : "NO_DATA",
    persisted: decision.ok,
    decision: decision.ok ? "STORED" : decision.error,
    checks: currentChecks.map(({ table, ...check }) => ({ ...check, kind: table.kind, rows: table.rows.length })),
    window: describePeriodWindow(period),
    comparison: periodsAreComparable(period, previousPeriod),
    queries: rollupQueries(period?.queries ?? []),
    lowCtr: report.commercialLowCtr,
    notes: report.notes,
  });
}
