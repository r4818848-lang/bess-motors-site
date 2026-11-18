import "server-only";
import snapshot from "@/data/meta-ads-2026-11-18.json";
import { validateMetaAdsRows, type MetaAdsPayload } from "@/lib/meta-ads-costs";

/** Private historical fallback: only the authenticated report API can return it. */
export function metaAdsSnapshot(syncError = false): MetaAdsPayload {
  return {
    mode: "snapshot",
    capturedAt: snapshot.capturedAt,
    dateFrom: snapshot.dateFrom,
    dateTo: snapshot.dateTo,
    currency: "PLN",
    rows: validateMetaAdsRows(snapshot.rows),
    setupRequired: true,
    ...(syncError ? { syncError: true } : {}),
  };
}
