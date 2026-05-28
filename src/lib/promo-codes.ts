/** Promocodes from env only — no JSON files. NEXT_PUBLIC_PROMO_CODES=WIOSNA10:10,OLEJ5:5 */

export type PromoRule = { code: string; percentOff: number };

function parsePromos(): PromoRule[] {
  const raw =
    process.env.NEXT_PUBLIC_PROMO_CODES?.trim() ||
    process.env.PROMO_CODES?.trim() ||
    "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => {
      const [code, pct] = part.split(":").map((s) => s.trim());
      const percentOff = Number(pct);
      if (!code || !Number.isFinite(percentOff) || percentOff <= 0) return null;
      return { code: code.toUpperCase(), percentOff: Math.min(50, percentOff) };
    })
    .filter((x): x is PromoRule => x !== null);
}

export function getPromoRules(): PromoRule[] {
  return parsePromos();
}

export function matchPromoCode(input: string): PromoRule | null {
  const code = input.trim().toUpperCase();
  if (!code) return null;
  return getPromoRules().find((p) => p.code === code) ?? null;
}

export function applyPromoDiscount(subtotal: number, rule: PromoRule): number {
  const discount = (subtotal * rule.percentOff) / 100;
  return Math.max(0, subtotal - discount);
}
