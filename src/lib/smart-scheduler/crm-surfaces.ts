import { getSupabaseConfig } from "@/lib/server/supabase-config";
import type { CrmAppointmentDoc } from "@/lib/smart-scheduler/crm-reconcile";

/** Reads the existing appointments table. A failed read is not an empty calendar. */
export async function readCloudAppointmentDocs(): Promise<{ ok: true; docs: CrmAppointmentDoc[] } | { ok: false }> {
  const cfg = getSupabaseConfig();
  if (!cfg) return { ok: false };
  try {
    const res = await fetch(`${cfg.url}/rest/v1/appointments?select=doc&limit=1000`, {
      headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
      cache: "no-store",
    });
    if (!res.ok) return { ok: false };
    const rows = (await res.json()) as { doc?: CrmAppointmentDoc }[];
    if (!Array.isArray(rows) || rows.length >= 1000) return { ok: false };
    return { ok: true, docs: rows.map((row) => row.doc).filter((doc): doc is CrmAppointmentDoc => Boolean(doc)) };
  } catch {
    return { ok: false };
  }
}
