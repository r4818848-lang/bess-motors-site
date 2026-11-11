import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  buildGscReport,
  describeSearchConsoleAccess,
  parseGscCsv,
  type GscTable,
} from "../src/lib/gsc-import";

const fixture = join(process.cwd(), "scripts/fixtures/gsc");

function readSet(name: string): GscTable[] {
  const dir = join(fixture, name);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".csv"))
    .map((file) => parseGscCsv(file, readFileSync(join(dir, file), "utf8")));
}

const empty = describeSearchConsoleAccess({});
assert.equal(empty.api, "unavailable");
assert.deepEqual(empty.configuredNames, []);

const named = describeSearchConsoleAccess({ GSC_SITE_URL: "https://www.bess-motors.com/" });
assert.deepEqual(named.configuredNames, ["GSC_SITE_URL"]);
assert.equal(JSON.stringify(named).includes("bess-motors.com"), false);

const report = buildGscReport({
  env: {},
  current: readSet("current"),
  previous: readSet("previous"),
});
assert.equal(report.inventedMetrics, false);
assert.equal(report.current?.totals?.clicks, 20);
assert.equal(report.current?.dateFrom, "2026-10-01");
assert.equal(report.current?.dateTo, "2026-10-02");
assert.equal(report.comparison?.clicksDelta, 14);
assert.ok(report.commercialLowCtr.some((row) => row.key === "wulkanizacja warszawa"));
assert.equal(report.commercialLowCtr.some((row) => row.key === "pogoda warszawa"), false);
assert.ok(report.nearFirstPage.some((row) => row.key === "wymiana oleju warszawa"));
assert.equal(report.nearFirstPage.some((row) => row.key === "mechanik warszawa włochy"), false);

const noFiles = buildGscReport({ env: {}, current: [] });
assert.equal(noFiles.current, null);
assert.equal(noFiles.comparison, null);
assert.deepEqual(noFiles.commercialLowCtr, []);

console.log("gsc import ok");
