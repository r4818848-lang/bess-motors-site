/**
 * Search Console analysis on top of the CSV importer.
 * The Search Console API is not called. A missing file is NO_DATA, not zero.
 */

import {
  GSC_LOW_CTR_MAX,
  GSC_LOW_CTR_MIN_IMPRESSIONS,
  parseGscCsv,
  type GscPeriod,
  type GscRow,
  type GscTable,
} from "@/lib/gsc-import";

export const GSC_WINDOWS = [7, 28, 90] as const;
export type GscWindow = (typeof GSC_WINDOWS)[number];

export type GscService = "tires" | "oil" | "diagnostics" | "brakes" | "other_repair" | "unclassified";

export type GscDistrictTier = "P1" | "P2" | "P3";

const SERVICE_RULES: { service: Exclude<GscService, "unclassified">; pattern: RegExp }[] = [
  { service: "tires", pattern: /wulkaniz|opon|felg|wyważ|wywaz|przebic|sezonow/i },
  { service: "oil", pattern: /\bolej|filtr oleju|filtra oleju/i },
  { service: "diagnostics", pattern: /diagnost|komputerow|check engine|\bobd\b/i },
  { service: "brakes", pattern: /hamulc|klock|tarcz/i },
  {
    service: "other_repair",
    pattern: /mechanik|klimatyz|zawiesz|rozrząd|rozrzad|silnik|skrzyn|sprzęg|sprzeg/i,
  },
];

const BRAND = /\bbess\b|bessmotors|bess[\s-]?motors/i;

const P1 =
  /włoch|wloch|okęci|okeci|ochot|ursus|mokot|wola|bemow|służewiec|sluzewiec|raków|rakow/i;
const P3 = /raszyn|michałowic|michalowic|piastów|piastow|pruszk|janki|ożarów|ozarow/i;
const P2 =
  /śródmie|srodmie|praga|wilan|wawer|targów|targow|bielan|żolib|zolib|ursyn|wesoł|wesol|rembert|białoł|bialol|wawrzysz|wilanów|wilanow/i;

const ANONYMIZED = /^(other|anonymized|anonymised|zapytanie zanonimizowane|\(other\))$/i;

export type QueryClass = GscRow & {
  branded: boolean;
  service: GscService;
  /** Words in the query. This is not the searcher's physical location. */
  districtTiers: GscDistrictTier[];
  anonymized: boolean;
  warsawCommercial: boolean;
};

export function classifyQuery(row: GscRow): QueryClass {
  const key = row.key.trim();
  const service = SERVICE_RULES.find((rule) => rule.pattern.test(key))?.service ?? "unclassified";
  const districtTiers: GscDistrictTier[] = [];
  if (P1.test(key)) districtTiers.push("P1");
  if (P2.test(key)) districtTiers.push("P2");
  if (P3.test(key)) districtTiers.push("P3");
  const branded = BRAND.test(key);
  const warsaw = /warszaw|warsaw/i.test(key);
  return {
    ...row,
    branded,
    service,
    districtTiers,
    anonymized: ANONYMIZED.test(key),
    warsawCommercial: warsaw && !branded && service !== "unclassified",
  };
}

export type GscWindowStatus = {
  uniqueDays: number | null;
  calendarSpan: number | null;
  window: GscWindow | null;
  incomplete: boolean;
};

export function describePeriodWindow(period: GscPeriod | null): GscWindowStatus {
  if (!period?.dateFrom || !period.dateTo) {
    return { uniqueDays: null, calendarSpan: null, window: null, incomplete: false };
  }
  const unique = new Set(period.dates.map((row) => row.key).filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)));
  const from = Date.parse(`${period.dateFrom}T00:00:00Z`);
  const to = Date.parse(`${period.dateTo}T00:00:00Z`);
  const calendarSpan = Number.isFinite(from) && Number.isFinite(to) ? Math.round((to - from) / 86400000) + 1 : null;
  const uniqueDays = unique.size;
  const window = (GSC_WINDOWS as readonly number[]).includes(uniqueDays) ? (uniqueDays as GscWindow) : null;
  return {
    uniqueDays,
    calendarSpan,
    window,
    incomplete: calendarSpan != null && calendarSpan !== uniqueDays,
  };
}

export function periodsAreComparable(current: GscPeriod | null, previous: GscPeriod | null): {
  comparable: boolean;
  reason: string;
  seasonality: "same_months" | "different_months" | "unknown";
} {
  const left = describePeriodWindow(current);
  const right = describePeriodWindow(previous);
  if (left.uniqueDays == null || right.uniqueDays == null) {
    return { comparable: false, reason: "missing_dates", seasonality: "unknown" };
  }
  if (left.uniqueDays !== right.uniqueDays) {
    return { comparable: false, reason: "unequal_length", seasonality: monthRelation(current, previous) };
  }
  return { comparable: true, reason: "equal_length", seasonality: monthRelation(current, previous) };
}

function monthRelation(current: GscPeriod | null, previous: GscPeriod | null): "same_months" | "different_months" | "unknown" {
  const months = (period: GscPeriod | null) =>
    new Set((period?.dates ?? []).map((row) => row.key.slice(0, 7)).filter((value) => /^\d{4}-\d{2}$/.test(value)));
  const a = months(current);
  const b = months(previous);
  if (a.size === 0 || b.size === 0) return "unknown";
  if (a.size === b.size && [...a].every((month) => b.has(month))) return "same_months";
  return "different_months";
}

export type GscExportCheck = {
  status: "OK" | "NO_DATA" | "INVALID";
  table: GscTable;
  skippedRows: number;
  issues: string[];
};

export function validateGscExport(fileName: string, text: string): GscExportCheck {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return {
      status: "NO_DATA",
      table: { kind: "unknown", fileName, rows: [] },
      skippedRows: 0,
      issues: ["empty_file"],
    };
  }
  const table = parseGscCsv(fileName, text);
  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim() !== "");
  const skippedRows = Math.max(0, lines.length - 1 - table.rows.length);
  const issues: string[] = [];
  if (table.rows.length === 0) issues.push("no_metric_rows");
  if (skippedRows > 0) issues.push("incomplete_rows");
  const status = table.rows.length === 0 ? "INVALID" : "OK";
  return { status, table, skippedRows, issues };
}

export type ServiceRollup = Record<GscService, { clicks: number; impressions: number; queries: number }>;

export function rollupQueries(rows: GscRow[]): {
  branded: QueryClass[];
  nonBranded: QueryClass[];
  byService: ServiceRollup;
  warsawCommercial: QueryClass[];
  byDistrict: Record<GscDistrictTier, QueryClass[]>;
  lowCtrPagesNote: string;
} {
  const classes = rows.map(classifyQuery).filter((row) => !row.anonymized);
  const empty = () => ({ clicks: 0, impressions: 0, queries: 0 });
  const byService: ServiceRollup = {
    tires: empty(),
    oil: empty(),
    diagnostics: empty(),
    brakes: empty(),
    other_repair: empty(),
    unclassified: empty(),
  };
  for (const row of classes) {
    const bucket = byService[row.service];
    bucket.clicks += row.clicks;
    bucket.impressions += row.impressions;
    bucket.queries += 1;
  }
  return {
    branded: classes.filter((row) => row.branded),
    nonBranded: classes.filter((row) => !row.branded),
    byService,
    warsawCommercial: classes.filter((row) => row.warsawCommercial),
    byDistrict: {
      P1: classes.filter((row) => row.districtTiers.includes("P1")),
      P2: classes.filter((row) => row.districtTiers.includes("P2")),
      P3: classes.filter((row) => row.districtTiers.includes("P3")),
    },
    lowCtrPagesNote: `Próg niski CTR: wyświetlenia ≥ ${GSC_LOW_CTR_MIN_IMPRESSIONS} i CTR < ${GSC_LOW_CTR_MAX}. To reguła analizy, nie pozycja Maps.`,
  };
}

export type IntentGroup = {
  intent: string;
  urls: string[];
  measuredCannibalization: "NO_DATA";
  hypothesis: string;
};

/** Existing URLs only. A shared intent is a hypothesis until Search Console pages prove overlap. */
export const EXISTING_INTENT_GROUPS: IntentGroup[] = [
  {
    intent: "wulkanizacja",
    urls: ["/opony", "/wulkanizacja-warszawa", "/wymiana-opon-warszawa", "/sezonowa-wymiana-opon-warszawa"],
    measuredCannibalization: "NO_DATA",
    hypothesis: "Te adresy już istnieją. Nakładanie zapytań trzeba sprawdzić w eksporcie stron, zanim powstanie nowy URL.",
  },
  {
    intent: "wymiana oleju",
    urls: ["/wymiana-oleju", "/wymiana-oleju-warszawa"],
    measuredCannibalization: "NO_DATA",
    hypothesis: "Dwie strony oleju. Bez CSV nie wiadomo, która zbiera wyświetlenia.",
  },
  {
    intent: "hamulce",
    urls: ["/hamulce", "/hamulce-warszawa"],
    measuredCannibalization: "NO_DATA",
    hypothesis: "Dwie strony hamulców. Decyzja o scaleniu dopiero po danych stron.",
  },
  {
    intent: "mechanik Włochy",
    urls: ["/", "/mechanik-warszawa-wlochy", "/warszawa-wlochy"],
    measuredCannibalization: "NO_DATA",
    hypothesis: "Strona główna i strony dzielnicy mogą dzielić zapytania marki i „mechanik Włochy”.",
  },
];

export const GSC_LIMITATIONS = [
  "API Search Console nie jest wywoływane. Nazwa zmiennej w środowisku nie oznacza dostępu.",
  "Eksport z interfejsu Google często ucina długie listy zapytań. Brak wiersza nie jest zerem.",
  "Google pomija część zapytań jako zanonimizowane. Ten import je odrzuca i nie dorysowuje.",
  "Dane Search Console zwykle mają opóźnienie około dwóch dni. Ostatnie dni okresu bywają niepełne.",
  "Porównanie liczy się tylko dla okresów o tej samej liczbie dni. Różne miesiące oznaczają możliwą sezonowość, bez korekty liczb.",
  "Słowo dzielnicy w zapytaniu nie jest położeniem użytkownika.",
  "Pozycja w tym imporcie jest pozycją organicznych wyników z Search Console, nie pozycją Google Maps.",
] as const;
