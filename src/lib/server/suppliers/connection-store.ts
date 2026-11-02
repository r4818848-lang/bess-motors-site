import { encryptSecret, decryptSecret, redactForLog } from "@/lib/server/secrets-crypto";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/server/supabase-config";
import type {
  SupplierConnectionPublic,
  SupplierConnectionStatus,
  SupplierCredentialsInput,
  SupplierId,
} from "@/lib/suppliers/types";
import { SUPPLIER_DISPLAY } from "@/lib/suppliers/types";
import { getAdapter } from "@/lib/suppliers/registry";

const TABLE = "supplier_connections";

export type StoredSupplierConnection = {
  supplierId: SupplierId;
  status: SupplierConnectionStatus;
  loginEncrypted?: string;
  passwordEncrypted?: string;
  extraEncrypted?: string;
  sessionMetaEncrypted?: string;
  lastSuccessAt?: string;
  lastCheckedAt?: string;
  lastError?: string;
  environment?: "sandbox" | "production";
  updatedAt: string;
};

function loginHintFrom(login: string): string {
  const t = login.trim();
  if (t.length <= 3) return "***";
  return `${t.slice(0, 2)}***${t.slice(-1)}`;
}

async function restFetch(
  path: string,
  init: RequestInit
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const cfg = getSupabaseConfig();
  if (!cfg) return { ok: false, status: 503, json: null, text: "cloud_disabled" };
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text };
}

/** Fallback: store encrypted docs in crm_store under id supplier:<id> when table missing */
async function putCrmStoreFallback(row: StoredSupplierConnection): Promise<boolean> {
  const cfg = getSupabaseConfig();
  if (!cfg) return false;
  const id = `supplier:${row.supplierId}`;
  const res = await fetch(`${cfg.url}/rest/v1/crm_store`, {
    method: "POST",
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id,
      doc: row,
      updated_at: row.updatedAt,
    }),
  });
  return res.ok;
}

async function getCrmStoreFallback(supplierId: SupplierId): Promise<StoredSupplierConnection | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  const id = encodeURIComponent(`supplier:${supplierId}`);
  const res = await fetch(
    `${cfg.url}/rest/v1/crm_store?id=eq.${id}&select=doc`,
    {
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as { doc: StoredSupplierConnection }[];
  return rows[0]?.doc ?? null;
}

export async function listStoredConnections(): Promise<StoredSupplierConnection[]> {
  if (!isSupabaseConfigured()) return [];
  const r = await restFetch(`${TABLE}?select=*`, { method: "GET" });
  if (r.ok && Array.isArray(r.json)) {
    return r.json as StoredSupplierConnection[];
  }
  // Fallback scan known ids
  const ids: SupplierId[] = ["inter_cars", "auto_partner", "hart", "motowarsztat"];
  const out: StoredSupplierConnection[] = [];
  for (const id of ids) {
    const row = await getCrmStoreFallback(id);
    if (row) out.push(row);
  }
  return out;
}

export async function getStoredConnection(
  supplierId: SupplierId
): Promise<StoredSupplierConnection | null> {
  if (!isSupabaseConfigured()) return null;
  const r = await restFetch(
    `${TABLE}?supplier_id=eq.${supplierId}&select=*`,
    { method: "GET" }
  );
  if (r.ok && Array.isArray(r.json) && r.json[0]) {
    const row = r.json[0] as Record<string, unknown>;
    return normalizeRow(row);
  }
  return getCrmStoreFallback(supplierId);
}

function normalizeRow(row: Record<string, unknown>): StoredSupplierConnection {
  return {
    supplierId: (row.supplier_id || row.supplierId) as SupplierId,
    status: (row.status as SupplierConnectionStatus) || "not_configured",
    loginEncrypted: (row.login_encrypted || row.loginEncrypted) as string | undefined,
    passwordEncrypted: (row.password_encrypted || row.passwordEncrypted) as
      | string
      | undefined,
    extraEncrypted: (row.extra_encrypted || row.extraEncrypted) as string | undefined,
    sessionMetaEncrypted: (row.session_meta_encrypted || row.sessionMetaEncrypted) as
      | string
      | undefined,
    lastSuccessAt: (row.last_success_at || row.lastSuccessAt) as string | undefined,
    lastCheckedAt: (row.last_checked_at || row.lastCheckedAt) as string | undefined,
    lastError: (row.last_error || row.lastError) as string | undefined,
    environment: (row.environment as "sandbox" | "production") || undefined,
    updatedAt: (row.updated_at || row.updatedAt || new Date().toISOString()) as string,
  };
}

export async function upsertStoredConnection(row: StoredSupplierConnection): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const dbRow = {
    supplier_id: row.supplierId,
    status: row.status,
    login_encrypted: row.loginEncrypted ?? null,
    password_encrypted: row.passwordEncrypted ?? null,
    extra_encrypted: row.extraEncrypted ?? null,
    session_meta_encrypted: row.sessionMetaEncrypted ?? null,
    last_success_at: row.lastSuccessAt ?? null,
    last_checked_at: row.lastCheckedAt ?? null,
    last_error: row.lastError ?? null,
    environment: row.environment ?? null,
    updated_at: row.updatedAt,
  };
  const r = await restFetch(TABLE, {
    method: "POST",
    body: JSON.stringify(dbRow),
  });
  if (r.ok) return true;
  // table missing → fallback
  console.warn("[suppliers] table upsert failed, using crm_store fallback", redactForLog(r.text));
  return putCrmStoreFallback(row);
}

export async function deleteStoredConnection(supplierId: SupplierId): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const r = await restFetch(`${TABLE}?supplier_id=eq.${supplierId}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  if (r.ok) return true;
  const cfg = getSupabaseConfig();
  if (!cfg) return false;
  const id = encodeURIComponent(`supplier:${supplierId}`);
  const res = await fetch(`${cfg.url}/rest/v1/crm_store?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
    },
  });
  return res.ok;
}

export function decryptCredentials(
  row: StoredSupplierConnection
): SupplierCredentialsInput | null {
  if (!row.loginEncrypted || !row.passwordEncrypted) return null;
  try {
    const login = decryptSecret(row.loginEncrypted);
    const password = decryptSecret(row.passwordEncrypted);
    let extra: Record<string, string> | undefined;
    if (row.extraEncrypted) {
      extra = JSON.parse(decryptSecret(row.extraEncrypted)) as Record<string, string>;
    }
    return { login, password, extra };
  } catch {
    return null;
  }
}

export function decryptSessionMeta(
  row: StoredSupplierConnection
): Record<string, string> {
  if (!row.sessionMetaEncrypted) return {};
  try {
    return JSON.parse(decryptSecret(row.sessionMetaEncrypted)) as Record<string, string>;
  } catch {
    return {};
  }
}

export function toPublicConnection(row: StoredSupplierConnection): SupplierConnectionPublic {
  const adapter = getAdapter(row.supplierId);
  let loginHint: string | undefined;
  if (row.loginEncrypted) {
    try {
      loginHint = loginHintFrom(decryptSecret(row.loginEncrypted));
    } catch {
      loginHint = "***";
    }
  }
  return {
    supplierId: row.supplierId,
    displayName: SUPPLIER_DISPLAY[row.supplierId],
    status: row.status,
    loginHint,
    lastSuccessAt: row.lastSuccessAt,
    lastCheckedAt: row.lastCheckedAt,
    lastError: row.lastError,
    capabilities: adapter?.capabilities ?? [],
    environment: row.environment,
    hasPassword: Boolean(row.passwordEncrypted),
  };
}

export async function listPublicConnections(): Promise<SupplierConnectionPublic[]> {
  const ids: SupplierId[] = ["inter_cars", "auto_partner", "hart", "motowarsztat"];
  const stored = await listStoredConnections();
  const byId = new Map(stored.map((s) => [s.supplierId, s]));
  return ids.map((id) => {
    const row = byId.get(id);
    if (row) return toPublicConnection(row);
    const adapter = getAdapter(id);
    const baseStatus: SupplierConnectionStatus =
      id === "motowarsztat" ? "not_supported" : "not_configured";
    return {
      supplierId: id,
      displayName: SUPPLIER_DISPLAY[id],
      status: baseStatus,
      capabilities: adapter?.capabilities ?? [],
      hasPassword: false,
      lastError:
        id === "motowarsztat"
          ? "MOTOwarsztat nie udostępnia publicznego API dla zewnętrznego ERP — używamy importu PDF/OCR."
          : undefined,
    };
  });
}

export async function saveCredentialsAndStatus(opts: {
  supplierId: SupplierId;
  creds: SupplierCredentialsInput;
  status: SupplierConnectionStatus;
  sessionMeta?: Record<string, string>;
  lastError?: string;
  environment?: "sandbox" | "production";
}): Promise<StoredSupplierConnection> {
  const now = new Date().toISOString();
  const row: StoredSupplierConnection = {
    supplierId: opts.supplierId,
    status: opts.status,
    loginEncrypted: encryptSecret(opts.creds.login),
    passwordEncrypted: encryptSecret(opts.creds.password),
    extraEncrypted: opts.creds.extra
      ? encryptSecret(JSON.stringify(opts.creds.extra))
      : undefined,
    sessionMetaEncrypted: opts.sessionMeta
      ? encryptSecret(JSON.stringify(opts.sessionMeta))
      : undefined,
    lastSuccessAt: opts.status === "connected" ? now : undefined,
    lastCheckedAt: now,
    lastError: opts.lastError,
    environment: opts.environment,
    updatedAt: now,
  };
  // preserve previous success if reconnect failed
  const prev = await getStoredConnection(opts.supplierId);
  if (opts.status !== "connected" && prev?.lastSuccessAt) {
    row.lastSuccessAt = prev.lastSuccessAt;
  }
  await upsertStoredConnection(row);
  return row;
}
