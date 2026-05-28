import { NextResponse } from "next/server";
import { priceListItems, priceCategories } from "@/lib/price-list";

export const dynamic = "force-dynamic";

/** Compact price list for PWA offline cache */
export async function GET() {
  return NextResponse.json({
    categories: priceCategories.map((c) => ({ id: c.id, namePl: c.namePl, nameRu: c.nameRu })),
    items: priceListItems.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      namePl: i.namePl,
      nameRu: i.nameRu,
      basePrice: i.basePrice,
      unit: i.unit,
      priceFrom: i.priceFrom ?? false,
    })),
    updatedAt: new Date().toISOString().slice(0, 10),
  });
}
