import type { Appointment } from "@/lib/store";
import { normalizePhone } from "@/lib/server/normalize-phone";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/server/supabase-config";

export type CloudUpsertResult =
  | { ok: true }
  | { ok: false; status?: number; error: string };

export function isCloudAppointmentsEnabled(): boolean {
  return isSupabaseConfigured();
}

export async function cloudUpsertAppointment(apt: Appointment): Promise<CloudUpsertResult> {
  const cfg = getSupabaseConfig();
  if (!cfg) {
    return { ok: false, error: "cloud_misconfigured" };
  }

  const phone = normalizePhone(apt.clientPhone ?? "") || "";
  const row = {
    id: apt.id,
    client_phone: phone,
    user_id: apt.userId,
    doc: apt,
    created_at: apt.createdAt || new Date().toISOString(),
  };

  try {
    const res = await fetch(`${cfg.url}/rest/v1/appointments`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=merge-duplicates",
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const text = (await res.text()).slice(0, 500);
      return { ok: false, status: res.status, error: text || `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.includes("Invalid URL") ? "invalid_supabase_url" : msg };
  }
}

export async function cloudListAppointmentsForAdmin(): Promise<Appointment[]> {
  const cfg = getSupabaseConfig();
  if (!cfg) return [];

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/appointments?select=doc&order=created_at.desc&limit=500`,
      {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return [];
    const rows = (await res.json()) as { doc: Appointment }[];
    return rows.map((r) => r.doc).filter(Boolean);
  } catch {
    return [];
  }
}

export async function cloudListAppointmentsByPhone(
  phone: string
): Promise<Appointment[]> {
  const cfg = getSupabaseConfig();
  const normalized = normalizePhone(phone);
  if (!cfg || !normalized) return [];

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/appointments?select=doc&client_phone=eq.${encodeURIComponent(normalized)}&order=created_at.desc&limit=100`,
      {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return [];
    const rows = (await res.json()) as { doc: Appointment }[];
    return rows.map((r) => r.doc).filter(Boolean);
  } catch {
    return [];
  }
}
