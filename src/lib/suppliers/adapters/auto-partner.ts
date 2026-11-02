import type {
  PartsSearchQuery,
  SupplierAdapter,
  SupplierCredentialsInput,
  SupplierPartOffer,
} from "@/lib/suppliers/types";
import { redactForLog } from "@/lib/server/secrets-crypto";

/**
 * Auto Partner S.A. — B2B WebService integration.
 *
 * Public OpenAPI with fixed global URLs is not published for arbitrary third parties.
 * Partner ERPs (cairo, ZYNQ, Base Connect) configure:
 * - WebService URL (issued by Auto Partner)
 * - Customer code
 * - WebService password
 * - Client password
 *
 * We only call URLs the owner pastes from Auto Partner documentation / sales pack.
 * No invented endpoints. Without https webserviceUrl → user_action_required.
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

export const autoPartnerAdapter: SupplierAdapter = {
  id: "auto_partner",
  displayName: "Auto Partner",
  capabilities: ["authenticate", "checkSession", "searchByArticle"],

  async connect(creds) {
    return this.authenticate(creds);
  },

  async authenticate(creds: SupplierCredentialsInput) {
    const ws = creds.extra?.webserviceUrl?.trim();
    if (!ws) {
      return {
        status: "user_action_required",
        error:
          "Auto Partner: brak publicznego uniwersalnego API. Poproś opiekuna handlowego o adres WebService + kody/hasła i wklej webserviceUrl (https) oraz opcjonalnie pingPath.",
      };
    }
    if (!ws.startsWith("https://")) {
      return { status: "error", error: "webserviceUrl must be https://" };
    }
    const pingPath = creds.extra?.pingPath || "";
    const url = `${ws.replace(/\/$/, "")}${pingPath.startsWith("/") ? pingPath : pingPath ? `/${pingPath}` : ""}`;
    const headers: Record<string, string> = {
      Accept: "application/json, text/xml, */*",
    };
    // Common patterns used by partner systems — credentials never logged.
    if (creds.extra?.authHeader === "basic") {
      headers.Authorization = `Basic ${Buffer.from(`${creds.login}:${creds.password}`).toString("base64")}`;
    } else {
      headers["X-Customer-Code"] = creds.login;
      headers["X-Customer-Password"] = creds.password;
      if (creds.extra?.wsPassword) headers["X-Webservice-Password"] = creds.extra.wsPassword;
    }
    const r = await timedFetch(url || ws, { method: "GET", headers });
    if (r.status === 401 || r.status === 403) {
      return { status: "reauth_required", error: "Auto Partner: odrzucono logowanie" };
    }
    if (!r.ok && r.status !== 404) {
      // 404 on bare base can still mean reachable host; prefer explicit pingPath.
      if (!pingPath && r.status === 0) {
        return {
          status: "temporarily_unavailable",
          error: redactForLog(r.text).slice(0, 180),
        };
      }
      if (!pingPath) {
        return {
          status: "user_action_required" as const,
          error:
            "Host WebService osiągalny lub wymaga dokładnego pingPath z dokumentacji AP. Status: " +
            r.status,
          sessionMeta: {
            webserviceUrl: ws,
            login: creds.login,
            authOk: "0",
          } as Record<string, string>,
        };
      }
      return {
        status: r.status === 0 ? "temporarily_unavailable" : "error",
        error: `Auto Partner HTTP ${r.status}: ${redactForLog(r.text).slice(0, 160)}`,
      };
    }
    return {
      status: "connected",
      sessionMeta: {
        webserviceUrl: ws,
        searchPath: creds.extra?.searchPath || "",
        login: creds.login,
        authHeader: creds.extra?.authHeader || "headers",
        // password reference: adapters re-read from decryptCredentials on search
      },
    };
  },

  async checkSession(sessionMeta) {
    if (!sessionMeta.webserviceUrl) {
      return { status: "reauth_required", error: "no_session" };
    }
    const r = await timedFetch(sessionMeta.webserviceUrl, {
      method: "GET",
      headers: { Accept: "*/*" },
    });
    if (r.status === 401 || r.status === 403) {
      return { status: "reauth_required", error: "session_expired" };
    }
    if (r.status === 0) {
      return { status: "temporarily_unavailable", error: r.text };
    }
    return { status: "connected" };
  },

  async searchByArticle(query: PartsSearchQuery, sessionMeta) {
    const article = (query.article || query.oem || "").trim();
    if (!article) return [];
    const searchPath = sessionMeta.searchPath?.trim();
    if (!searchPath || !sessionMeta.webserviceUrl) {
      throw new Error(
        "auto_partner_search_unconfigured: ustaw searchPath z dokumentacji Auto Partner (np. /api/price?code={article})"
      );
    }
    const base = sessionMeta.webserviceUrl.replace(/\/$/, "");
    const path = searchPath
      .replaceAll("{article}", encodeURIComponent(article))
      .replaceAll("{oem}", encodeURIComponent(query.oem || article))
      .replaceAll("{brand}", encodeURIComponent(query.brand || ""));
    const url = path.startsWith("https://")
      ? path
      : `${base}${path.startsWith("/") ? path : `/${path}`}`;
    // Password must be re-supplied by service layer into Authorization — sessionMeta must not hold it.
    // Service layer passes temporary _password in sessionMeta only for the request lifetime.
    const password = sessionMeta._password || "";
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (sessionMeta.authHeader === "basic") {
      headers.Authorization = `Basic ${Buffer.from(`${sessionMeta.login}:${password}`).toString("base64")}`;
    } else {
      headers["X-Customer-Code"] = sessionMeta.login || "";
      headers["X-Customer-Password"] = password;
    }
    const r = await timedFetch(url, { method: "GET", headers });
    if (!r.ok) throw new Error(`auto_partner_search_${r.status}`);
    const fetchedAt = new Date().toISOString();
    const offers: SupplierPartOffer[] = [];
    const push = (p: Record<string, unknown>) => {
      offers.push({
        supplierId: "auto_partner",
        supplierName: "Auto Partner",
        manufacturer: String(p.brand ?? p.manufacturer ?? ""),
        article: String(p.article ?? p.code ?? article),
        name: String(p.name ?? p.description ?? article),
        purchasePrice: Number(p.priceNet ?? p.price ?? 0),
        priceBasis: "net",
        currency: String(p.currency ?? "PLN"),
        vatRate: 23,
        availability: p.availability != null ? String(p.availability) : undefined,
        quantityAvailable: p.qty != null ? Number(p.qty) : undefined,
        deliveryEstimate: p.delivery != null ? String(p.delivery) : undefined,
        applicableToVin: null,
        fetchedAt,
        cacheAgeMs: 0,
        fromCache: false,
        rawRef: String(p.id ?? article),
        sourceLabel: "Auto Partner WebService (customer searchPath)",
      });
    };
    if (Array.isArray(r.json)) {
      for (const row of r.json as Record<string, unknown>[]) push(row);
    } else if (r.json && typeof r.json === "object") {
      const list = (r.json as { items?: unknown; data?: unknown }).items ||
        (r.json as { data?: unknown }).data;
      if (Array.isArray(list)) {
        for (const row of list as Record<string, unknown>[]) push(row);
      }
    }
    return offers;
  },
};
