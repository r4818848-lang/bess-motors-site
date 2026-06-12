"use client";

import { useCallback, useEffect, useRef, useState, type InputHTMLAttributes } from "react";

/** Parse money/percent: empty → 0. Accepts comma or dot as decimal separator. */
export function parsePriceInput(raw: string): number {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (trimmed === "" || trimmed === "-" || trimmed === "," || trimmed === ".") return 0;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatMoneyDisplay(value: number): string {
  if (value === 0) return "";
  const rounded = Math.round(value * 100) / 100;
  const [intPart, decPart] = rounded.toFixed(2).split(".");
  if (decPart === "00") return intPart;
  return `${intPart},${decPart}`;
}

function formatPercentDisplay(value: number): string {
  if (value === 0) return "";
  return String(value).replace(".", ",");
}

/** While typing: digits + one comma (dot → comma). No auto-split — 150 stays 150, not 1,50. */
function normalizeMoneyTyping(raw: string): string {
  const s = raw.replace(/[^\d,.]/g, "").replace(".", ",");
  const sepAt = s.indexOf(",");
  if (sepAt >= 0) {
    const head = s.slice(0, sepAt).replace(/,/g, "");
    const tail = s
      .slice(sepAt + 1)
      .replace(/,/g, "")
      .slice(0, 2);
    return tail.length ? `${head},${tail}` : head ? `${head},` : "";
  }
  return s.replace(/,/g, "");
}

type PriceNumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number;
  onChange: (value: number) => void;
  /** money = zł with comma; percent = discount % without forced decimals */
  variant?: "money" | "percent";
};

/** Price/discount input: empty instead of 0, Polish comma, no browser number spinners. */
export function PriceNumberInput({
  value,
  onChange,
  variant = "money",
  onBlur,
  onFocus,
  ...rest
}: PriceNumberInputProps) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");
  const lastExternal = useRef(value);

  const formatDisplay = useCallback(
    (n: number) => (variant === "percent" ? formatPercentDisplay(n) : formatMoneyDisplay(n)),
    [variant]
  );

  useEffect(() => {
    if (!focused && value !== lastExternal.current) {
      lastExternal.current = value;
      setText(formatDisplay(value));
    }
  }, [value, focused, formatDisplay]);

  const showValue = focused ? text : formatDisplay(value);

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      {...rest}
      value={showValue}
      onFocus={(e) => {
        setFocused(true);
        const initial = value === 0 ? "" : formatDisplay(value);
        setText(variant === "money" ? initial.replace(/,00$/, "") : initial);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        const parsed = parsePriceInput(text);
        lastExternal.current = parsed;
        onChange(parsed);
        setText(formatDisplay(parsed));
        onBlur?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        const next =
          variant === "money" ? normalizeMoneyTyping(raw) : raw.replace(/[^\d,.]/g, "").replace(".", ",");
        setText(next);
        const parsed = parsePriceInput(next);
        lastExternal.current = parsed;
        onChange(parsed);
      }}
    />
  );
}
