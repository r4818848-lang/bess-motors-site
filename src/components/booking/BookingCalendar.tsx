"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
  startOfWeek,
  addDays,
} from "date-fns";
import { pl, ru, enUS, uk } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import type { Locale } from "@/lib/i18n/types";

const localeMap = { pl, ru, en: enUS, uk };

interface BookingCalendarProps {
  selected: Date | null;
  onSelect: (date: Date) => void;
  locale: Locale;
}

export function BookingCalendar({ selected, onSelect, locale }: BookingCalendarProps) {
  const [current, setCurrent] = useState(new Date());
  const dfLocale = localeMap[locale];

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const today = startOfDay(new Date());
  const weekStart = startOfWeek(new Date(2025, 0, 6), { weekStartsOn: 1 });
  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), "EEEEEE", { locale: dfLocale })
  );

  return (
    <div className="glass-red rounded-xl p-6 neon-border">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => setCurrent(subMonths(current, 1))}
          className="p-2 rounded-lg hover:bg-bm-red/20 text-bm-red transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="font-display font-bold uppercase tracking-wide">
          {format(current, "MMMM yyyy", { locale: dfLocale })}
        </h3>
        <button
          type="button"
          onClick={() => setCurrent(addMonths(current, 1))}
          className="p-2 rounded-lg hover:bg-bm-red/20 text-bm-red transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-bm-muted mb-2">
        {weekdayLabels.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const disabled = isBefore(day, today);
          const isSelected = selected && isSameDay(day, selected);
          const isCurrentMonth = isSameMonth(day, current);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={clsx(
                "aspect-square rounded-lg text-sm font-medium transition-all",
                !isCurrentMonth && "opacity-30",
                disabled && "opacity-20 cursor-not-allowed",
                isSelected && "bg-bm-red text-white shadow-neon-sm",
                !isSelected && !disabled && "hover:bg-bm-red/20 hover:text-bm-red",
                !isSelected && disabled && "text-bm-muted"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
