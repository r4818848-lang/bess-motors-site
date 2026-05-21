"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function Card({ children, className, glow, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={clsx(
        "card-premium animate-fade-in",
        glow && "glass-red neon-border",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
