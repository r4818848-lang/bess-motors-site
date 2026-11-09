export type BookingMode = "AUTO" | "APPROVAL" | "MANUAL";

export type Operation = {
  operationCode: string;
  operationNameRu: string;
  operationNamePl: string;
  category: string;
  baseLaborHours: number | null;
  minLaborHours: number | null;
  maxLaborHours: number | null;
  requiredResources: string[];
  bookingMode: BookingMode;
  overlapGroup: string;
  vehicleConditions: string;
  source: string;
  updatedAt: string;
  referenceCalendarMinutes: number | null;
  isActive: boolean;
  version: number;
};

const MODES = new Set<BookingMode>(["AUTO", "APPROVAL", "MANUAL"]);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\n") {
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (char !== "\r") cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }
  return rows;
}

function decimal(value: string | undefined): number | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number < 0) return null;
  return number;
}

export function parseOperationCatalog(csv: string): Operation[] {
  const [header, ...rows] = parseCsv(csv.replace(/^\uFEFF/, ""));
  if (!header || header[0] !== "operation_code") {
    throw new Error("operation catalog header");
  }
  return rows.map((row) => {
    const mode = (row[8] ?? "").trim() as BookingMode;
    if (!MODES.has(mode)) throw new Error(`booking mode ${row[0]}`);
    const code = (row[0] ?? "").trim();
    if (!code) throw new Error("operation code");
    return {
      operationCode: code,
      operationNameRu: (row[1] ?? "").trim(),
      operationNamePl: (row[2] ?? "").trim(),
      category: (row[3] ?? "").trim(),
      baseLaborHours: decimal(row[4]),
      minLaborHours: decimal(row[5]),
      maxLaborHours: decimal(row[6]),
      requiredResources: (row[7] ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      bookingMode: mode,
      overlapGroup: (row[9] ?? "").trim(),
      vehicleConditions: (row[10] ?? "").trim(),
      source: (row[11] ?? "").trim(),
      updatedAt: (row[12] ?? "").trim(),
      referenceCalendarMinutes: decimal(row[13]),
      isActive: true,
      version: 1,
    };
  });
}

export function assertUniqueCatalog(operations: Operation[]): void {
  const seen = new Set<string>();
  for (const operation of operations) {
    if (seen.has(operation.operationCode)) throw new Error(`duplicate ${operation.operationCode}`);
    seen.add(operation.operationCode);
  }
}
