"use client";

import { useCallback, useEffect, useState } from "react";
import { CRM_CLOUD_PUSH_EVENT, DB_CHANGED_EVENT, DB_SAVED_EVENT } from "@/lib/db-events";
import { isCrmDraftLockActive } from "@/lib/crm-draft-lock";
import {
  fetchCloudConfigured,
  getCloudSyncedAt,
  getLastCrmSyncFailure,
  pullCrmFromCloud,
  pushCrmIfCloudEmpty,
  pushCrmSave,
  scheduleCrmCloudPush,
} from "@/lib/cloud-crm-db";
import type { StaffCrmFetchFailure } from "@/lib/crm-staff-fetch";
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
  lastSyncedAt: string | null;
  syncFailureReason: StaffCrmFetchFailure | "draft_locked" | "cloud_off" | null;
  resync: (options?: CrmResyncOptions) => Promise<boolean>;
} {
  const [syncing, setSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [cloudConfigured, setCloudConfigured] = useState(true);
  const [pushFailed, setPushFailed] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncFailureReason, setSyncFailureReason] = useState<
    StaffCrmFetchFailure | "draft_locked" | "cloud_off" | null
  >(null);

  const resync = useCallback(
    async (options?: CrmResyncOptions): Promise<boolean> => {
      if (!enabled) return false;
      if (isCrmDraftLockActive()) {
        setSyncFailureReason("draft_locked");
        return false;
      }

      setSyncing(true);
      try {
        const configured = await fetchCloudConfigured();
        setCloudConfigured(configured);
        if (!configured) {
          setSyncFailed(true);
          setSyncFailureReason("cloud_off");
          return false;
        }

        await pushCrmIfCloudEmpty();

        const shouldPull = options?.pull === true;
        if (shouldPull) {
          const pullResult = await pullCrmFromCloud({ force: true });
          if (pullResult === "error") {
            setSyncFailed(true);
            setSyncFailureReason(getLastCrmSyncFailure() ?? "network");
            return false;
          }
        }

        const pushed = await pushCrmSave(loadDb());
        if (!pushed) {
          setPushFailed(true);
          setSyncFailureReason(getLastCrmSyncFailure() ?? "network");
          return false;
        }

        setPushFailed(false);
        setSyncFailed(false);
        setSyncFailureReason(null);
        setLastSyncedAt(getCloudSyncedAt());
        return true;
      } catch {
        setSyncFailed(true);
        setSyncFailureReason("network");
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
      if (detail?.ok === false) {
        setPushFailed(true);
        setSyncFailureReason(getLastCrmSyncFailure() ?? "network");
      } else if (detail?.ok === true) {
        setPushFailed(false);
        setSyncFailureReason(null);
        setLastSyncedAt(getCloudSyncedAt());
      }
    };
    const refreshSyncedAt = () => setLastSyncedAt(getCloudSyncedAt());

    refreshSyncedAt();
    window.addEventListener(DB_SAVED_EVENT, onSaved);
    window.addEventListener(CRM_CLOUD_PUSH_EVENT, onPush);
    window.addEventListener(DB_CHANGED_EVENT, refreshSyncedAt);

    return () => {
      window.removeEventListener(DB_SAVED_EVENT, onSaved);
      window.removeEventListener(CRM_CLOUD_PUSH_EVENT, onPush);
      window.removeEventListener(DB_CHANGED_EVENT, refreshSyncedAt);
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
    lastSyncedAt,
    syncFailureReason,
    resync,
  };
}
