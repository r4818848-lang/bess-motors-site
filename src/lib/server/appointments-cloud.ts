import type { Appointment } from "@/lib/store";
import { normalizePhone } from "@/lib/server/normalize-phone";

export type CloudUpsertResult =
  | { ok: true }
  | { ok: false; status?: number; error: string };

/** Remove arrows, BOM, cyrillic spaces from copy-paste in Vercel env */
function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function validateServiceRoleKey(key: string): string | null {
  const isLegacyJwt = key.startsWith("eyJ");
  const isNewSecret = key.startsWith("sb_secret_");
  if (!isLegacyJwt && !isNewSecret) {
    return "use_supabase_secret_key_not_publishable_sb_publishable";
  }
  if (key.startsWith("sb_publishable_")) {
    return "use_secret_key_not_publishable";
  }
  if (!/^[A-Za-z0-9._-]+$/.test(key)) {
    return "service_role_key_has_invalid_characters";
  }
  if (isLegacyJwt && key.length < 80) {
    return "service_role_key_too_short_recopy_from_supabase";
  }
  if (isNewSecret && key.length < 24) {
    return "secret_key_too_short_recopy_from_supabase";
  }
  return null;
}

function supabaseConfig(): { url: string; key: string } | null {
  const url = cleanEnvValue(process.env.SUPABASE_URL);
  const key = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) return null;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)) return null;
  if (validateServiceRoleKey(key)) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function isCloudAppointmentsEnabled(): boolean {
  return supabaseConfig() !== null;
}

export async function cloudUpsertAppointment(apt: Appointment): Promise<CloudUpsertResult> {
  const url = cleanEnvValue(process.env.SUPABASE_URL);
  const key = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const keyError = key ? validateServiceRoleKey(key) : "missing_service_role_key";
  if (!url || !key || keyError) {
    return { ok: false, error: keyError ?? "cloud_misconfigured" };
  }
  const cfg = { url: url.replace(/\/$/, ""), key };

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
  const cfg = supabaseConfig();
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
  const cfg = supabaseConfig();
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
