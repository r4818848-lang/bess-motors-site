/**
 * Import a manual Google Search Console CSV export.
 *
 * Export from Performance → Export:
 *   queries.csv, pages.csv, countries.csv, devices.csv, dates.csv
 * Put the current period in one folder and the previous period in another.
 *
 *   npm run seo:gsc -- --current data/gsc/current --previous data/gsc/previous --out data/gsc/baseline.json
 *
 * The script does not call the Search Console API and does not invent metrics.
 * A baseline file is written only when the current folder has at least one data row.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { buildGscReport, parseGscCsv, type GscTable } from "../src/lib/gsc-import";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function readDir(dir: string | undefined): GscTable[] {
  if (!dir || !existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(".csv"))
    .map((name) => parseGscCsv(name, readFileSync(join(dir, name), "utf8")));
}

const currentDir = arg("--current");
const previousDir = arg("--previous");
const out = arg("--out");
const report = buildGscReport({
  env: process.env,
  current: readDir(currentDir),
  previous: readDir(previousDir),
});

const json = JSON.stringify(report, null, 2);
if (out) {
  const rows = report.current?.files.reduce((sum, file) => sum + file.rows, 0) ?? 0;
  if (rows === 0) {
    console.error("Baseline not written: the current folder has no Search Console rows.");
    process.stdout.write(`${json}\n`);
    process.exitCode = 2;
  } else {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${json}\n`);
    console.log(`Wrote ${out}`);
  }
} else {
  process.stdout.write(`${json}\n`);
}
