import { DB_CHANGED_EVENT } from "@/lib/db-events";
import { syncAppointmentsFromCloud } from "@/lib/cloud-appointments";
import { loadDb, mergeStoredDb, saveDb, type Database } from "@/lib/store";

const TOKEN_KEY = "bess-jwt";
const SESSION_ROLE_KEY = "bess-session-role";
const CLOUD_SYNCED_AT_KEY = "bess-crm-cloud-synced-at";

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushInFlight = false;

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

export async function pullCrmFromCloud(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || !isCrmCloudWriter()) return false;

  try {
    const res = await fetch("/api/crm-db", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return false;

    const data = (await res.json()) as {
      cloud?: boolean;
      db?: Database | null;
      updatedAt?: string | null;
    };
    if (!data.cloud || !data.db || !data.updatedAt) return false;

    const local = loadDb();
    const lastSynced = localStorage.getItem(CLOUD_SYNCED_AT_KEY) ?? "";

    if (data.updatedAt <= lastSynced) {
      await syncAppointmentsFromCloud();
      return false;
    }

    const merged = mergeStoredDb({
      ...data.db,
      currentUserId: local.currentUserId,
    });
    saveDb(merged, { skipCloudPush: true });
    localStorage.setItem(CLOUD_SYNCED_AT_KEY, data.updatedAt);
    await syncAppointmentsFromCloud();
    window.dispatchEvent(new CustomEvent(DB_CHANGED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export async function pushCrmToCloud(db?: Database): Promise<boolean> {
  if (typeof window === "undefined" || !isCrmCloudWriter()) return false;
  if (pushInFlight) return false;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;

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
      return false;
    }
    const data = (await res.json()) as { ok?: boolean; updatedAt?: string };
    if (data.updatedAt) {
      localStorage.setItem(CLOUD_SYNCED_AT_KEY, data.updatedAt);
    }
    return data.ok === true;
  } catch {
    return false;
  } finally {
    pushInFlight = false;
  }
}

export function scheduleCrmCloudPush(db: Database): void {
  if (!isCrmCloudWriter()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushCrmToCloud(db);
  }, 2500);
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
