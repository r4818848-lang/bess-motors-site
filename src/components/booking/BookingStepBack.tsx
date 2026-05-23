"use client";

import { ChevronLeft } from "lucide-react";

interface Props {
  label: string;
  onClick: () => void;
  className?: string;
}

/** Back control for multi-step booking flows */
export function BookingStepBack({ label, onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 -ml-2 text-sm text-bm-muted hover:text-white hover:bg-white/5 transition-colors ${className}`}
    >
      <ChevronLeft
        size={22}
        className="text-bm-red shrink-0 transition-transform group-hover:-translate-x-0.5"
      />
      <span className="font-medium">{label}</span>
    </button>
  );
}
