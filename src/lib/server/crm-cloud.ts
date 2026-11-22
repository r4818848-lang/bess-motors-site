import type { Database } from "@/lib/store";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/server/supabase-config";

export { isSupabaseConfigured };

const ROW_ID = "main";

type CrmCloudTestIo = {
  get(): Promise<CrmCloudSnapshot | null>;
  patch(doc: Database, expectedUpdatedAt: string): Promise<"ok" | "stale" | "error">;
};

let crmCloudTestIo: CrmCloudTestIo | null = null;

/** Test double for the CRM compare-and-swap. Refused on Vercel so production keeps Supabase. */
export function installCrmCloudForTests(io: CrmCloudTestIo | null): void {
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") {
    throw new Error("crm_test_transport_refused");
  }
  crmCloudTestIo = io;
}

export type CrmCloudSnapshot = {
  doc: Database;
  updatedAt: string;
};

export async function cloudGetCrmStore(): Promise<CrmCloudSnapshot | null> {
  if (crmCloudTestIo) return crmCloudTestIo.get();
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

/** Save the ERP snapshot and project changed visits into appointments in one transaction. */
export async function commitCrmSnapshot(doc: Database, expectedVersion: string | null): Promise<{ok:true;updatedAt:string} | {ok:false;error:"conflict"|"cloud_write"}> {
  const cfg = getSupabaseConfig();
  if (!cfg) return {ok:false,error:"cloud_write"};
  try {
    const response = await fetch(`${cfg.url}/rest/v1/rpc/commit_crm_snapshot`, {
      method:"POST", headers:{apikey:cfg.key, Authorization:`Bearer ${cfg.key}`, "Content-Type":"application/json"},
      body: JSON.stringify({expected_version:expectedVersion, next_doc:doc}),
    });
    if (!response.ok) return {ok:false,error:"cloud_write"};
    const stamp:unknown = await response.json();
    return typeof stamp === "string" ? {ok:true,updatedAt:stamp} : {ok:false,error:"conflict"};
  } catch { return {ok:false,error:"cloud_write"}; }
}

export async function patchCrmIfUnchanged(doc: Database, expectedUpdatedAt: string): Promise<"ok" | "stale" | "error"> {
  if (crmCloudTestIo) return crmCloudTestIo.patch(doc, expectedUpdatedAt);
  if (!expectedUpdatedAt) return "error";
  const result=await commitCrmSnapshot(doc,expectedUpdatedAt);
  return result.ok ? "ok" : result.error === "conflict" ? "stale" : "error";
}
