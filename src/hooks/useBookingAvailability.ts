"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { BOOKING_HORIZON_DAYS } from "@/lib/booking-horizon";

type SlotRow = { date: string; time: string; available: boolean };

export function useBookingAvailability(days = BOOKING_HORIZON_DAYS) {
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

  const datesWithSlots = useMemo(() => {
    const set = new Set<string>();
    for (const key of availability.keys()) {
      const date = key.split("|")[0];
      if (date) set.add(date);
    }
    return set;
  }, [availability]);

  const isDateInHorizon = useCallback(
    (dateStr: string) => datesWithSlots.has(dateStr),
    [datesWithSlots]
  );

  const isSlotAvailable = useCallback(
    (dateStr: string, time: string) => {
      if (loading) return false;
      if (!loaded || availability.size === 0) return false;
      if (!datesWithSlots.has(dateStr)) return false;
      return availability.get(`${dateStr}|${time}`) === true;
    },
    [availability, loading, loaded, datesWithSlots]
  );

  const freeSlotCount = loaded && availability.size
    ? [...availability.values()].filter(Boolean).length
    : null;

  return { isSlotAvailable, isDateInHorizon, loading, loaded, freeSlotCount, availabilityError: !loading && !loaded };
}
