import { describeGbpAccess, gbpDrafts, MAPS_RANK_STATUS } from "@/lib/seo-growth/gbp";
import { describeSearchConsoleAccess } from "@/lib/gsc-import";
import { GSC_LIMITATIONS } from "@/lib/gsc-analysis";
import { adsConversionConfigured } from "@/lib/seo-growth/conversions";
import type { SeoAction } from "@/lib/seo-growth/case-store";
import type { WorkCase } from "@/lib/seo-growth/work-cases";

export type MeasuredValue = { status: "NO_DATA" | "UNAVAILABLE"; value: null } | { status: "MEASURED"; value: number };

export type PanelSnapshot = {
  searchConsole: { status: "NO_DATA" | "IMPORTED"; clicks: MeasuredValue; impressions: MeasuredValue; ctr: MeasuredValue; position: MeasuredValue };
  bookings: { status: "NO_DATA"; value: null };
  gbp: { api: "UNAVAILABLE"; mapsRank: "NO_DATA"; draftCount: number };
  caseStorage: "READY" | "STORAGE_NOT_CONFIGURED" | "STORAGE_UNAVAILABLE";
  queue: { drafts: number; review: number; approved: number; published: number; archived: number } | null;
  integrationErrors: string[];
  measured: string[];
  recommendations: string[];
  actions: SeoAction[];
};

function noData(): MeasuredValue {
  return { status: "NO_DATA", value: null };
}

export function buildPanelSnapshot(input: {
  env: Record<string, string | undefined>;
  cases: WorkCase[];
  actions: SeoAction[];
  gscTotals: { clicks: number; impressions: number; ctr: number; position: number } | null;
  gscAvailable: boolean;
  caseStorage?: PanelSnapshot["caseStorage"];
}): PanelSnapshot {
  const gsc = describeSearchConsoleAccess(input.env);
  const gbp = describeGbpAccess(input.env);
  const ads = adsConversionConfigured(input.env);
  const counts = { drafts: 0, review: 0, approved: 0, published: 0, archived: 0 };
  for (const story of input.cases) {
    if (story.status === "draft") counts.drafts += 1;
    if (story.status === "review") counts.review += 1;
    if (story.status === "approved") counts.approved += 1;
    if (story.status === "published") counts.published += 1;
    if (story.status === "archived") counts.archived += 1;
  }
  const totals = input.gscAvailable ? input.gscTotals : null;
  const caseStorage = input.caseStorage ?? "READY";
  return {
    searchConsole: {
      status: totals ? "IMPORTED" : "NO_DATA",
      clicks: totals ? { status: "MEASURED", value: totals.clicks } : noData(),
      impressions: totals ? { status: "MEASURED", value: totals.impressions } : noData(),
      ctr: totals ? { status: "MEASURED", value: totals.ctr } : noData(),
      position: totals ? { status: "MEASURED", value: totals.position } : noData(),
    },
    bookings: { status: "NO_DATA", value: null },
    gbp: { api: gbp.api, mapsRank: MAPS_RANK_STATUS.status, draftCount: gbpDrafts().length },
    caseStorage,
    queue: caseStorage === "READY" ? counts : null,
    integrationErrors: [
      gbp.reason,
      gsc.reason,
      ads.status === "BLOCKED" ? ads.reason : "",
      ...GSC_LIMITATIONS.slice(0, 1),
    ].filter(Boolean),
    measured: totals ? ["Search Console CSV: kliknięcia, wyświetlenia, CTR i pozycja z pliku."] : [],
    recommendations: [
      "Sprawdź ręcznie godziny soboty w karcie Google. Kod strony ma 09:00–14:00.",
      "Nie publikuj szkicu wykonanej pracy, dopóki nie ma zatwierdzonego case.",
      "Nie twórz nowych URL, dopóki eksport stron nie pokaże nakładania.",
    ],
    actions: input.actions.slice(-30),
  };
}

export function weeklyReport(snapshot: PanelSnapshot): { measured: string[]; hypotheses: string[] } {
  return {
    measured: [
      snapshot.searchConsole.clicks.status === "MEASURED"
        ? `Kliknięcia z importu: ${snapshot.searchConsole.clicks.value}.`
        : "Kliknięcia organiczne: NO_DATA.",
      snapshot.searchConsole.impressions.status === "MEASURED"
        ? `Wyświetlenia z importu: ${snapshot.searchConsole.impressions.value}.`
        : "Wyświetlenia organiczne: NO_DATA.",
      `Opublikowane case: ${snapshot.queue ? snapshot.queue.published : snapshot.caseStorage}.`,
      "Zapisy, przyjazdy i opłacone zlecenia: NO_DATA w tym panelu. Nie bierzemy ich z CRM.",
      "Pozycja Maps: NO_DATA.",
    ],
    hypotheses: snapshot.recommendations,
  };
}
