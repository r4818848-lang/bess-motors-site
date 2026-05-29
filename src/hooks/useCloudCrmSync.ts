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
  syncFailed: boolean;
  resync: () => Promise<boolean>;
} {
  const [syncing, setSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  const resync = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false;
    setSyncing(true);
    try {
      await pushCrmIfCloudEmpty();
      const pulled = await pullCrmFromCloud();
      if (pulled) {
        window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
      }
      setSyncFailed(!pulled);
      return pulled;
    } catch {
      setSyncFailed(true);
      return false;
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

  return { syncing, syncFailed, resync };
}
