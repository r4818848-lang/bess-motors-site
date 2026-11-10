import { getSupabaseConfig } from "@/lib/server/supabase-config";
import type { CrmAppointmentDoc } from "@/lib/smart-scheduler/crm-reconcile";

const PAGE = 500;
const CAP = 20_000;

/** Reads every appointments row. A short or failed page is not an empty calendar. */
export async function readCloudAppointmentDocs(): Promise<{ ok: true; docs: CrmAppointmentDoc[] } | { ok: false }> {
  const cfg = getSupabaseConfig();
  if (!cfg) return { ok: false };
  const docs: CrmAppointmentDoc[] = [];
  try {
    for (let offset = 0; offset < CAP; offset += PAGE) {
      const res = await fetch(`${cfg.url}/rest/v1/appointments?select=doc&order=id.asc&limit=${PAGE}&offset=${offset}`, {
        headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
        cache: "no-store",
      });
      if (!res.ok) return { ok: false };
      const rows = (await res.json()) as { doc?: CrmAppointmentDoc }[];
      if (!Array.isArray(rows)) return { ok: false };
      for (const row of rows) {
        if (row?.doc) docs.push(row.doc);
      }
      if (rows.length < PAGE) return { ok: true, docs };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
