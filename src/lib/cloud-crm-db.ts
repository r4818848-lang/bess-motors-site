import { isCrmDraftLockActive } from "@/lib/crm-draft-lock";
import { DB_CHANGED_EVENT, notifyCrmCloudPush } from "@/lib/db-events";
import { syncAppointmentsFromCloud } from "@/lib/cloud-appointments";
import { mergeCloudIntoLocal } from "@/lib/crm-db-merge";
import { staffCrmFetch } from "@/lib/crm-staff-fetch";
import { loadDb, mergeStoredDb, saveDb, type Database } from "@/lib/store";

const TOKEN_KEY = "bess-jwt";
const SESSION_ROLE_KEY = "bess-session-role";
const CLOUD_SYNCED_AT_KEY = "bess-crm-cloud-synced-at";

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushChain: Promise<boolean> = Promise.resolve(true);

export type PushCrmOptions = {
  /** After delete — do not pull (old cloud would resurrect rows). */
  skipPull?: boolean;
};

function isStaffCloudWriter(): boolean {
  if (typeof window === "undefined") return false;
  const role = localStorage.getItem(SESSION_ROLE_KEY);
  return role === "admin" || role === "mechanic";
}

function isCrmCloudWriter(): boolean {
  return isStaffCloudWriter();
}

function dbForCloud(db: Database): Database {
  return { ...db, currentUserId: null };
}

export type PullCrmResult = "merged" | "unchanged" | "skipped" | "error";

/** Cancel debounced push so a delete is not overwritten by an older snapshot. */
export function cancelScheduledCrmCloudPush(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}

/** After delete — queue push without pull (prevents resurrecting rows). */
export async function pushCrmDelete(db: Database): Promise<boolean> {
  cancelScheduledCrmCloudPush();
  return pushCrmToCloud(db, { skipPull: true });
}

/** After add/edit — immediate serialized push (optional pull). */
export async function pushCrmSave(
  db?: Database,
  options?: PushCrmOptions
): Promise<boolean> {
  cancelScheduledCrmCloudPush();
  return pushCrmToCloud(db ?? loadDb(), { skipPull: true, ...options });
}

/** Persist locally then push; on failure reload cloud snapshot so UI matches server. */
export async function saveDbAndPushCrm(
  db: Database,
  options?: PushCrmOptions
): Promise<boolean> {
  saveDb(db, { skipCloudPush: true });
  const ok = await pushCrmSave(db, options);
  if (!ok) await revertCrmFromCloudAfterFailedPush();
  return ok;
}

/** After delete — persist, push without pull; revert local if push fails. */
export async function saveDbAndPushCrmDelete(db: Database): Promise<boolean> {
  saveDb(db, { skipCloudPush: true });
  const ok = await pushCrmDelete(db);
  if (!ok) await revertCrmFromCloudAfterFailedPush();
  return ok;
}

async function revertCrmFromCloudAfterFailedPush(): Promise<void> {
  if (isCrmDraftLockActive()) return;
  await pullCrmFromCloud({ force: true });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
  }
}

export async function pullCrmFromCloud(options?: { force?: boolean }): Promise<PullCrmResult> {
  if (typeof window === "undefined" || !isCrmCloudWriter()) return "skipped";
  if (isCrmDraftLockActive()) return "skipped";

  try {
    const res = await staffCrmFetch("/api/crm-db", { cache: "no-store" });
    if (!res || !res.ok) return "error";

    const data = (await res.json()) as {
      cloud?: boolean;
      db?: Database | null;
      updatedAt?: string | null;
      error?: string;
    };
    if (data.cloud === false || data.error === "cloud_disabled") return "error";

    const local = loadDb();
    const lastSynced = localStorage.getItem(CLOUD_SYNCED_AT_KEY) ?? "";

    if (!data.db || !data.updatedAt) {
      await syncAppointmentsFromCloud();
      return "unchanged";
    }

    const remote = mergeStoredDb({
      ...data.db,
      currentUserId: local.currentUserId,
    });

    const localIds = new Set(local.workOrders.map((o) => o.id));
    const remoteIds = new Set(remote.workOrders.map((o) => o.id));
    const hasNewRemoteOrders = [...remoteIds].some((id) => !localIds.has(id));
    const timestampChanged = data.updatedAt !== lastSynced;

    if (!options?.force && !timestampChanged && !hasNewRemoteOrders) {
      await syncAppointmentsFromCloud();
      return "unchanged";
    }

    const merged = mergeCloudIntoLocal(local, remote, {
      lastCloudSyncedAt: lastSynced || undefined,
    });
    saveDb(merged, { skipCloudPush: true });
    localStorage.setItem(CLOUD_SYNCED_AT_KEY, data.updatedAt);
    await syncAppointmentsFromCloud();
    window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
    return "merged";
  } catch {
    return "error";
  }
}

export async function pushCrmToCloud(
  db?: Database,
  options?: PushCrmOptions
): Promise<boolean> {
  if (typeof window === "undefined" || !isCrmCloudWriter()) return false;
  if (!localStorage.getItem(TOKEN_KEY)) return false;

  const payload = dbForCloud(db ?? loadDb());

  const run = async (): Promise<boolean> => {
    try {
      const res = await staffCrmFetch("/api/crm-db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res || !res.ok) {
        console.warn(
          "[cloud] CRM push failed",
          res?.status ?? "network",
          res ? await res.text() : ""
        );
        notifyCrmCloudPush(false);
        return false;
      }
      const data = (await res.json()) as { ok?: boolean; updatedAt?: string; error?: string };
      const ok = data.ok === true;
      if (data.updatedAt) {
        localStorage.setItem(CLOUD_SYNCED_AT_KEY, data.updatedAt);
      }
      notifyCrmCloudPush(ok, data.error);
      if (ok && !options?.skipPull && !isCrmDraftLockActive()) {
        await pullCrmFromCloud({ force: true });
      }
      return ok;
    } catch {
      notifyCrmCloudPush(false);
      return false;
    }
  };

  const result = pushChain.then(run);
  pushChain = result.catch(() => false);
  return result;
}

export function scheduleCrmCloudPush(_db?: Database): void {
  if (!isCrmCloudWriter()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushCrmSave(loadDb());
  }, 800);
}

export async function fetchCloudConfigured(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/health", { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { cloud?: boolean };
    return data.cloud === true;
  } catch {
    return false;
  }
}

/** Upload local CRM if cloud is empty (first admin device) */
export async function pushCrmIfCloudEmpty(): Promise<void> {
  if (!isCrmCloudWriter()) return;

  try {
    const res = await staffCrmFetch("/api/crm-db", { cache: "no-store" });
    if (!res || !res.ok) return;
    const data = (await res.json()) as { db?: Database | null };
    if (data.db) return;
    await pushCrmSave(loadDb());
  } catch {
    /* ignore */
  }
}
