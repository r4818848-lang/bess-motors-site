"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "bess-crm-pinned-orders";

export function usePinnedWorkOrders() {
  const [pinned, setPinned] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPinned(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setPinned(next);
    try {
      localStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    (orderId: string) => {
      setPinned((prev) => {
        const next = new Set(prev);
        if (next.has(orderId)) next.delete(orderId);
        else next.add(orderId);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const isPinned = useCallback((orderId: string) => pinned.has(orderId), [pinned]);

  return { isPinned, toggle };
}
