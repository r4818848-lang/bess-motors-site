"use client";

import { clsx } from "clsx";
import { useI18n } from "@/lib/i18n/context";
import { contentLocale } from "@/lib/i18n/locale-utils";
import type { PriceListItem } from "@/lib/price-list";
import { compareAtUnitPriceHint, unitPriceHint } from "@/lib/booking-cart";
import { getDiscountPercent } from "@/lib/site-promo-pricing";

type BaseProps = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Override auto discount badge (e.g. −50% on AC landing) */
  discountPercent?: number;
};

type ItemProps = BaseProps & {
  item: PriceListItem;
  compareAtZl?: never;
  priceZl?: never;
  priceFrom?: never;
  priceSuffix?: never;
};

type AmountProps = BaseProps & {
  item?: never;
  compareAtZl?: number | null;
  priceZl: number;
  priceFrom?: boolean;
  priceSuffix?: string;
};

export function PromoPriceDisplay(props: ItemProps | AmountProps) {
  const { locale, t } = useI18n();
  const lang = contentLocale(locale);
  const pp = t.promoPrice;
  const { size = "sm", className, discountPercent: discountOverride } = props;

  let compareText: string | null = null;
  let nowText: string;
  let discount: number | null = null;

  if ("item" in props && props.item) {
    compareText = compareAtUnitPriceHint(props.item, locale);
    nowText = unitPriceHint(props.item, locale);
    if (props.item.listPrice && props.item.listPrice > props.item.basePrice) {
      discount = getDiscountPercent(props.item.listPrice, props.item.basePrice);
    }
  } else {
    const { compareAtZl, priceZl, priceFrom, priceSuffix = " zł" } = props;
    const from = priceFrom ? (lang === "ru" ? "от " : "od ") : "";
    nowText = `${from}${priceZl}${priceSuffix}`;
    if (compareAtZl != null && compareAtZl > priceZl) {
      compareText = `${from}${compareAtZl}${priceSuffix}`;
      discount = getDiscountPercent(compareAtZl, priceZl);
    }
  }

  if (discountOverride != null) {
    discount = discountOverride;
  }

  if (!compareText) {
    return (
      <span
        className={clsx(
          "font-mono font-bold text-bm-red",
          size === "xs" && "text-xs",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-lg",
          className
        )}
      >
        {nowText}
      </span>
    );
  }

  const badgeClass =
    size === "lg" ? "text-[11px] px-2 py-0.5" : "text-[10px] px-1.5 py-0.5";
  const wasClass =
    size === "lg" ? "text-sm" : size === "md" ? "text-xs" : "text-[11px]";
  const nowClass =
    size === "lg"
      ? "text-lg font-display"
      : size === "md"
        ? "text-base"
        : size === "sm"
          ? "text-sm"
          : "text-xs";

  return (
    <span
      className={clsx(
        "inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono",
        className
      )}
    >
      {discount != null && discount > 0 ? (
        <span
          className={clsx(
            "shrink-0 rounded border border-emerald-500/40 bg-emerald-500/15 font-bold uppercase tracking-wide text-emerald-400",
            badgeClass
          )}
        >
          −{discount}%
        </span>
      ) : null}
      <span className={clsx("text-bm-muted", wasClass)}>
        <span className="sr-only">{pp.was}: </span>
        <span className="opacity-80">{pp.was}</span>{" "}
        <span className="line-through">{compareText}</span>
      </span>
      <span className="text-white/40" aria-hidden>
        →
      </span>
      <span className={clsx("font-bold text-bm-red", nowClass)}>
        <span className="sr-only">{pp.now}: </span>
        <span className="opacity-90 font-normal text-white/70">{pp.now}</span> {nowText}
      </span>
    </span>
  );
}
