"use client";

import { useCallback, useEffect, useState } from "react";
import { DB_CHANGED_EVENT } from "@/lib/db-events";
import { pullClientPortalFromCloud } from "@/lib/client-portal";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

/** Pull client work orders and profile from Supabase */
export function useCloudClientSync(enabled = true): {
  syncing: boolean;
  resync: () => Promise<void>;
} {
  const [syncing, setSyncing] = useState(false);

  const resync = useCallback(async () => {
    if (!enabled) return;
    setSyncing(true);
    try {
      const pulled = await pullClientPortalFromCloud();
      if (pulled) {
        window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
      }
    } finally {
      setSyncing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void resync();
  }, [enabled, resync]);

  useVisibleInterval(() => void resync(), 120_000, enabled);

  return { syncing, resync };
}
