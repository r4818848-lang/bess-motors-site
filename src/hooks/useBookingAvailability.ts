"use client";

import { useEffect, useState, useCallback } from "react";

type SlotRow = { date: string; time: string; available: boolean };

export function useBookingAvailability(days = 14) {
  const [availability, setAvailability] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoaded(false);
    fetch(`/api/appointments/availability?days=${days}`)
      .then((r) => r.json())
      .then((data: { slots?: SlotRow[] }) => {
        if (cancelled) return;
        const map = new Map<string, boolean>();
        for (const s of data.slots ?? []) {
          map.set(`${s.date}|${s.time}`, s.available);
        }
        setAvailability(map);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setAvailability(new Map());
          setLoaded(false);
        }
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
      if (loading) return false;
      // API error — don't grey out every slot; server validates on submit
      if (!loaded || availability.size === 0) return true;
      return availability.get(`${dateStr}|${time}`) === true;
    },
    [availability, loading, loaded]
  );

  const freeSlotCount = loaded && availability.size
    ? [...availability.values()].filter(Boolean).length
    : null;

  return { isSlotAvailable, loading, loaded, freeSlotCount };
}
