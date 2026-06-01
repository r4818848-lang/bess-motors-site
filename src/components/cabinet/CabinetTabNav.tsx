"use client";

import type { LucideIcon } from "lucide-react";

export interface CabinetTabItem {
  id: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

interface Props {
  tabs: CabinetTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

/** Mobile: native select. Desktop: horizontal pill tabs. */
export function CabinetTabNav({ tabs, activeId, onSelect }: Props) {
  return (
    <>
      <label className="md:hidden block mb-4">
        <span className="sr-only">Section</span>
        <select
          className="input-premium w-full text-sm py-3"
          value={activeId}
          onChange={(e) => onSelect(e.target.value)}
        >
          {tabs.map(({ id, label, badge }) => (
            <option key={id} value={id}>
              {label}
              {badge ? ` (${badge})` : ""}
            </option>
          ))}
        </select>
      </label>

      <div
        className="hidden md:flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Cabinet sections"
      >
        {tabs.map(({ id, icon: Icon, label, badge }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all min-h-[44px] ${
                active ? "bg-bm-red shadow-neon-sm text-white" : "glass text-bm-muted hover:text-white"
              }`}
            >
              <Icon size={16} aria-hidden />
              {label}
              {badge ? (
                <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </>
  );
}
