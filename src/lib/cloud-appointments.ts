import type { Appointment } from "./store";
import { isKnownTestAppointment, loadDb, saveDb } from "./store";

const TOKEN_KEY = "bess-jwt";

export function mergeAppointmentsIntoDb(cloud: Appointment[]): boolean {
  if (!cloud.length) return false;
  const db = loadDb();
  let changed = false;
  for (const apt of cloud) {
    if (isKnownTestAppointment(db, apt)) continue;
    const idx = db.appointments.findIndex((a) => a.id === apt.id);
    if (idx < 0) {
      db.appointments.push(apt);
      changed = true;
    } else {
      db.appointments[idx] = { ...db.appointments[idx], ...apt };
      changed = true;
    }
  }
  if (changed) saveDb(db, { skipCloudPush: true });
  return changed;
}

/** Pull bookings from server DB (phone + PC see the same data) */
export async function syncAppointmentsFromCloud(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;

  try {
    const res = await fetch("/api/appointments", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      appointments?: Appointment[];
      cloud?: boolean;
    };
    if (!data.cloud) return false;
    if (!data.appointments?.length) return true;
    return mergeAppointmentsIntoDb(data.appointments);
  } catch {
    return false;
  }
}

export async function deleteAppointmentFromCloud(id: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;

  try {
    const res = await fetch(`/api/appointments?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pushAppointmentToCloud(apt: Appointment): Promise<boolean> {
  try {
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apt),
    });
    if (!res.ok) {
      console.warn("[cloud] appointment push failed", res.status, await res.text());
      return false;
    }
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}
