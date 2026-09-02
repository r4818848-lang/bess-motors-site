import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const xlsxPath = path.join(ROOT, "imports", "Inter_Cars_svodnyj_otchet_avgust_2026.xlsx");
const outPath = path.join(ROOT, "src", "data", "inter-cars-august-2026.json");

const wb = XLSX.readFile(xlsxPath, { cellDates: false });
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Все позиции"], { defval: "" });
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(rows), "utf8");
console.log(`Wrote ${rows.length} rows → ${outPath} (${fs.statSync(outPath).size} bytes)`);
