/**
 * Import Inter Cars monthly report (sheet «Все позиции») into CRM monthlyParts / monthlyConsumables.
 *
 * Usage:
 *   node scripts/import-inter-cars-monthly.mjs --dry-run
 *   node scripts/import-inter-cars-monthly.mjs
 *   node scripts/import-inter-cars-monthly.mjs --file imports/custom.xlsx --month 2026-08
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnvFile(name) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const {
  INTER_CARS_SOURCE_SHEET,
  INTER_CARS_AUGUST_2026_CONTROLS,
  compareInterCarsTotals,
  parseInterCarsAllPositionsSheet,
  applyInterCarsImportToDatabase,
  summarizeInterCarsImportForDisplay,
  verifyInterCarsSellEqualsPurchase,
} = await import("../src/lib/inter-cars-import.ts");
const { cloudMutateCrmStore } = await import("../src/lib/server/crm-cloud-mutate.ts");

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    file: path.join(ROOT, "imports", "Inter_Cars_svodnyj_otchet_avgust_2026.xlsx"),
    month: "2026-08",
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--file" && argv[i + 1]) opts.file = path.resolve(argv[++i]);
    else if (a === "--month" && argv[i + 1]) opts.month = argv[++i];
    else if (a === "--help" || a === "-h") {
      console.log(`Usage:
  node scripts/import-inter-cars-monthly.mjs [--dry-run] [--file path] [--month YYYY-MM]

Default file: imports/Inter_Cars_svodnyj_otchet_avgust_2026.xlsx
Default month: 2026-08`);
      process.exit(0);
    }
  }
  return opts;
}

function readAllPositionsSheet(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const wb = XLSX.readFile(filePath, { cellDates: false });
  if (!wb.SheetNames.includes(INTER_CARS_SOURCE_SHEET)) {
    throw new Error(
      `Sheet "${INTER_CARS_SOURCE_SHEET}" not found. Available: ${wb.SheetNames.join(", ")}`
    );
  }
  const ws = wb.Sheets[INTER_CARS_SOURCE_SHEET];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function printIssues(issues, limit = 20) {
  if (!issues.length) return;
  console.log(`\nПропущенные / ошибочные строки (${issues.length}):`);
  for (const issue of issues.slice(0, limit)) {
    console.log(`  • строка ${issue.rowIndex}: ${issue.reason}`);
  }
  if (issues.length > limit) {
    console.log(`  … ещё ${issues.length - limit}`);
  }
}

function printControlCheck(mismatches) {
  if (!mismatches.length) {
    console.log("\n✓ Контрольные итоги совпадают с эталоном августа 2026.");
    return true;
  }
  console.error("\n✗ Контрольные итоги НЕ совпадают:");
  for (const m of mismatches) console.error(`  • ${m}`);
  return false;
}

async function main() {
  const opts = parseArgs(process.argv);
  console.log(`Inter Cars import — ${opts.dryRun ? "DRY RUN" : "APPLY"}`);
  console.log(`File: ${opts.file}`);
  console.log(`Month: ${opts.month}`);
  console.log(`Sheet: ${INTER_CARS_SOURCE_SHEET}\n`);

  const rawRows = readAllPositionsSheet(opts.file);
  const parsed = parseInterCarsAllPositionsSheet(rawRows, opts.month);
  const mismatches = compareInterCarsTotals(parsed.totals, INTER_CARS_AUGUST_2026_CONTROLS);
  const sellErrors = verifyInterCarsSellEqualsPurchase(parsed.parts);

  console.log(summarizeInterCarsImportForDisplay(parsed));

  if (sellErrors.length) {
    console.error("\n✗ Ошибки цены продажи ≠ закупки:");
    for (const e of sellErrors.slice(0, 10)) console.error(`  • ${e}`);
    process.exit(1);
  }

  printIssues(parsed.issues);

  const controlsOk = printControlCheck(mismatches);
  if (!controlsOk) {
    console.error(
      "\nИмпорт остановлен: сначала исправьте расхождения в файле или парсере."
    );
    process.exit(1);
  }

  if (opts.dryRun) {
    console.log("\nDry-run завершён. База не изменена.");
    console.log(
      `Готово к импорту: ${parsed.parts.length} запчастей, ${parsed.consumables.length} расходников.`
    );
    return;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("\nMissing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  let applyResult = null;
  const put = await cloudMutateCrmStore(async (db) => {
    applyResult = applyInterCarsImportToDatabase(db, parsed, opts.month);
    return `inter-cars:${applyResult.addedParts}+${applyResult.addedConsumables}`;
  });

  if (!put.ok) {
    console.error(`\n✗ Cloud import failed: ${put.error}`);
    process.exit(1);
  }

  console.log("\n" + summarizeInterCarsImportForDisplay(parsed, applyResult));
  console.log("\n✓ Импорт завершён.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
