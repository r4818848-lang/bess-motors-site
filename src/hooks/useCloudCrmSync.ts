"use client";

import { useCallback, useEffect, useState } from "react";
import { DB_SAVED_EVENT } from "@/lib/db-events";
import {
  pullCrmFromCloud,
  pushCrmIfCloudEmpty,
  scheduleCrmCloudPush,
} from "@/lib/cloud-crm-db";
import { DB_CHANGED_EVENT } from "@/lib/db-events";
import type { Database } from "@/lib/store";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

/** Sync full CRM database with Supabase for admin (all devices) */
export function useCloudCrmSync(enabled = true): {
  syncing: boolean;
  resync: () => Promise<void>;
} {
  const [syncing, setSyncing] = useState(false);

  const resync = useCallback(async () => {
    if (!enabled) return;
    setSyncing(true);
    try {
      await pushCrmIfCloudEmpty();
      const pulled = await pullCrmFromCloud();
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

    const onSaved = (e: Event) => {
      const detail = (e as CustomEvent<Database>).detail;
      if (detail) scheduleCrmCloudPush(detail);
    };
    window.addEventListener(DB_SAVED_EVENT, onSaved);

    return () => {
      window.removeEventListener(DB_SAVED_EVENT, onSaved);
    };
  }, [enabled, resync]);

  useVisibleInterval(() => void resync(), 120_000, enabled);

  return { syncing, resync };
}
