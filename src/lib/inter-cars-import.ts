/**
 * Inter Cars monthly report import — parses sheet «Все позиции» into monthlyParts / monthlyConsumables.
 */

import type { MonthlyConsumableEntry } from "./monthly-consumables";
import { computeMonthlyConsumablesTotals } from "./monthly-consumables";
import {
  INTER_CARS_CURRENCY,
  INTER_CARS_SUPPLIER,
  type InterCarsAccountCategory,
  type InterCarsImportMeta,
} from "./inter-cars-import-meta";
import {
  computeMonthlyPartsTotals,
  type MonthlyPartEntry,
} from "./monthly-parts";
import type { Database } from "./store";

export {
  INTER_CARS_CURRENCY,
  INTER_CARS_SUPPLIER,
  type InterCarsAccountCategory,
  type InterCarsImportMeta,
} from "./inter-cars-import-meta";

export const INTER_CARS_SOURCE_SHEET = "Все позиции";
export const INTER_CARS_IMPORT_MONTH = "2026-08";

export type InterCarsRawRow = Record<string, unknown>;

export type ParsedInterCarsRow = {
  meta: InterCarsImportMeta;
  name: string;
  partNumber: string;
  qty: number;
  purchaseNetto: number;
  purchaseBrutto: number;
  sellNetto: number;
  sellBrutto: number;
  createdAt: string;
};

export type InterCarsControlTotals = {
  uniqueDocuments: number;
  movementRows: number;
  partsRows: number;
  consumableRows: number;
  partsBrutto: number;
  consumablesBrutto: number;
  totalBrutto: number;
  purchasesBrutto: number;
  correctionsBrutto: number;
};

export const INTER_CARS_AUGUST_2026_CONTROLS: InterCarsControlTotals = {
  uniqueDocuments: 42,
  movementRows: 138,
  partsRows: 112,
  consumableRows: 26,
  partsBrutto: 8981.09,
  consumablesBrutto: 3842.18,
  totalBrutto: 12823.27,
  purchasesBrutto: 16494.04,
  correctionsBrutto: -3670.77,
};

export type InterCarsParseIssue = {
  rowIndex: number;
  reason: string;
  row?: InterCarsRawRow;
};

export type InterCarsParseResult = {
  parts: MonthlyPartEntry[];
  consumables: MonthlyConsumableEntry[];
  parsedRows: ParsedInterCarsRow[];
  issues: InterCarsParseIssue[];
  totals: InterCarsControlTotals;
  duplicateKeysInFile: string[];
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number.parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

/** Excel serial date → YYYY-MM-DD (UTC). */
export function excelSerialToIsoDate(serial: number): string {
  const ms = Date.UTC(1899, 11, 30) + serial * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function parseInterCarsOperationDate(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return excelSerialToIsoDate(value);
  }
  const text = asString(value);
  if (!text) return null;
  const m = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return null;
}

export function buildInterCarsImportKey(
  supplier: string,
  docNumber: string,
  lineNumber: number,
  docType: string
): string {
  return `${supplier}|${docNumber}|${lineNumber}|${docType}`;
}

function importEntryId(importKey: string, kind: "part" | "consumable"): string {
  const slug = importKey
    .replace(/[^a-zA-Z0-9|]+/g, "-")
    .replace(/\|/g, "_")
    .slice(0, 96);
  return `ic-${kind}-${slug}`;
}

export function collectInterCarsImportKeys(db: Database): Set<string> {
  const keys = new Set<string>();
  for (const p of db.monthlyParts ?? []) {
    if (p.interCars?.importKey) keys.add(p.interCars.importKey);
  }
  for (const c of db.monthlyConsumables ?? []) {
    if (c.interCars?.importKey) keys.add(c.interCars.importKey);
  }
  return keys;
}

function unitBruttoFromRow(sumBrutto: number, qty: number): number {
  return round2(Math.abs(sumBrutto) / Math.abs(qty));
}

function unitNettoFromRow(unitNettoCol: number | null, sumNetto: number, qty: number): number {
  if (unitNettoCol !== null && unitNettoCol > 0) return round2(unitNettoCol);
  return round2(Math.abs(sumNetto) / Math.abs(qty));
}

export function parseInterCarsMovementRow(
  raw: InterCarsRawRow,
  rowIndex: number,
  month = INTER_CARS_IMPORT_MONTH
): { row?: ParsedInterCarsRow; issue?: InterCarsParseIssue } {
  const docType = asString(raw["Тип"]);
  const docNumber = asString(raw["№ документа"]);
  const lineNumber = asNumber(raw["LP"]);
  const qty = asNumber(raw["Количество"]);
  const category = asString(raw["Учётная категория"]) as InterCarsAccountCategory;
  const name = asString(raw["Товар / описание"]);
  const operationDate = parseInterCarsOperationDate(raw["Дата"]);

  if (!docType || !docNumber || lineNumber === null) {
    return {
      issue: {
        rowIndex,
        reason: "Отсутствуют обязательные поля: Тип, № документа или LP",
        row: raw,
      },
    };
  }

  if (docType !== "F" && docType !== "FK") {
    return {
      issue: {
        rowIndex,
        reason: `Неизвестный тип документа: ${docType}`,
        row: raw,
      },
    };
  }

  if (category !== "Запчасть" && category !== "Расходник") {
    return {
      issue: {
        rowIndex,
        reason: `Неизвестная учётная категория: ${category || "(пусто)"}`,
        row: raw,
      },
    };
  }

  if (qty === null || qty === 0) {
    return {
      issue: {
        rowIndex,
        reason: "Количество равно нулю — строка пропущена",
        row: raw,
      },
    };
  }

  if (!name) {
    return {
      issue: { rowIndex, reason: "Пустое описание товара", row: raw },
    };
  }

  if (!operationDate) {
    return {
      issue: { rowIndex, reason: "Не удалось разобрать дату операции", row: raw },
    };
  }

  const sumNetto = asNumber(raw["Сумма netto, zł"]);
  const sumVat = asNumber(raw["VAT, zł"]);
  const sumBrutto = asNumber(raw["Сумма brutto, zł"]);
  const vatRate = asNumber(raw["VAT"]);
  const unitNettoCol = asNumber(raw["Цена netto, zł"]);

  if (sumNetto === null || sumVat === null || sumBrutto === null || vatRate === null) {
    return {
      issue: {
        rowIndex,
        reason: "Отсутствуют суммы или ставка VAT",
        row: raw,
      },
    };
  }

  const purchaseBrutto = unitBruttoFromRow(sumBrutto, qty);
  const purchaseNetto = unitNettoFromRow(unitNettoCol, sumNetto, qty);
  const sellBrutto = purchaseBrutto;
  const sellNetto = purchaseNetto;

  const importKey = buildInterCarsImportKey(
    INTER_CARS_SUPPLIER,
    docNumber,
    lineNumber,
    docType
  );

  const meta: InterCarsImportMeta = {
    supplier: INTER_CARS_SUPPLIER,
    currency: INTER_CARS_CURRENCY,
    operationDate,
    docType,
    docNumber,
    correctedDoc: asString(raw["Корректируемый документ"]) || undefined,
    lineNumber,
    manufacturer: asString(raw["Производитель"]) || undefined,
    vatRate,
    sumNetto,
    sumVat,
    sumBrutto,
    accountCategory: category,
    consumableGroup: asString(raw["Группа расходника"]) || undefined,
    wzNumber: asString(raw["№ WZ"]) || undefined,
    sourceFile: asString(raw["Файл-источник"]) || undefined,
    sourcePage: asNumber(raw["Страница"]) ?? undefined,
    importKey,
  };

  return {
    row: {
      meta,
      name,
      partNumber: meta.wzNumber ?? "",
      qty,
      purchaseNetto,
      purchaseBrutto,
      sellNetto,
      sellBrutto,
      createdAt: `${operationDate}T12:00:00.000Z`,
    },
  };
}

export function computeInterCarsTotals(rows: ParsedInterCarsRow[]): InterCarsControlTotals {
  const uniqueDocuments = new Set(rows.map((r) => r.meta.docNumber));
  let partsRows = 0;
  let consumableRows = 0;
  let partsBrutto = 0;
  let consumablesBrutto = 0;
  let purchasesBrutto = 0;
  let correctionsBrutto = 0;

  for (const r of rows) {
    const sumBrutto = r.meta.sumBrutto;
    if (r.meta.accountCategory === "Запчасть") {
      partsRows++;
      partsBrutto += sumBrutto;
    } else {
      consumableRows++;
      consumablesBrutto += sumBrutto;
    }
    if (r.meta.docType === "F") purchasesBrutto += sumBrutto;
    else if (r.meta.docType === "FK") correctionsBrutto += sumBrutto;
  }

  return {
    uniqueDocuments: uniqueDocuments.size,
    movementRows: rows.length,
    partsRows,
    consumableRows,
    partsBrutto: round2(partsBrutto),
    consumablesBrutto: round2(consumablesBrutto),
    totalBrutto: round2(partsBrutto + consumablesBrutto),
    purchasesBrutto: round2(purchasesBrutto),
    correctionsBrutto: round2(correctionsBrutto),
  };
}

export function compareInterCarsTotals(
  actual: InterCarsControlTotals,
  expected: InterCarsControlTotals = INTER_CARS_AUGUST_2026_CONTROLS
): string[] {
  const mismatches: string[] = [];
  const keys = Object.keys(expected) as (keyof InterCarsControlTotals)[];
  for (const key of keys) {
    const diff = round2(actual[key] - expected[key]);
    if (Math.abs(diff) > 0.01) {
      mismatches.push(`${key}: ожидалось ${expected[key]}, получено ${actual[key]} (Δ ${diff})`);
    }
  }
  return mismatches;
}

export function toMonthlyPartEntry(
  parsed: ParsedInterCarsRow,
  month = INTER_CARS_IMPORT_MONTH
): MonthlyPartEntry {
  return {
    id: importEntryId(parsed.meta.importKey, "part"),
    month,
    name: parsed.name,
    partNumber: parsed.partNumber,
    purchaseBrutto: parsed.purchaseBrutto,
    purchaseNetto: parsed.purchaseNetto,
    sellBrutto: parsed.sellBrutto,
    sellNetto: parsed.sellNetto,
    purchasePrice: parsed.purchaseNetto,
    sellPrice: parsed.sellNetto,
    qty: parsed.qty,
    createdAt: parsed.createdAt,
    source: "inter-cars-import",
    interCars: parsed.meta,
  };
}

export function toMonthlyConsumableEntry(
  parsed: ParsedInterCarsRow,
  month = INTER_CARS_IMPORT_MONTH
): MonthlyConsumableEntry {
  return {
    id: importEntryId(parsed.meta.importKey, "consumable"),
    month,
    name: parsed.name,
    partNumber: parsed.partNumber,
    purchaseBrutto: parsed.purchaseBrutto,
    purchaseNetto: parsed.purchaseNetto,
    qty: parsed.qty,
    createdAt: parsed.createdAt,
    source: "inter-cars-import",
    interCars: parsed.meta,
  };
}

export function parseInterCarsAllPositionsSheet(
  rawRows: InterCarsRawRow[],
  month = INTER_CARS_IMPORT_MONTH
): InterCarsParseResult {
  const parsedRows: ParsedInterCarsRow[] = [];
  const issues: InterCarsParseIssue[] = [];
  const keysInFile = new Map<string, number>();

  rawRows.forEach((raw, index) => {
    const rowIndex = index + 2;
    const { row, issue } = parseInterCarsMovementRow(raw, rowIndex, month);
    if (issue) {
      issues.push(issue);
      return;
    }
    if (!row) return;

    const prev = keysInFile.get(row.meta.importKey);
    if (prev !== undefined) {
      issues.push({
        rowIndex,
        reason: `Дубликат importKey в файле (совпадает со строкой ${prev})`,
        row: raw,
      });
      return;
    }
    keysInFile.set(row.meta.importKey, rowIndex);
    parsedRows.push(row);
  });

  const duplicateKeysInFile = issues
    .filter((i) => i.reason.startsWith("Дубликат importKey"))
    .map((i) => asString(i.row?.["№ документа"]));

  const parts = parsedRows
    .filter((r) => r.meta.accountCategory === "Запчасть")
    .map((r) => toMonthlyPartEntry(r, month));
  const consumables = parsedRows
    .filter((r) => r.meta.accountCategory === "Расходник")
    .map((r) => toMonthlyConsumableEntry(r, month));

  return {
    parts,
    consumables,
    parsedRows,
    issues,
    totals: computeInterCarsTotals(parsedRows),
    duplicateKeysInFile,
  };
}

export type InterCarsImportApplyResult = {
  addedParts: number;
  addedConsumables: number;
  skippedDuplicates: number;
  skippedKeys: string[];
};

export function applyInterCarsImportToDatabase(
  db: Database,
  parsed: InterCarsParseResult,
  month = INTER_CARS_IMPORT_MONTH
): InterCarsImportApplyResult {
  const existing = collectInterCarsImportKeys(db);
  const skippedKeys: string[] = [];
  let addedParts = 0;
  let addedConsumables = 0;

  if (!db.monthlyParts) db.monthlyParts = [];
  if (!db.monthlyConsumables) db.monthlyConsumables = [];

  for (const entry of parsed.parts) {
    const key = entry.interCars?.importKey;
    if (!key || existing.has(key)) {
      if (key) skippedKeys.push(key);
      continue;
    }
    db.monthlyParts.push(entry);
    existing.add(key);
    addedParts++;
  }

  for (const entry of parsed.consumables) {
    const key = entry.interCars?.importKey;
    if (!key || existing.has(key)) {
      if (key) skippedKeys.push(key);
      continue;
    }
    db.monthlyConsumables.push(entry);
    existing.add(key);
    addedConsumables++;
  }

  void month;
  return {
    addedParts,
    addedConsumables,
    skippedDuplicates: skippedKeys.length,
    skippedKeys,
  };
}

export function summarizeInterCarsImportForDisplay(
  parsed: InterCarsParseResult,
  apply?: InterCarsImportApplyResult
): string {
  const partsTotals = computeMonthlyPartsTotals(parsed.parts);
  const consTotals = computeMonthlyConsumablesTotals(parsed.consumables);
  const purchases = parsed.parsedRows.filter((r) => r.meta.docType === "F").length;
  const corrections = parsed.parsedRows.filter((r) => r.meta.docType === "FK").length;

  const lines = [
    "Inter Cars import summary",
    `Месяц: ${INTER_CARS_IMPORT_MONTH}`,
    `Строк движений: ${parsed.totals.movementRows}`,
    `Запчасти: ${parsed.totals.partsRows} (brutto ${parsed.totals.partsBrutto.toFixed(2)} PLN)`,
    `Расходники: ${parsed.totals.consumableRows} (brutto ${parsed.totals.consumablesBrutto.toFixed(2)} PLN)`,
    `Покупки (F): ${purchases} строк, ${parsed.totals.purchasesBrutto.toFixed(2)} PLN brutto`,
    `Корректировки/возвраты (FK): ${corrections} строк, ${parsed.totals.correctionsBrutto.toFixed(2)} PLN brutto`,
    `Итого brutto: ${parsed.totals.totalBrutto.toFixed(2)} PLN`,
    `Уникальных документов: ${parsed.totals.uniqueDocuments}`,
    `Проверка monthlyParts totals: ${partsTotals.purchaseBrutto.toFixed(2)} PLN brutto`,
    `Проверка monthlyConsumables totals: ${consTotals.purchaseBrutto.toFixed(2)} PLN brutto`,
  ];

  if (parsed.issues.length) {
    lines.push(`Пропущено/ошибок: ${parsed.issues.length}`);
  }
  if (parsed.duplicateKeysInFile.length) {
    lines.push(`Дубликаты в файле: ${parsed.duplicateKeysInFile.length}`);
  }
  if (apply) {
    lines.push(
      `Добавлено: ${apply.addedParts} запчастей, ${apply.addedConsumables} расходников`,
      `Пропущено (уже в базе): ${apply.skippedDuplicates}`
    );
  }

  return lines.join("\n");
}

/** Verify sell equals purchase for every imported part row. */
export function verifyInterCarsSellEqualsPurchase(parts: MonthlyPartEntry[]): string[] {
  const errors: string[] = [];
  for (const p of parts) {
    if (p.purchaseBrutto !== p.sellBrutto || p.purchaseNetto !== p.sellNetto) {
      errors.push(`${p.interCars?.importKey ?? p.id}: sell ≠ purchase`);
    }
    const lineBrutto = round2((p.purchaseBrutto ?? 0) * (p.qty || 1));
    const expected = round2(p.interCars?.sumBrutto ?? lineBrutto);
    if (Math.abs(lineBrutto - expected) > 0.02) {
      errors.push(
        `${p.interCars?.importKey ?? p.id}: line brutto ${lineBrutto} ≠ sum ${expected}`
      );
    }
  }
  return errors;
}
