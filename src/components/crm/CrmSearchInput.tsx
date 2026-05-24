"use client";

import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function CrmSearchInput({ value, onChange, placeholder, className = "" }: Props) {
  return (
    <div className={`relative max-w-xl ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bm-muted pointer-events-none" />
      <input
        className="input-premium pl-10 w-full text-sm"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
