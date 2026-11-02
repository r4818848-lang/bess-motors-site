import type {
  PartsSearchQuery,
  SupplierAdapter,
  SupplierCredentialsInput,
  SupplierPartOffer,
} from "@/lib/suppliers/types";
import { redactForLog } from "@/lib/server/secrets-crypto";

/**
 * Hart Sp. z o.o. REST API v1 — endpoints from official customer documentation
 * https://www.hartphp.com.pl/media/API/RestAPI-HART-TN-000-RestAPI_Customer_Documentation_PL-1_5.pdf
 *
 * Prod: https://restapi.hartphp.com.pl
 * Sandbox: https://sandbox.restapi.hartphp.com.pl
 *
 * Auth: POST /v1/auth { username, password } → JWT Bearer
 * Products: GET /v1/products?HartCodes=...
 * Availability: GET /v1/products/availability?HartCodes=...
 * Basket: GET/POST /v1/basket
 *
 * Search by free name/VIN is not documented as a public endpoint — article/HartCode required.
 */

const DEFAULT_BASE = "https://restapi.hartphp.com.pl";
const SANDBOX_BASE = "https://sandbox.restapi.hartphp.com.pl";

function baseUrl(extra?: Record<string, string>): string {
  if (extra?.baseUrl?.startsWith("https://")) return extra.baseUrl.replace(/\/$/, "");
  if (extra?.environment === "sandbox") return SANDBOX_BASE;
  return DEFAULT_BASE;
}

async function hartFetch(
  url: string,
  init: RequestInit,
  timeoutMs = 15_000
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, json: null, text: msg };
  } finally {
    clearTimeout(t);
  }
}

function mapProduct(
  p: Record<string, unknown>,
  fetchedAt: string,
  fromCache = false
): SupplierPartOffer {
  const hartCode = String(p.hartCode ?? p.HartCode ?? "");
  const supplierCode = String(p.supplierCode ?? p.SupplierCode ?? hartCode);
  const name = String(p.name ?? p.Name ?? "");
  const manufacturer = String(p.supplier ?? p.SupplierName ?? p.manufacturer ?? "");
  const priceNet = Number(p.priceNet ?? p.sellingPrice ?? p.priceNetto ?? 0);
  const vatRate = p.taxRate != null ? Number(p.taxRate) : 23;
  const qty = p.quantity != null ? Number(p.quantity) : undefined;
  const waiting = p.waitingTime != null ? String(p.waitingTime) : undefined;
  const currency = String(p.currency ?? "PLN");
  return {
    supplierId: "hart",
    supplierName: "Hart",
    manufacturer,
    article: supplierCode || hartCode,
    name,
    purchasePrice: priceNet,
    priceBasis: "net",
    currency,
    vatRate,
    quantityAvailable: qty,
    availability: qty != null ? (qty > 0 ? `qty:${qty}` : "brak") : undefined,
    deliveryEstimate: waiting,
    deliveryConfirmed: waiting != null,
    applicableToVin: null,
    fetchedAt,
    cacheAgeMs: 0,
    fromCache,
    rawRef: hartCode,
    sourceLabel: "Hart REST API /v1/products",
  };
}

export const hartAdapter: SupplierAdapter = {
  id: "hart",
  displayName: "Hart",
  capabilities: [
    "authenticate",
    "checkSession",
    "searchByArticle",
    "getProductDetails",
    "getPrices",
    "getAvailability",
    "getBasket",
    "addToBasket",
  ],

  async connect(creds) {
    return this.authenticate(creds);
  },

  async authenticate(creds: SupplierCredentialsInput) {
    const base = baseUrl(creds.extra);
    const r = await hartFetch(`${base}/v1/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        username: creds.login,
        password: creds.password,
      }),
    });
    if (!r.ok) {
      const err =
        r.status === 401 || r.status === 403
          ? "reauth_required"
          : r.status === 0
            ? "temporarily_unavailable"
            : "error";
      return {
        status: err,
        error: `Hart auth failed (${r.status}): ${redactForLog(r.text).slice(0, 200)}`,
      };
    }
    const body = r.json as Record<string, unknown> | null;
    const token =
      (body?.access_token as string) ||
      (body?.accessToken as string) ||
      (body?.token as string) ||
      (typeof body?.value === "string" ? body.value : undefined) ||
      ((body?.value as Record<string, unknown>)?.access_token as string) ||
      ((body?.value as Record<string, unknown>)?.token as string);
    if (!token) {
      return {
        status: "error",
        error: "Hart auth response without token — check API account permissions",
      };
    }
    return {
      status: "connected",
      sessionMeta: {
        accessToken: token,
        baseUrl: base,
        branchId: creds.extra?.branchId ?? "",
      },
    };
  },

  async checkSession(sessionMeta) {
    if (!sessionMeta.accessToken || !sessionMeta.baseUrl) {
      return { status: "reauth_required", error: "no_session" };
    }
    // Lightweight call: empty/invalid HartCodes still validates Bearer in many deployments;
    // use basket GET which is documented and auth-gated.
    const r = await hartFetch(`${sessionMeta.baseUrl}/v1/basket`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionMeta.accessToken}`,
        Accept: "application/json",
        ...(sessionMeta.branchId ? { BranchId: sessionMeta.branchId } : {}),
      },
    });
    if (r.status === 401 || r.status === 403) {
      return { status: "reauth_required", error: "session_expired" };
    }
    if (!r.ok && r.status === 0) {
      return { status: "temporarily_unavailable", error: r.text };
    }
    if (!r.ok) {
      return { status: "error", error: `Hart session check HTTP ${r.status}` };
    }
    return { status: "connected" };
  },

  async searchByArticle(query: PartsSearchQuery, sessionMeta) {
    const code = (query.article || query.oem || "").trim();
    if (!code) return [];
    if (!sessionMeta.accessToken || !sessionMeta.baseUrl) {
      throw new Error("hart_no_session");
    }
    const url = `${sessionMeta.baseUrl}/v1/products?HartCodes=${encodeURIComponent(code)}&Availability=true`;
    const r = await hartFetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionMeta.accessToken}`,
        Accept: "application/json",
        ...(sessionMeta.branchId ? { BranchId: sessionMeta.branchId } : {}),
      },
    });
    if (r.status === 401 || r.status === 403) throw new Error("hart_reauth");
    if (!r.ok) throw new Error(`hart_products_${r.status}`);
    const fetchedAt = new Date().toISOString();
    const body = r.json as Record<string, unknown> | unknown[] | null;
    let items: Record<string, unknown>[] = [];
    if (Array.isArray(body)) items = body as Record<string, unknown>[];
    else if (body && typeof body === "object") {
      const v = (body as Record<string, unknown>).value;
      if (Array.isArray(v)) items = v as Record<string, unknown>[];
      else if (v && typeof v === "object" && Array.isArray((v as { items?: unknown }).items)) {
        items = (v as { items: Record<string, unknown>[] }).items;
      } else if (Array.isArray((body as { items?: unknown }).items)) {
        items = (body as { items: Record<string, unknown>[] }).items;
      }
    }
    return items.map((p) => mapProduct(p, fetchedAt));
  },

  async getProductDetails(ref, sessionMeta) {
    if (!sessionMeta.accessToken || !sessionMeta.baseUrl) return null;
    const url = `${sessionMeta.baseUrl}/v1/products/${encodeURIComponent(ref)}?Availability=true`;
    const r = await hartFetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionMeta.accessToken}`,
        Accept: "application/json",
        ...(sessionMeta.branchId ? { BranchId: sessionMeta.branchId } : {}),
      },
    });
    if (!r.ok) return null;
    const body = r.json as Record<string, unknown> | null;
    const p =
      (body?.value as Record<string, unknown>) ||
      (body as Record<string, unknown>);
    if (!p) return null;
    return mapProduct(p, new Date().toISOString());
  },

  async getAvailability(refs, sessionMeta) {
    if (!sessionMeta.accessToken || !sessionMeta.baseUrl || refs.length === 0) return [];
    const q = refs.map((c) => `HartCodes=${encodeURIComponent(c)}`).join("&");
    const url = `${sessionMeta.baseUrl}/v1/products/availability?${q}`;
    const r = await hartFetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionMeta.accessToken}`,
        Accept: "application/json",
        ...(sessionMeta.branchId ? { BranchId: sessionMeta.branchId } : {}),
      },
    });
    if (!r.ok) return [];
    const fetchedAt = new Date().toISOString();
    const body = r.json as Record<string, unknown> | unknown[] | null;
    let items: Record<string, unknown>[] = [];
    if (Array.isArray(body)) items = body as Record<string, unknown>[];
    else if (body && Array.isArray((body as { value?: unknown }).value)) {
      items = (body as { value: Record<string, unknown>[] }).value;
    }
    return items.map((p) => mapProduct(p, fetchedAt));
  },

  async getBasket(sessionMeta) {
    if (!sessionMeta.accessToken || !sessionMeta.baseUrl) return null;
    const r = await hartFetch(`${sessionMeta.baseUrl}/v1/basket`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${sessionMeta.accessToken}`,
        Accept: "application/json",
        ...(sessionMeta.branchId ? { BranchId: sessionMeta.branchId } : {}),
      },
    });
    return r.ok ? r.json : null;
  },

  async addToBasket(ref, qty, sessionMeta) {
    if (!sessionMeta.accessToken || !sessionMeta.baseUrl) {
      return { ok: false, error: "no_session" };
    }
    const r = await hartFetch(`${sessionMeta.baseUrl}/v1/basket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionMeta.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(sessionMeta.branchId ? { BranchId: sessionMeta.branchId } : {}),
      },
      body: JSON.stringify({
        orderPositions: [{ hartCode: ref, quantity: qty }],
      }),
    });
    if (!r.ok) {
      return { ok: false, error: `hart_basket_${r.status}` };
    }
    return { ok: true };
  },
};
