/**
 * Unit checks for Inter Cars August 2026 import parser.
 * Run: node scripts/test-inter-cars-import.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "imports", "Inter_Cars_svodnyj_otchet_avgust_2026.xlsx");

const {
  INTER_CARS_SOURCE_SHEET,
  INTER_CARS_AUGUST_2026_CONTROLS,
  compareInterCarsTotals,
  parseInterCarsAllPositionsSheet,
  applyInterCarsImportToDatabase,
  verifyInterCarsSellEqualsPurchase,
  collectInterCarsImportKeys,
} = await import("../src/lib/inter-cars-import.ts");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function readRows() {
  assert(fs.existsSync(FILE), `Missing test file: ${FILE}`);
  const wb = XLSX.readFile(FILE);
  const ws = wb.Sheets[INTER_CARS_SOURCE_SHEET];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function testParseTotals() {
  const parsed = parseInterCarsAllPositionsSheet(readRows(), "2026-08");
  const mismatches = compareInterCarsTotals(parsed.totals, INTER_CARS_AUGUST_2026_CONTROLS);
  assert(parsed.issues.length === 0, `Unexpected issues: ${parsed.issues.length}`);
  assert(mismatches.length === 0, `Total mismatches: ${mismatches.join("; ")}`);
  assert(parsed.parts.length === 112, `parts count ${parsed.parts.length}`);
  assert(parsed.consumables.length === 26, `consumables count ${parsed.consumables.length}`);
  const sellErrors = verifyInterCarsSellEqualsPurchase(parsed.parts);
  assert(sellErrors.length === 0, sellErrors.join("; "));
  console.log("✓ parse totals and counts");
  return parsed;
}

function testFkReturnRow(parsed) {
  const fk = parsed.parsedRows.find((r) => r.meta.docType === "FK");
  assert(fk, "FK row missing");
  assert(fk.qty < 0, "FK qty should be negative");
  assert(fk.meta.sumBrutto < 0, "FK sum brutto should be negative");
  assert(fk.purchaseBrutto === fk.sellBrutto, "FK sell should equal purchase");
  assert(fk.meta.correctedDoc, "FK should link corrected document");
  console.log("✓ FK return row semantics");
}

function testIdempotency(parsed) {
  const db = { monthlyParts: [], monthlyConsumables: [] };
  const first = applyInterCarsImportToDatabase(db, parsed);
  assert(first.addedParts === 112, `first parts ${first.addedParts}`);
  assert(first.addedConsumables === 26, `first cons ${first.addedConsumables}`);
  const second = applyInterCarsImportToDatabase(db, parsed);
  assert(second.addedParts === 0, "second parts should be 0");
  assert(second.addedConsumables === 0, "second cons should be 0");
  assert(second.skippedDuplicates === 138, `skipped ${second.skippedDuplicates}`);
  assert(collectInterCarsImportKeys(db).size === 138, "import keys count");
  console.log("✓ idempotent apply");
}

function testSummarySheetNotImported() {
  const wb = XLSX.readFile(FILE);
  const summaryRows = XLSX.utils.sheet_to_json(wb.Sheets["Сводка"], { defval: "" });
  const partsRows = XLSX.utils.sheet_to_json(wb.Sheets["Запчасти"], { defval: "" });
  const parsed = parseInterCarsAllPositionsSheet(readRows(), "2026-08");
  assert(summaryRows.length > 0, "summary sheet exists");
  assert(partsRows.length > 0, "parts sheet exists");
  assert(parsed.totals.movementRows === 138, "only main sheet imported");
  console.log("✓ only «Все позиции» used for import");
}

function main() {
  const parsed = testParseTotals();
  testFkReturnRow(parsed);
  testIdempotency(parsed);
  testSummarySheetNotImported();
  console.log("\nAll Inter Cars import tests passed.");
}

main();
