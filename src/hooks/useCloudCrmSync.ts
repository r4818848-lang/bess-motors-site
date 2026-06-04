"use client";

import { useCallback, useEffect, useState } from "react";
import { CRM_CLOUD_PUSH_EVENT, DB_CHANGED_EVENT, DB_SAVED_EVENT } from "@/lib/db-events";
import { isCrmDraftLockActive } from "@/lib/crm-draft-lock";
import {
  fetchCloudConfigured,
  pullCrmFromCloud,
  pushCrmIfCloudEmpty,
  pushCrmSave,
  scheduleCrmCloudPush,
} from "@/lib/cloud-crm-db";
import { loadDb, type Database } from "@/lib/store";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

export type CrmResyncOptions = {
  /** Default true — manual «Synchronizuj»; auto timers never pull */
  pull?: boolean;
};

/** Sync full CRM database with Supabase for admin (all devices) */
export function useCloudCrmSync(enabled = true): {
  syncing: boolean;
  syncFailed: boolean;
  cloudConfigured: boolean;
  pushFailed: boolean;
  resync: (options?: CrmResyncOptions) => Promise<boolean>;
} {
  const [syncing, setSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [cloudConfigured, setCloudConfigured] = useState(true);
  const [pushFailed, setPushFailed] = useState(false);

  const resync = useCallback(
    async (options?: CrmResyncOptions): Promise<boolean> => {
      if (!enabled) return false;
      if (isCrmDraftLockActive()) {
        return false;
      }

      setSyncing(true);
      try {
        const configured = await fetchCloudConfigured();
        setCloudConfigured(configured);
        if (!configured) {
          setSyncFailed(true);
          return false;
        }

        await pushCrmIfCloudEmpty();

        const shouldPull = options?.pull === true;
        if (shouldPull) {
          const pullResult = await pullCrmFromCloud({ force: true });
          if (pullResult === "error") {
            setSyncFailed(true);
            return false;
          }
        }

        const pushed = await pushCrmSave(loadDb());
        if (!pushed) {
          setPushFailed(true);
          return false;
        }

        setPushFailed(false);
        setSyncFailed(false);
        return true;
      } catch {
        setSyncFailed(true);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    void fetchCloudConfigured().then(setCloudConfigured);
    void (async () => {
      await pushCrmIfCloudEmpty();
      if (!isCrmDraftLockActive()) {
        await pullCrmFromCloud();
      }
    })();

    const onSaved = (e: Event) => {
      if (isCrmDraftLockActive()) return;
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

    return () => {
      window.removeEventListener(DB_SAVED_EVENT, onSaved);
      window.removeEventListener(CRM_CLOUD_PUSH_EVENT, onPush);
    };
  }, [enabled]);

  /** Push local changes periodically; pull only when tab becomes visible (avoids overwriting open forms). */
  useVisibleInterval(() => {
    if (!enabled || isCrmDraftLockActive()) return;
    void pushCrmSave(loadDb());
  }, 60_000, enabled);

  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible" || isCrmDraftLockActive()) return;
      void pullCrmFromCloud().then((r) => {
        if (r === "merged" && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
        }
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled]);

  return {
    syncing,
    syncFailed: syncFailed || !cloudConfigured || pushFailed,
    cloudConfigured,
    pushFailed,
    resync,
  };
}
