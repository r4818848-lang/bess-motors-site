import type { Database, User, WorkOrder } from "./store";

export const LOYALTY_OIL_CHANGES_REQUIRED = 10;
export const LOYALTY_DISCOUNT_PERCENT = 10;

export function orderIncludesOilChange(order: WorkOrder): boolean {
  const oilNames = /olej|oil|масл|wymian/i;
  return order.services.some(
    (s) => oilNames.test(s.name) || s.name.toLowerCase().includes("olej")
  );
}

export function getLoyaltyOilCount(user: User): number {
  return user.loyaltyOilChanges ?? 0;
}

export function loyaltyRewardAvailable(user: User): boolean {
  return (
    getLoyaltyOilCount(user) >= LOYALTY_OIL_CHANGES_REQUIRED &&
    !user.loyaltyRewardUsedAt
  );
}

/** After paid+delivered WO with oil service */
export function incrementLoyaltyOnDelivered(
  db: Database,
  order: WorkOrder,
  previous?: WorkOrder | null
): void {
  if (order.status !== "delivered" || previous?.status === "delivered") return;
  if (order.paymentStatus !== "paid") return;
  if (!orderIncludesOilChange(order)) return;

  const user = db.users.find((u) => u.id === order.userId);
  if (!user || user.role !== "client") return;

  user.loyaltyOilChanges = (user.loyaltyOilChanges ?? 0) + 1;
}

export function formatLoyaltyProgress(user: User, locale: string): string {
  const n = getLoyaltyOilCount(user);
  const left = Math.max(0, LOYALTY_OIL_CHANGES_REQUIRED - n);
  if (locale === "ru" || locale === "uk") {
    if (loyaltyRewardAvailable(user))
      return `🎁 Доступна скидка ${LOYALTY_DISCOUNT_PERCENT}% на следующую замену масла!`;
    return `Замен масла: ${n}/${LOYALTY_OIL_CHANGES_REQUIRED} (ещё ${left} до скидки ${LOYALTY_DISCOUNT_PERCENT}%)`;
  }
  if (locale === "en") {
    if (loyaltyRewardAvailable(user))
      return `🎁 ${LOYALTY_DISCOUNT_PERCENT}% oil change discount available!`;
    return `Oil changes: ${n}/${LOYALTY_OIL_CHANGES_REQUIRED} (${left} more for ${LOYALTY_DISCOUNT_PERCENT}% off)`;
  }
  if (loyaltyRewardAvailable(user))
    return `🎁 Rabat ${LOYALTY_DISCOUNT_PERCENT}% na kolejną wymianę oleju!`;
  return `Wymiany oleju: ${n}/${LOYALTY_OIL_CHANGES_REQUIRED} (jeszcze ${left} do rabatu ${LOYALTY_DISCOUNT_PERCENT}%)`;
}
