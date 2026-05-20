"use client";

import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        variant === "primary" && "btn-primary",
        variant === "outline" && "btn-outline",
        variant === "ghost" &&
          "px-4 py-2 text-sm text-bm-muted hover:text-white transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
