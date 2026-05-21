"use client";

import { useCallback, useEffect, useState } from "react";
import { DB_CHANGED_EVENT, DB_STORAGE_KEY } from "@/lib/db-events";

/** Re-render when local DB changes (booking, CRM edits, other tabs). */
export function useDbSync(): number {
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DB_STORAGE_KEY) bump();
    };
    window.addEventListener(DB_CHANGED_EVENT, bump);
    window.addEventListener("storage", onStorage);
    const interval = setInterval(bump, 2000);
    return () => {
      window.removeEventListener(DB_CHANGED_EVENT, bump);
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, [bump]);

  return tick;
}
