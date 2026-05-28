"use client";

import { useCallback, useEffect, useState } from "react";
import { DB_CHANGED_EVENT, DB_STORAGE_KEY } from "@/lib/db-events";
import { clearDbCache } from "@/lib/db-cache";

/**
 * Re-render when local DB changes (booking, CRM edits, other tabs).
 * No aggressive polling — only events + slow refresh when tab is visible.
 */
export function useDbSync(): number {
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => {
    clearDbCache();
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DB_STORAGE_KEY) bump();
    };
    window.addEventListener(DB_CHANGED_EVENT, bump);
    window.addEventListener("storage", onStorage);

    // Fallback when another tab writes without event — only while page visible
    let interval: ReturnType<typeof setInterval> | null = null;
    const startPoll = () => {
      if (interval || document.hidden) return;
      interval = setInterval(bump, 30_000);
    };
    const stopPoll = () => {
      if (interval) clearInterval(interval);
      interval = null;
    };
    const onVisibility = () => {
      if (document.hidden) stopPoll();
      else startPoll();
    };
    startPoll();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener(DB_CHANGED_EVENT, bump);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      stopPoll();
    };
  }, [bump]);

  return tick;
}
