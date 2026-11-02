import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/server/require-staff";
import { searchAllSuppliers } from "@/lib/suppliers/search";
import { compareSupplierOffers } from "@/lib/suppliers/compare";
import type { PartsSearchQuery, SupplierId } from "@/lib/suppliers/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireStaff(req);
  if ("error" in auth) return auth.error;

  let body: PartsSearchQuery & { supplierIds?: SupplierId[]; markupPercent?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.article && !body.oem && !body.name && !body.vin) {
    return NextResponse.json({ error: "query_required" }, { status: 400 });
  }

  const { results, offers } = await searchAllSuppliers(
    {
      vin: body.vin?.trim(),
      oem: body.oem?.trim(),
      article: body.article?.trim(),
      name: body.name?.trim(),
      make: body.make?.trim(),
      model: body.model?.trim(),
      brand: body.brand?.trim(),
      priceBasis: "net",
    },
    { supplierIds: body.supplierIds, markupPercent: body.markupPercent }
  );

  const groups = compareSupplierOffers(offers);
  return NextResponse.json({
    results,
    groups,
    priceBasis: "net",
    note: "Ceny netto od dostawców. Oferty z cache oznaczone fromCache — nie traktuj jako świeże bez sprawdzenia.",
  });
}
