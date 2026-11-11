/**
 * Google Search Console CSV import.
 * The API is not called. Numbers exist only when a column is present in an export.
 */

export const GSC_API_ENV_NAMES = [
  "GOOGLE_SEARCH_CONSOLE_CREDENTIALS",
  "GSC_CREDENTIALS_JSON",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "SEARCH_CONSOLE_SITE_URL",
  "GSC_SITE_URL",
  "GOOGLE_SEARCH_CONSOLE_SITE",
] as const;

export type GscApiStatus = {
  api: "unavailable";
  reason: string;
  configuredNames: string[];
};

export function describeSearchConsoleAccess(env: Record<string, string | undefined>): GscApiStatus {
  const configuredNames = GSC_API_ENV_NAMES.filter((name) => Boolean(env[name]?.trim()));
  return {
    api: "unavailable",
    reason:
      configuredNames.length === 0
        ? "Brak zmiennych Search Console API. Import działa z plików CSV wyeksportowanych ręcznie."
        : "Nazwy zmiennych są ustawione, ale ten kod nie wywołuje API i nie czyta sekretów.",
    configuredNames,
  };
}

export type GscRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscFileKind = "queries" | "pages" | "devices" | "countries" | "dates" | "unknown";

export type GscTable = {
  kind: GscFileKind;
  fileName: string;
  rows: GscRow[];
};

export type GscPeriod = {
  files: { kind: GscFileKind; fileName: string; rows: number }[];
  missing: GscFileKind[];
  queries: GscRow[];
  pages: GscRow[];
  devices: GscRow[];
  countries: GscRow[];
  dates: GscRow[];
  dateFrom: string | null;
  dateTo: string | null;
  totals: { clicks: number; impressions: number } | null;
};

export type GscQueryFlag = GscRow & { reasons: string[] };

export type GscComparison = {
  clicksDelta: number;
  impressionsDelta: number;
  ctrCurrent: number | null;
  ctrPrevious: number | null;
  positionCurrent: number | null;
  positionPrevious: number | null;
};

export type GscReport = {
  source: "search-console-csv";
  inventedMetrics: false;
  api: GscApiStatus;
  current: GscPeriod | null;
  previous: GscPeriod | null;
  comparison: GscComparison | null;
  commercialLowCtr: GscQueryFlag[];
  nearFirstPage: GscQueryFlag[];
  notes: string[];
};

const EXPECTED: GscFileKind[] = ["queries", "pages", "devices", "countries", "dates"];

const COMMERCIAL =
  /wulkaniz|opon|felg|wyważ|wywaz|przebic|mechanik|olej|hamulc|klock|tarcz|diagnost|serwis|geometr|klimatyz|zawiesz/i;

/** Analysis rules, not measured site results. */
export const GSC_LOW_CTR_MAX = 0.03;
export const GSC_LOW_CTR_MIN_IMPRESSIONS = 20;
export const GSC_NEAR_PAGE_MIN = 8;
export const GSC_NEAR_PAGE_MAX = 20;

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function detectDelimiter(header: string): "," | ";" | "\t" {
  const counts: ["," | ";" | "\t", number][] = [
    [",", (header.match(/,/g) ?? []).length],
    [";", (header.match(/;/g) ?? []).length],
    ["\t", (header.match(/\t/g) ?? []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

function parseCsv(text: string): string[][] {
  const clean = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!clean) return [];
  const delimiter = detectDelimiter(clean.split("\n")[0] ?? "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    if (quoted) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += char;
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (char === "\n") {
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function normalHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function columnIndex(headers: string[], names: string[]): number {
  const normalized = headers.map(normalHeader);
  return normalized.findIndex((header) => names.some((name) => header === name || header.includes(name)));
}

function parseNumber(raw: string): number | null {
  const text = raw.trim().replace(/\s/g, "").replace("%", "").replace(",", ".");
  if (!text) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function parseCtr(raw: string): number | null {
  const value = parseNumber(raw);
  if (value == null) return null;
  return raw.includes("%") || value > 1 ? value / 100 : value;
}

export function classifyGscFile(fileName: string): GscFileKind {
  const name = normalHeader(fileName);
  if (name.includes("quer") || name.includes("zapyt")) return "queries";
  if (name.includes("page") || name.includes("stron")) return "pages";
  if (name.includes("device") || name.includes("urzad")) return "devices";
  if (name.includes("countr") || name.includes("kraj")) return "countries";
  if (name.includes("date") || name.includes("chart") || name.includes("dane")) return "dates";
  return "unknown";
}

function kindFromHeaders(headers: string[], fallback: GscFileKind): GscFileKind {
  const header = headers.map(normalHeader).join(" | ");
  if (header.includes("query") || header.includes("zapytanie")) return "queries";
  if (header.includes("page") || header.includes("strona")) return "pages";
  if (header.includes("device") || header.includes("urzadzenie")) return "devices";
  if (header.includes("country") || header.includes("kraj")) return "countries";
  if (header.includes("date") || header === "data" || header.startsWith("data |")) return "dates";
  return fallback;
}

export function parseGscCsv(fileName: string, text: string): GscTable {
  const table = parseCsv(text);
  if (table.length < 2) return { kind: classifyGscFile(fileName), fileName, rows: [] };
  const headers = table[0];
  const kind = kindFromHeaders(headers, classifyGscFile(fileName));
  const keyIndex = columnIndex(headers, [
    "query",
    "zapytanie",
    "najwazniejsze zapytania",
    "page",
    "strona",
    "url",
    "device",
    "urzadzenie",
    "country",
    "kraj",
    "date",
    "data",
  ]);
  const clicksIndex = columnIndex(headers, ["clicks", "klikniecia"]);
  const impressionsIndex = columnIndex(headers, ["impressions", "wyswietlenia"]);
  const ctrIndex = columnIndex(headers, ["ctr"]);
  const positionIndex = columnIndex(headers, ["position", "pozycja"]);
  if (keyIndex < 0 || clicksIndex < 0 || impressionsIndex < 0 || ctrIndex < 0 || positionIndex < 0) {
    return { kind, fileName, rows: [] };
  }
  const rows: GscRow[] = [];
  for (const line of table.slice(1)) {
    const key = (line[keyIndex] ?? "").trim();
    const clicks = parseNumber(line[clicksIndex] ?? "");
    const impressions = parseNumber(line[impressionsIndex] ?? "");
    const ctr = parseCtr(line[ctrIndex] ?? "");
    const position = parseNumber(line[positionIndex] ?? "");
    if (!key || clicks == null || impressions == null || ctr == null || position == null) continue;
    rows.push({ key, clicks, impressions, ctr, position });
  }
  return { kind, fileName, rows };
}

function emptyPeriod(): GscPeriod {
  return {
    files: [],
    missing: [...EXPECTED],
    queries: [],
    pages: [],
    devices: [],
    countries: [],
    dates: [],
    dateFrom: null,
    dateTo: null,
    totals: null,
  };
}

export function periodFromTables(tables: GscTable[]): GscPeriod | null {
  if (tables.length === 0) return null;
  const period = emptyPeriod();
  for (const table of tables) {
    period.files.push({ kind: table.kind, fileName: table.fileName, rows: table.rows.length });
    if (table.kind === "unknown") continue;
    period[table.kind] = table.rows;
  }
  period.missing = EXPECTED.filter((kind) => !tables.some((table) => table.kind === kind && table.rows.length > 0));
  const dated = period.dates.map((row) => row.key).filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort();
  period.dateFrom = dated[0] ?? null;
  period.dateTo = dated[dated.length - 1] ?? null;
  const basis = period.dates.length > 0 ? period.dates : period.queries;
  if (basis.length === 0) {
    period.totals = null;
    return period;
  }
  period.totals = {
    clicks: basis.reduce((sum, row) => sum + row.clicks, 0),
    impressions: basis.reduce((sum, row) => sum + row.impressions, 0),
  };
  return period;
}

function weightedPosition(rows: GscRow[]): number | null {
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  if (impressions <= 0) return null;
  return rows.reduce((sum, row) => sum + row.position * row.impressions, 0) / impressions;
}

export function comparePeriods(current: GscPeriod, previous: GscPeriod | null): GscComparison | null {
  if (!previous || !current.totals || !previous.totals) return null;
  const currentCtr = current.totals.impressions > 0 ? current.totals.clicks / current.totals.impressions : null;
  const previousCtr = previous.totals.impressions > 0 ? previous.totals.clicks / previous.totals.impressions : null;
  const currentRows = current.dates.length > 0 ? current.dates : current.queries;
  const previousRows = previous.dates.length > 0 ? previous.dates : previous.queries;
  return {
    clicksDelta: current.totals.clicks - previous.totals.clicks,
    impressionsDelta: current.totals.impressions - previous.totals.impressions,
    ctrCurrent: currentCtr,
    ctrPrevious: previousCtr,
    positionCurrent: weightedPosition(currentRows),
    positionPrevious: weightedPosition(previousRows),
  };
}

export function flagQueries(rows: GscRow[]): { commercialLowCtr: GscQueryFlag[]; nearFirstPage: GscQueryFlag[] } {
  const commercialLowCtr: GscQueryFlag[] = [];
  const nearFirstPage: GscQueryFlag[] = [];
  for (const row of rows) {
    if (!COMMERCIAL.test(row.key)) continue;
    if (row.impressions >= GSC_LOW_CTR_MIN_IMPRESSIONS && row.ctr < GSC_LOW_CTR_MAX) {
      commercialLowCtr.push({ ...row, reasons: ["commercial", "low_ctr"] });
    }
    if (row.impressions > 0 && row.position >= GSC_NEAR_PAGE_MIN && row.position <= GSC_NEAR_PAGE_MAX) {
      nearFirstPage.push({ ...row, reasons: ["commercial", "position_8_to_20"] });
    }
  }
  commercialLowCtr.sort((a, b) => b.impressions - a.impressions);
  nearFirstPage.sort((a, b) => a.position - b.position);
  return { commercialLowCtr, nearFirstPage };
}

export function buildGscReport(input: {
  env: Record<string, string | undefined>;
  current: GscTable[];
  previous?: GscTable[];
}): GscReport {
  const api = describeSearchConsoleAccess(input.env);
  const current = periodFromTables(input.current);
  const previous = periodFromTables(input.previous ?? []);
  const flags = flagQueries(current?.queries ?? []);
  const notes = [
    "Metryki pochodzą wyłącznie z komórek CSV. Brak pliku oznacza brak wymiaru, a nie zero.",
    `Niski CTR: zapytanie handlowe, wyświetlenia ≥ ${GSC_LOW_CTR_MIN_IMPRESSIONS}, CTR < ${GSC_LOW_CTR_MAX}.`,
    `Blisko pierwszej strony: pozycja ${GSC_NEAR_PAGE_MIN}–${GSC_NEAR_PAGE_MAX}.`,
  ];
  if (!current) notes.push("Nie przekazano plików bieżącego okresu.");
  return {
    source: "search-console-csv",
    inventedMetrics: false,
    api,
    current,
    previous,
    comparison: current ? comparePeriods(current, previous) : null,
    commercialLowCtr: flags.commercialLowCtr,
    nearFirstPage: flags.nearFirstPage,
    notes,
  };
}
