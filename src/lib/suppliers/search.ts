import type {
  PartsSearchQuery,
  SupplierId,
  SupplierPartOffer,
  SupplierSearchResult,
} from "@/lib/suppliers/types";
import { getAdapter } from "@/lib/suppliers/registry";
import {
  decryptCredentials,
  decryptSessionMeta,
  getStoredConnection,
  listStoredConnections,
  upsertStoredConnection,
} from "@/lib/server/suppliers/connection-store";

const DEFAULT_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 5 * 60_000;

type CacheEntry = { at: number; offers: SupplierPartOffer[] };
const memoryCache = new Map<string, CacheEntry>();

function cacheKey(supplierId: string, q: PartsSearchQuery): string {
  return [
    supplierId,
    q.article || "",
    q.oem || "",
    q.vin || "",
    q.name || "",
    q.brand || "",
    q.make || "",
    q.model || "",
  ].join("|");
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

async function searchOne(
  supplierId: SupplierId,
  query: PartsSearchQuery,
  markupPercent: number
): Promise<SupplierSearchResult> {
  const started = Date.now();
  const adapter = getAdapter(supplierId);
  if (!adapter) {
    return {
      supplierId,
      ok: false,
      status: "not_supported",
      offers: [],
      error: "unknown_supplier",
      durationMs: 0,
    };
  }
  if (supplierId === "motowarsztat") {
    return {
      supplierId,
      ok: false,
      status: "not_supported",
      offers: [],
      error: "MOTOwarsztat: tylko import dokumentów, bez live search",
      durationMs: Date.now() - started,
    };
  }

  const row = await getStoredConnection(supplierId);
  if (!row || row.status === "not_configured") {
    return {
      supplierId,
      ok: false,
      status: "not_configured",
      offers: [],
      error: "not_configured",
      durationMs: Date.now() - started,
    };
  }
  if (row.status === "not_supported") {
    return {
      supplierId,
      ok: false,
      status: "not_supported",
      offers: [],
      error: row.lastError || "not_supported",
      durationMs: Date.now() - started,
    };
  }

  const key = cacheKey(supplierId, query);
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    const age = Date.now() - cached.at;
    return {
      supplierId,
      ok: true,
      status: "connected",
      offers: cached.offers.map((o) => ({
        ...o,
        fromCache: true,
        cacheAgeMs: age,
        sellPrice:
          o.sellPrice ??
          Math.round(o.purchasePrice * (1 + markupPercent / 100) * 100) / 100,
      })),
      durationMs: Date.now() - started,
    };
  }

  const creds = decryptCredentials(row);
  let session = decryptSessionMeta(row);
  if (creds && supplierId === "auto_partner") {
    // ephemeral password for outbound request only — not persisted back
    session = { ...session, _password: creds.password, login: session.login || creds.login };
  }

  try {
    let offers: SupplierPartOffer[] = [];
    const run = async () => {
      if (query.vin && adapter.searchByVIN) {
        offers = await adapter.searchByVIN(query, session);
      } else if ((query.oem || query.article) && adapter.searchByOEM && query.oem && !query.article) {
        offers = await adapter.searchByOEM(query, session);
      } else if ((query.article || query.oem) && adapter.searchByArticle) {
        offers = await adapter.searchByArticle(query, session);
      } else if (query.name && adapter.searchByName) {
        offers = await adapter.searchByName(query, session);
      } else if (adapter.searchByArticle && (query.article || query.oem || query.name)) {
        offers = await adapter.searchByArticle(
          { ...query, article: query.article || query.oem || query.name },
          session
        );
      } else {
        throw new Error("unsupported_query_for_supplier");
      }
    };
    await withTimeout(run(), DEFAULT_TIMEOUT_MS);

    offers = offers.map((o) => ({
      ...o,
      sellPrice: Math.round(o.purchasePrice * (1 + markupPercent / 100) * 100) / 100,
      fromCache: false,
      cacheAgeMs: 0,
    }));
    memoryCache.set(key, { at: Date.now(), offers });

    if (row.status !== "connected") {
      await upsertStoredConnection({
        ...row,
        status: "connected",
        lastSuccessAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
        lastError: undefined,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      supplierId,
      ok: true,
      status: "connected",
      offers,
      durationMs: Date.now() - started,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    let status = row.status;
    if (msg.includes("reauth") || msg.includes("401")) status = "reauth_required";
    else if (msg.includes("timeout")) status = "temporarily_unavailable";
    else if (msg.includes("not_supported")) status = "error";
    else if (msg.includes("unconfigured")) status = "user_action_required";
    else status = "error";

    await upsertStoredConnection({
      ...row,
      status,
      lastCheckedAt: new Date().toISOString(),
      lastError: msg.slice(0, 300),
      updatedAt: new Date().toISOString(),
    });

    return {
      supplierId,
      ok: false,
      status,
      offers: [],
      error: msg.slice(0, 300),
      durationMs: Date.now() - started,
    };
  }
}

/** Parallel multi-supplier search — one failure does not block others. */
export async function searchAllSuppliers(
  query: PartsSearchQuery,
  opts?: { supplierIds?: SupplierId[]; markupPercent?: number }
): Promise<{ results: SupplierSearchResult[]; offers: SupplierPartOffer[] }> {
  const markup = opts?.markupPercent ?? 30;
  const stored = await listStoredConnections();
  const withCreds = stored.filter((s) => Boolean(s.passwordEncrypted)).map((s) => s.supplierId);
  const ids =
    opts?.supplierIds?.length
      ? opts.supplierIds
      : (["hart", "inter_cars", "auto_partner"] as SupplierId[]).filter((id) =>
          withCreds.includes(id)
        );

  const unique = Array.from(
    new Set(ids.length ? ids : (["hart", "inter_cars", "auto_partner"] as SupplierId[]))
  );
  const results = await Promise.all(unique.map((id) => searchOne(id, query, markup)));
  const offers = results.flatMap((r) => r.offers);
  return { results, offers };
}

export function clearSupplierSearchCache(): void {
  memoryCache.clear();
}
