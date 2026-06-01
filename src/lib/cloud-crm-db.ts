import { DB_CHANGED_EVENT, notifyCrmCloudPush } from "@/lib/db-events";
import { syncAppointmentsFromCloud } from "@/lib/cloud-appointments";
import { mergeCloudIntoLocal } from "@/lib/crm-db-merge";
import { loadDb, mergeStoredDb, saveDb, type Database } from "@/lib/store";

const TOKEN_KEY = "bess-jwt";
const SESSION_ROLE_KEY = "bess-session-role";
const CLOUD_SYNCED_AT_KEY = "bess-crm-cloud-synced-at";

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushInFlight = false;
let pushQueued: Database | null = null;

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

export async function pullCrmFromCloud(options?: { force?: boolean }): Promise<PullCrmResult> {
  if (typeof window === "undefined") return "skipped";
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || !isCrmCloudWriter()) return "skipped";

  try {
    const res = await fetch("/api/crm-db", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return "error";

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

    const merged = mergeCloudIntoLocal(local, remote);
    saveDb(merged, { skipCloudPush: true });
    localStorage.setItem(CLOUD_SYNCED_AT_KEY, data.updatedAt);
    await syncAppointmentsFromCloud();
    window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
    return "merged";
  } catch {
    return "error";
  }
}

export async function pushCrmToCloud(db?: Database): Promise<boolean> {
  if (typeof window === "undefined" || !isCrmCloudWriter()) return false;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;

  if (pushInFlight) {
    pushQueued = dbForCloud(db ?? loadDb());
    return false;
  }

  const payload = dbForCloud(db ?? loadDb());

  pushInFlight = true;
  try {
    const res = await fetch("/api/crm-db", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("[cloud] CRM push failed", res.status, await res.text());
      notifyCrmCloudPush(false);
      return false;
    }
    const data = (await res.json()) as { ok?: boolean; updatedAt?: string; error?: string };
    const ok = data.ok === true;
    if (data.updatedAt) {
      localStorage.setItem(CLOUD_SYNCED_AT_KEY, data.updatedAt);
    }
    notifyCrmCloudPush(ok, data.error);
    if (ok) {
      await pullCrmFromCloud({ force: true });
    }
    return ok;
  } catch {
    notifyCrmCloudPush(false);
    return false;
  } finally {
    pushInFlight = false;
    if (pushQueued) {
      const next = pushQueued;
      pushQueued = null;
      void pushCrmToCloud(next);
    }
  }
}

export function scheduleCrmCloudPush(db: Database): void {
  if (!isCrmCloudWriter()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushCrmToCloud(db);
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
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  try {
    const res = await fetch("/api/crm-db", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { db?: Database | null };
    if (data.db) return;
    await pushCrmToCloud(loadDb());
  } catch {
    /* ignore */
  }
}
