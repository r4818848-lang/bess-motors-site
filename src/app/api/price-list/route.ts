import { NextResponse } from "next/server";
import {
  priceListItems,
  publicPriceCategories,
  isPublicPriceCategory,
} from "@/lib/price-list";

export const dynamic = "force-dynamic";

/** Compact price list for PWA offline cache (public categories only) */
export async function GET() {
  const publicItems = priceListItems.filter((i) => isPublicPriceCategory(i.categoryId));
  return NextResponse.json({
    categories: publicPriceCategories.map((c) => ({
      id: c.id,
      namePl: c.namePl,
      nameRu: c.nameRu,
    })),
    items: publicItems.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      namePl: i.namePl,
      nameRu: i.nameRu,
      basePrice: i.basePrice,
      listPrice: i.listPrice,
      unit: i.unit,
      priceFrom: i.priceFrom ?? false,
    })),
    updatedAt: new Date().toISOString().slice(0, 10),
  });
}
