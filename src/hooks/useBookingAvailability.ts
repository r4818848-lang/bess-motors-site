"use client";

import { useEffect, useState, useCallback } from "react";

type SlotRow = { date: string; time: string; available: boolean };

export function useBookingAvailability(days = 14) {
  const [availability, setAvailability] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/appointments/availability?days=${days}`)
      .then((r) => r.json())
      .then((data: { slots?: SlotRow[] }) => {
        if (cancelled) return;
        const map = new Map<string, boolean>();
        for (const s of data.slots ?? []) {
          map.set(`${s.date}|${s.time}`, s.available);
        }
        setAvailability(map);
      })
      .catch(() => {
        if (!cancelled) setAvailability(new Map());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const isSlotAvailable = useCallback(
    (dateStr: string, time: string) => {
      if (availability.size === 0) return true;
      return availability.get(`${dateStr}|${time}`) === true;
    },
    [availability]
  );

  const freeSlotCount = availability.size
    ? [...availability.values()].filter(Boolean).length
    : null;

  return { isSlotAvailable, loading, freeSlotCount };
}
