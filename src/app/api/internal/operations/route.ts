import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { guardScheduler, isGuardError } from "@/lib/smart-scheduler/access";
import { parseOperationCatalog } from "@/lib/smart-scheduler/catalog";
import { searchOperations } from "@/lib/smart-scheduler/search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const actor = await guardScheduler(req);
  if (isGuardError(actor)) return actor;
  const catalog = parseOperationCatalog(readFileSync(join(process.cwd(), "data/smart-scheduler/bess_operation_seed.csv"), "utf8"));
  const query = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json({ ok: true, persisted: false, price: null, result: query ? searchOperations(catalog, query) : { count: catalog.length } });
}
