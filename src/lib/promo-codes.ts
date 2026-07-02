/** Site-wide promo — labor + parts. AC −50% promo is separate (ac-recharge-promo-seo). */

export type PromoRule = { code: string; percentOff: number };

export const SITE_PROMO_CODE = "BESSMOTORS";
export const SITE_PROMO_DISPLAY = "BessMotors";
export const SITE_PROMO_PERCENT = 15;

const DEFAULT_SITE_PROMO: PromoRule = {
  code: SITE_PROMO_CODE,
  percentOff: SITE_PROMO_PERCENT,
};

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
  const fromEnv = parsePromos();
  if (fromEnv.length) return fromEnv;
  return [DEFAULT_SITE_PROMO];
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
