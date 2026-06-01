"use client";

import { useCallback, useEffect, useState } from "react";
import { CRM_CLOUD_PUSH_EVENT, DB_SAVED_EVENT } from "@/lib/db-events";
import {
  fetchCloudConfigured,
  pullCrmFromCloud,
  pushCrmIfCloudEmpty,
  scheduleCrmCloudPush,
} from "@/lib/cloud-crm-db";
import type { Database } from "@/lib/store";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

/** Sync full CRM database with Supabase for admin (all devices) */
export function useCloudCrmSync(enabled = true): {
  syncing: boolean;
  syncFailed: boolean;
  cloudConfigured: boolean;
  pushFailed: boolean;
  resync: () => Promise<boolean>;
} {
  const [syncing, setSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [cloudConfigured, setCloudConfigured] = useState(true);
  const [pushFailed, setPushFailed] = useState(false);

  const resync = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false;
    setSyncing(true);
    try {
      const configured = await fetchCloudConfigured();
      setCloudConfigured(configured);
      if (!configured) {
        setSyncFailed(true);
        return false;
      }
      await pushCrmIfCloudEmpty();
      const result = await pullCrmFromCloud({ force: true });
      const ok = result !== "error" && result !== "skipped";
      setSyncFailed(!ok);
      if (ok) setPushFailed(false);
      return ok;
    } catch {
      setSyncFailed(true);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    void fetchCloudConfigured().then(setCloudConfigured);
    void resync();

    const onSaved = (e: Event) => {
      const detail = (e as CustomEvent<Database>).detail;
      if (detail) scheduleCrmCloudPush(detail);
    };
    const onPush = (e: Event) => {
      const detail = (e as CustomEvent<{ ok?: boolean }>).detail;
      if (detail?.ok === false) setPushFailed(true);
      else if (detail?.ok === true) setPushFailed(false);
    };

    window.addEventListener(DB_SAVED_EVENT, onSaved);
    window.addEventListener(CRM_CLOUD_PUSH_EVENT, onPush);
    const onFocus = () => void resync();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener(DB_SAVED_EVENT, onSaved);
      window.removeEventListener(CRM_CLOUD_PUSH_EVENT, onPush);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, resync]);

  useVisibleInterval(() => void resync(), 20_000, enabled);

  return {
    syncing,
    syncFailed: syncFailed || !cloudConfigured || pushFailed,
    cloudConfigured,
    pushFailed,
    resync,
  };
}
