import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/server/require-staff";
import { cloudGetCrmStore } from "@/lib/server/crm-cloud";
import {
  buildAllMechanicsPayroll,
  buildMechanicPayroll,
  getWarsawWeekRange,
} from "@/lib/payroll";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireStaff(req, { adminOnly: true });
  if ("error" in auth) return auth.error;

  const snap = await cloudGetCrmStore();
  if (!snap) {
    return NextResponse.json({ error: "cloud_unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const mechanicId = url.searchParams.get("mechanicId") || undefined;
  const week = getWarsawWeekRange();
  if (mechanicId) {
    const report = buildMechanicPayroll(snap.doc, mechanicId, week.from, week.to);
    return NextResponse.json({ week: week.label, report });
  }
  const reports = buildAllMechanicsPayroll(snap.doc);
  return NextResponse.json({
    week: week.label,
    reports,
    rule:
      "50% od robocizny netto przy VAT 23%. Metoda płatności (gotówka/BLIK/…) nie wyłącza VAT — tylko flaga vatEnabled na zleceniu.",
  });
}
