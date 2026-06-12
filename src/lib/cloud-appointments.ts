import { clientAuthenticatedFetch } from "@/lib/client-authenticated-fetch";
import type { Appointment } from "./store";
import { isKnownTestAppointment, loadDb, saveDb } from "./store";

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

  try {
    const res = await clientAuthenticatedFetch("/api/appointments", {
      cache: "no-store",
    });
    if (!res?.ok) return false;
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

  try {
    const res = await clientAuthenticatedFetch(
      `/api/appointments?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    return !!res?.ok;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type PushAppointmentResult = {
  ok: boolean;
  slotTaken?: boolean;
  error?: string;
};

export async function pushAppointmentToCloud(
  apt: Appointment,
  options?: { attempts?: number }
): Promise<PushAppointmentResult> {
  const attempts = options?.attempts ?? 3;

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apt),
      });

      if (res.status === 409) {
        return { ok: false, slotTaken: true, error: "slot_taken" };
      }

      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean };
        if (data.ok === true) return { ok: true };
      } else {
        const text = await res.text();
        console.warn("[cloud] appointment push failed", res.status, text);
        if (res.status === 400 || res.status === 502) {
          return { ok: false, error: text.slice(0, 200) };
        }
      }
    } catch (e) {
      console.warn("[cloud] appointment push network error", e);
    }

    if (i < attempts - 1) await sleep(400 * (i + 1));
  }

  return { ok: false, error: "network" };
}
