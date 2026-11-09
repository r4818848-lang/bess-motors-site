/**
 * Connection plan for the existing CRM database.
 *
 * The future write pilot uses the Supabase Postgres that already holds crm_store and appointments.
 * This release does not open that connection. supabase.co, the SUPABASE_URL host, and Vercel
 * stay refused. SCHEDULER_PRODUCTION_DB_PERMIT is ignored until a later release is allowed
 * to read it. Local tests use only bess_crm_copy_test.
 */
export type CrmConnectionPlan =
  | { mode: "legacy"; reason: "unconfigured" }
  | { mode: "transactional"; target: "local-copy"; url: string }
  | { mode: "refused"; reason: "production_database" | "vercel"; status: 503 };

export function productionCrmUrl(): null {
  return null;
}

export function planCrmConnection(localCopyUrl: string | null): CrmConnectionPlan {
  if (process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview") {
    return { mode: "refused", reason: "vercel", status: 503 };
  }
  const supplied = process.env.SCHEDULER_CRM_URL?.trim() || process.env.SCHEDULER_CRM_COPY_URL?.trim() || "";
  if (/supabase\.co/i.test(supplied)) return { mode: "refused", reason: "production_database", status: 503 };
  const supabase = process.env.SUPABASE_URL;
  if (supabase && supplied) {
    try {
      if (supplied.includes(new URL(supabase).host)) return { mode: "refused", reason: "production_database", status: 503 };
    } catch {
      return { mode: "refused", reason: "production_database", status: 503 };
    }
  }
  if (!localCopyUrl) return { mode: "legacy", reason: "unconfigured" };
  return { mode: "transactional", target: "local-copy", url: localCopyUrl };
}
