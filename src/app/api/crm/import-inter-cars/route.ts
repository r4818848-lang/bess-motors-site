import { NextResponse } from "next/server";
import {
  INTER_CARS_AUGUST_2026_CONTROLS,
  INTER_CARS_IMPORT_MONTH,
  applyInterCarsImportToDatabase,
  compareInterCarsTotals,
  parseInterCarsAllPositionsSheet,
  summarizeInterCarsImportForDisplay,
  verifyInterCarsSellEqualsPurchase,
  type InterCarsRawRow,
} from "@/lib/inter-cars-import";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";
import { isSupabaseConfigured } from "@/lib/server/crm-cloud";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import interCarsAugustRows from "@/data/inter-cars-august-2026.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** One-time: GET /api/crm/import-inter-cars?key=TELEGRAM_SETUP_KEY [&dry=1] */
export async function GET(req: Request) {
  const setupKey = cleanEnvValue(process.env.TELEGRAM_SETUP_KEY);
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const dryRun = url.searchParams.get("dry") === "1";
  const month = url.searchParams.get("month")?.trim() || INTER_CARS_IMPORT_MONTH;

  if (!setupKey || key !== setupKey) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "cloud_disabled" }, { status: 503 });
  }

  try {
    const rawRows = interCarsAugustRows as InterCarsRawRow[];
    const parsed = parseInterCarsAllPositionsSheet(rawRows, month);
    const mismatches = compareInterCarsTotals(parsed.totals, INTER_CARS_AUGUST_2026_CONTROLS);
    const sellErrors = verifyInterCarsSellEqualsPurchase(parsed.parts);

    if (sellErrors.length || mismatches.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_failed",
          mismatches,
          sellErrors: sellErrors.slice(0, 10),
          issues: parsed.issues.slice(0, 20),
          totals: parsed.totals,
        },
        { status: 422 }
      );
    }

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        summary: summarizeInterCarsImportForDisplay(parsed),
        totals: parsed.totals,
        parts: parsed.parts.length,
        consumables: parsed.consumables.length,
      });
    }

    let applyResult = null;
    const put = await cloudMutateCrmStore(async (db) => {
      applyResult = applyInterCarsImportToDatabase(db, parsed, month);
      return `inter-cars:${applyResult.addedParts}+${applyResult.addedConsumables}`;
    });

    if (!put.ok) {
      return NextResponse.json({ ok: false, error: put.error }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      dryRun: false,
      summary: summarizeInterCarsImportForDisplay(parsed, applyResult ?? undefined),
      apply: applyResult,
      totals: parsed.totals,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "import_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
