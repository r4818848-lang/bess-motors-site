"use client";

import type { InputHTMLAttributes } from "react";

/** Parse money/percent input: empty field → 0 in data model. */
export function parsePriceInput(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-") return 0;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

type PriceNumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  value: number;
  onChange: (value: number) => void;
};

/** Number input for prices/discounts: shows empty instead of 0 when unset. */
export function PriceNumberInput({ value, onChange, ...rest }: PriceNumberInputProps) {
  return (
    <input
      type="number"
      {...rest}
      value={value === 0 ? "" : value}
      onChange={(e) => onChange(parsePriceInput(e.target.value))}
    />
  );
}
