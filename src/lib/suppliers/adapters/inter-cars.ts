import type {
  PartsSearchQuery,
  SupplierAdapter,
  SupplierCredentialsInput,
  SupplierPartOffer,
} from "@/lib/suppliers/types";
import { redactForLog } from "@/lib/server/secrets-crypto";

/**
 * Inter Cars integration — only documented channels:
 *
 * 1) IC WebAPI (modern REST, OAuth-style ClientId/ClientSecret)
 *    Docs: https://docs.webapi.intercars.eu/
 *    Requires commercial API agreement with Inter Cars (test env first).
 *    Exact token URL / product search paths are account-specific and published
 *    to the customer in Postman collections after registration — we do NOT invent them.
 *
 * 2) Legacy katalog External documents API
 *    https://katalog.intercars.com.pl/api/v2/External/GetInvoices|GetInvoice
 *    Headers: kh_kod, token (token from IC_Katalog ONLINE → Share documents online)
 *    This channel is for **purchase documents**, not live parts catalog search.
 *
 * This adapter:
 * - authenticate/connect: validates credentials against a configured auth URL when provided,
 *   or validates legacy katalog token via GetInvoices (narrow date window).
 * - searchByArticle: only if `extra.productSearchUrl` template is provided by owner
 *   (from their IC Postman pack). Without it → capability gap, clear error.
 */

async function timedFetch(
  url: string,
  init: RequestInit,
  timeoutMs = 15_000
): Promise<{ ok: boolean; status: number; text: string; json: unknown }> {
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
    return { ok: res.ok, status: res.status, text, json };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      text: e instanceof Error ? e.message : String(e),
      json: null,
    };
  } finally {
    clearTimeout(t);
  }
}

function yyyymmdd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function validateLegacyKatalog(creds: SupplierCredentialsInput) {
  const kh = creds.extra?.kh_kod || creds.login;
  const token = creds.password;
  if (!kh || !token) {
    return {
      status: "error" as const,
      error: "Wymagane: kh_kod (login) oraz token z IC_Katalog ONLINE",
    };
  }
  const to = new Date();
  const from = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  const url = `https://katalog.intercars.com.pl/api/v2/External/GetInvoices?from=${yyyymmdd(from)}&to=${yyyymmdd(to)}`;
  const r = await timedFetch(url, {
    method: "GET",
    headers: {
      kh_kod: kh,
      token,
      Accept: "application/xml, application/json, text/xml, */*",
    },
  });
  if (r.status === 401 || r.status === 403) {
    return {
      status: "reauth_required" as const,
      error: "Inter Cars katalog: nieprawidłowy kh_kod/token",
    };
  }
  if (!r.ok) {
    return {
      status: (r.status === 0 ? "temporarily_unavailable" : "error") as
        | "temporarily_unavailable"
        | "error",
      error: `Inter Cars katalog HTTP ${r.status}: ${redactForLog(r.text).slice(0, 180)}`,
    };
  }
  return {
    status: "connected" as const,
    sessionMeta: {
      mode: "katalog_external",
      kh_kod: kh,
      token,
    },
  };
}

async function validateWebApi(creds: SupplierCredentialsInput) {
  const authUrl = creds.extra?.authUrl?.trim();
  const clientId = creds.extra?.clientId || creds.login;
  const clientSecret = creds.password;
  if (!authUrl) {
    return {
      status: "user_action_required" as const,
      error:
        "IC WebAPI: podaj authUrl z dokumentacji/Postmana Inter Cars (nie wymyślamy endpointu). Alternatywnie użyj trybu katalog (kh_kod+token).",
    };
  }
  if (!authUrl.startsWith("https://")) {
    return { status: "error" as const, error: "authUrl must be https://" };
  }
  // OAuth2 client_credentials is the common IC pattern in partner ERPs; body shape from customer Postman.
  const body =
    creds.extra?.authBody === "json"
      ? JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "client_credentials",
        })
      : new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "client_credentials",
        }).toString();
  const r = await timedFetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type":
        creds.extra?.authBody === "json"
          ? "application/json"
          : "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (r.status === 401 || r.status === 403) {
    return { status: "reauth_required" as const, error: "IC WebAPI auth rejected" };
  }
  if (!r.ok) {
    return {
      status: (r.status === 0 ? "temporarily_unavailable" : "error") as
        | "temporarily_unavailable"
        | "error",
      error: `IC WebAPI auth HTTP ${r.status}: ${redactForLog(r.text).slice(0, 180)}`,
    };
  }
  const json = r.json as Record<string, unknown> | null;
  const accessToken =
    (json?.access_token as string) ||
    (json?.accessToken as string) ||
    (json?.token as string);
  if (!accessToken) {
    return {
      status: "error" as const,
      error: "IC WebAPI: brak access_token w odpowiedzi — sprawdź Postman od IC",
    };
  }
  return {
    status: "connected" as const,
    sessionMeta: {
      mode: "webapi",
      accessToken,
      apiBase: creds.extra?.apiBase || "",
      productSearchUrl: creds.extra?.productSearchUrl || "",
    },
  };
}

export const interCarsAdapter: SupplierAdapter = {
  id: "inter_cars",
  displayName: "Inter Cars",
  capabilities: [
    "authenticate",
    "checkSession",
    "importDocuments",
    // searchByArticle only when productSearchUrl configured from IC docs
    "searchByArticle",
  ],

  async connect(creds) {
    return this.authenticate(creds);
  },

  async authenticate(creds) {
    const mode = (creds.extra?.mode || "katalog").toLowerCase();
    if (mode === "webapi") return validateWebApi(creds);
    return validateLegacyKatalog(creds);
  },

  async checkSession(sessionMeta) {
    if (sessionMeta.mode === "katalog_external" && sessionMeta.kh_kod && sessionMeta.token) {
      return validateLegacyKatalog({
        login: sessionMeta.kh_kod,
        password: sessionMeta.token,
        extra: { kh_kod: sessionMeta.kh_kod },
      });
    }
    if (sessionMeta.mode === "webapi" && sessionMeta.accessToken) {
      if (!sessionMeta.apiBase) {
        return {
          status: "connected",
          error: undefined,
        };
      }
      const r = await timedFetch(`${sessionMeta.apiBase.replace(/\/$/, "")}/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionMeta.accessToken}`,
          Accept: "application/json",
        },
      });
      if (r.status === 401 || r.status === 403) {
        return { status: "reauth_required", error: "IC token expired" };
      }
      return { status: "connected" };
    }
    return { status: "reauth_required", error: "no_session" };
  },

  async searchByArticle(query: PartsSearchQuery, sessionMeta) {
    const article = (query.article || query.oem || "").trim();
    if (!article) return [];
    const template = sessionMeta.productSearchUrl?.trim();
    if (!template) {
      // Honest gap: without IC-provided search URL we refuse to invent endpoints.
      throw new Error(
        "inter_cars_search_unconfigured: ustaw productSearchUrl z dokumentacji IC WebAPI / Postmana"
      );
    }
    if (!template.startsWith("https://")) {
      throw new Error("inter_cars_search_url_invalid");
    }
    const url = template
      .replaceAll("{article}", encodeURIComponent(article))
      .replaceAll("{oem}", encodeURIComponent(query.oem || article))
      .replaceAll("{brand}", encodeURIComponent(query.brand || ""));
    const r = await timedFetch(url, {
      method: "GET",
      headers: {
        Authorization: sessionMeta.accessToken
          ? `Bearer ${sessionMeta.accessToken}`
          : "",
        Accept: "application/json",
        ...(sessionMeta.kh_kod
          ? { kh_kod: sessionMeta.kh_kod, token: sessionMeta.token || "" }
          : {}),
      },
    });
    if (!r.ok) throw new Error(`inter_cars_search_${r.status}`);
    const fetchedAt = new Date().toISOString();
    const offers: SupplierPartOffer[] = [];
    const push = (p: Record<string, unknown>) => {
      const price = Number(
        p.priceNet ?? p.price ?? p.netPrice ?? p.PriceNet ?? p.cena ?? 0
      );
      if (!price && price !== 0) return;
      offers.push({
        supplierId: "inter_cars",
        supplierName: "Inter Cars",
        manufacturer: String(p.brand ?? p.manufacturer ?? p.Brand ?? ""),
        article: String(p.article ?? p.index ?? p.sku ?? p.code ?? article),
        name: String(p.name ?? p.description ?? p.Name ?? article),
        purchasePrice: price,
        priceBasis: "net",
        currency: String(p.currency ?? "PLN"),
        vatRate: p.vat != null ? Number(p.vat) : 23,
        availability: p.availability != null ? String(p.availability) : undefined,
        quantityAvailable: p.qty != null ? Number(p.qty) : undefined,
        deliveryEstimate: p.delivery != null ? String(p.delivery) : undefined,
        applicableToVin: null,
        fetchedAt,
        cacheAgeMs: 0,
        fromCache: false,
        rawRef: String(p.id ?? p.index ?? article),
        sourceLabel: "Inter Cars WebAPI (customer productSearchUrl)",
      });
    };
    if (Array.isArray(r.json)) {
      for (const row of r.json as Record<string, unknown>[]) push(row);
    } else if (r.json && typeof r.json === "object") {
      const o = r.json as Record<string, unknown>;
      const list = (o.items || o.products || o.data || o.results) as unknown;
      if (Array.isArray(list)) {
        for (const row of list as Record<string, unknown>[]) push(row);
      }
    }
    return offers;
  },
};
