"use client";

import { useCallback, useEffect, useState } from "react";
import { DB_CHANGED_EVENT } from "@/lib/db-events";
import { pullClientPortalFromCloud } from "@/lib/client-portal";
import { syncAppointmentsFromCloud } from "@/lib/cloud-appointments";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

/** Pull client work orders and profile from Supabase */
export function useCloudClientSync(enabled = true): {
  syncing: boolean;
  syncFailed: boolean;
  resync: () => Promise<void>;
} {
  const [syncing, setSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  const resync = useCallback(async () => {
    if (!enabled) return;
    setSyncing(true);
    try {
      const pulled = await pullClientPortalFromCloud();
      await syncAppointmentsFromCloud();
      setSyncFailed(!pulled);
      if (pulled) {
        window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
      }
    } catch {
      setSyncFailed(true);
    } finally {
      setSyncing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void resync();
  }, [enabled, resync]);

  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => void resync();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, resync]);

  useVisibleInterval(() => void resync(), 20_000, enabled);

  return { syncing, syncFailed, resync };
}
