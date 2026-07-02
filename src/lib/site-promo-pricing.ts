import type { PriceCategoryId, PriceListItem } from "@/lib/price-list";
import { SITE_PROMO_PERCENT } from "@/lib/promo-codes";

export function isSitePromoExcluded(
  item: Pick<PriceListItem, "categoryId">
): boolean {
  return item.categoryId === "ac";
}

export function applySitePromoPrice(
  basePrice: number,
  categoryId: PriceCategoryId
): number {
  if (basePrice <= 0 || categoryId === "ac") return basePrice;
  return Math.round((basePrice * (100 - SITE_PROMO_PERCENT)) / 100);
}

/** Display / cart unit price (already stored in priceListItems.basePrice). */
export function getEffectiveUnitPrice(item: PriceListItem): number {
  if (item.unit === "free") return 0;
  return item.basePrice;
}

export function getCompareAtUnitPrice(item: PriceListItem): number | null {
  if (item.unit === "free" || isSitePromoExcluded(item)) return null;
  return item.listPrice ?? null;
}

export function getDiscountPercent(compareAt: number, price: number): number | null {
  if (compareAt <= 0 || price <= 0 || compareAt <= price) return null;
  return Math.round((1 - price / compareAt) * 100);
}

/** For hardcoded landing-page amounts not yet in the price list. */
export function withSitePromoPriceZl(
  priceZl: number,
  categoryId: PriceCategoryId
): { priceZl: number; compareAtZl?: number } {
  if (priceZl <= 0 || categoryId === "ac") return { priceZl };
  const discounted = applySitePromoPrice(priceZl, categoryId);
  if (discounted >= priceZl) return { priceZl };
  return { priceZl: discounted, compareAtZl: priceZl };
}
