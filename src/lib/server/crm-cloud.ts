import type { Database } from "@/lib/store";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/server/supabase-config";

export { isSupabaseConfigured };

const ROW_ID = "main";

export type CrmCloudSnapshot = {
  doc: Database;
  updatedAt: string;
};

export async function cloudGetCrmStore(): Promise<CrmCloudSnapshot | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(
      `${cfg.url}/rest/v1/crm_store?id=eq.${ROW_ID}&select=doc,updated_at`,
      {
        headers: {
          apikey: cfg.key,
          Authorization: `Bearer ${cfg.key}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { doc: Database; updated_at: string }[];
    const row = rows[0];
    if (!row?.doc) return null;
    return { doc: row.doc, updatedAt: row.updated_at };
  } catch {
    return null;
  }
}

export async function cloudPutCrmStore(
  doc: Database,
  options?: { skipNotify?: boolean }
): Promise<{ ok: boolean; updatedAt?: string; error?: string }> {
  const cfg = getSupabaseConfig();
  if (!cfg) return { ok: false, error: "cloud_disabled" };

  const before =
    options?.skipNotify === true ? null : await cloudGetCrmStore();

  const updatedAt = new Date().toISOString();
  const row = { id: ROW_ID, doc, updated_at: updatedAt };

  try {
    const res = await fetch(`${cfg.url}/rest/v1/crm_store`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const text = (await res.text()).slice(0, 500);
      return { ok: false, error: text || `http_${res.status}` };
    }

    if (before?.doc && options?.skipNotify !== true) {
      const { notifyAfterCrmCloudSave } = await import("./crm-cloud-notify");
      void notifyAfterCrmCloudSave(before.doc, doc);
    }

    return { ok: true, updatedAt };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
