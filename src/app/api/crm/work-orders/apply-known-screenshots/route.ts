import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/verify-session";
import { KNOWN_CRM_SCREENSHOTS } from "@/lib/motowarsztat-crm-screenshot-parser";
import {
  enrichWorkOrderFromScreenshot,
  findWorkOrderByNumber,
} from "@/lib/enrich-work-order-from-screenshot";
import { cloudMutateCrmStore } from "@/lib/server/crm-cloud-mutate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

async function requireStaff(req: Request) {
  const token = bearerToken(req);
  if (!token) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const session = await verifyToken(token);
  if (!session || (session.role !== "admin" && session.role !== "mechanic")) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}

/** Apply curated CRM screenshot rows (purchase prices, part numbers) to matching orders. */
export async function POST(req: Request) {
  const auth = await requireStaff(req);
  if ("error" in auth && auth.error) return auth.error;

  const results: Array<{
    order: string;
    status: string;
    updates?: { kind: string; name: string; fields: string[] }[];
    warnings?: string[];
  }> = [];

  for (const snapshot of Object.values(KNOWN_CRM_SCREENSHOTS)) {
    let enrichResult: ReturnType<typeof enrichWorkOrderFromScreenshot> | null = null;
    const put = await cloudMutateCrmStore((db) => {
      const order = findWorkOrderByNumber(db, snapshot.orderNumber);
      if (!order) return false;
      const vatRate = db.settings.vatRate ?? 23;
      enrichResult = enrichWorkOrderFromScreenshot(order, snapshot, vatRate);
      order.updatedAt = new Date().toISOString();
      return order.number;
    });

    if (!put.ok || !enrichResult) {
      results.push({ order: snapshot.orderNumber, status: "not_found" });
      continue;
    }

    results.push({
      order: snapshot.orderNumber,
      status: "ok",
      updates: enrichResult.updates,
      warnings: enrichResult.warnings,
    });
  }

  return NextResponse.json({ ok: true, results });
}
