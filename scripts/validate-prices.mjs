#!/usr/bin/env node
/**
 * Price consistency checks vs TZ-confirmed public tariffs.
 * Run: node scripts/validate-prices.mjs
 */
import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

/** Expect after site −15% promo where applicable; tires/AC excluded from promo */
const EXPECTED = {
  tire_change_r13: { price: 200, category: "tires" },
  tire_change_r14: { price: 200, category: "tires" },
  tire_change_r15: { price: 200, category: "tires" },
  tire_change_r16: { price: 200, category: "tires" },
  tire_change_r17: { price: 200, category: "tires" },
  tire_change_r18: { price: 260, category: "tires" },
  tire_change_r19: { price: 300, category: "tires" },
  tire_change_r20: { price: 350, category: "tires" },
  puncture_repair: { price: 60, category: "tires" },
  ac_r1234yf: { price: 100, category: "ac" },
  ac_r134a: { price: 50, category: "ac" },
  ac_hookup: { price: 80, category: "ac" },
};

const errors = [];
const warnings = [];

async function loadPriceModule() {
  // Prefer compiled via tsx if available
  try {
    const mod = await import(
      pathToFileURL(path.join(root, "src/lib/price-list.ts")).href
    );
    return mod;
  } catch {
    const require = createRequire(import.meta.url);
    // Fallback: dynamic import through next/tsx not available — parse via regex on source
    return null;
  }
}

function parseCatalogFromSource(src) {
  const items = [];
  const re =
    /\{\s*id:\s*"([^"]+)"[\s\S]*?categoryId:\s*"([^"]+)"[\s\S]*?basePrice:\s*(\d+)/g;
  let m;
  while ((m = re.exec(src))) {
    items.push({ id: m[1], categoryId: m[2], basePrice: Number(m[3]) });
  }
  return items;
}

import fs from "fs";

const src = fs.readFileSync(path.join(root, "src/lib/price-list.ts"), "utf8");
const items = parseCatalogFromSource(src);
const byId = Object.fromEntries(items.map((i) => [i.id, i]));

for (const [id, exp] of Object.entries(EXPECTED)) {
  const item = byId[id];
  if (!item) {
    // try aliases / alternate ids
    const alt = items.find((i) => i.id.includes(id.replace("tire_", "")) || i.id === id);
    if (!alt) {
      errors.push(`Missing price item: ${id}`);
      continue;
    }
  }
  const row = byId[id];
  if (!row) continue;
  if (row.basePrice !== exp.price) {
    errors.push(`${id}: expected ${exp.price} zł, got ${row.basePrice} zł`);
  }
  if (row.categoryId !== exp.category) {
    warnings.push(`${id}: category ${row.categoryId} (expected ${exp.category})`);
  }
}

// Oil labour — promo item may be oil_change / oil_filter
const oilIds = ["oil_change", "oil_filter", "oil_labour", "engine_oil"];
const oilHits = items.filter((i) => oilIds.includes(i.id) || /oil.*change|wymiana.*olej/i.test(i.id));
if (!oilHits.length) {
  warnings.push("Could not locate oil labour row by id — check oil-brake-promo separately");
}

// OFF services must not appear
for (const bad of ["egr_off", "dpf_off", "adblue_off", "egr-off", "dpf-off"]) {
  if (byId[bad]) errors.push(`Forbidden OFF service still in catalog: ${bad}`);
}
if (/EGR\s*OFF|DPF\s*OFF|AdBlue\s*OFF/i.test(src) && !/nie publikujemy/i.test(src)) {
  warnings.push("OFF advertising strings found in price-list.ts — verify comments only");
}

// Chip category exists but should be public-hidden
if (!/PUBLIC_HIDDEN_CATEGORY_IDS[\s\S]*chip/.test(src)) {
  errors.push("PUBLIC_HIDDEN_CATEGORY_IDS must include chip");
}

// Packages savings threshold
const pkgSrc = fs.readFileSync(path.join(root, "src/lib/service-packages.ts"), "utf8");
if (!/>= 20/.test(pkgSrc) && !/>=20/.test(pkgSrc)) {
  warnings.push("service-packages public filter should require ≥20 zł savings");
}

console.log(`Checked ${items.length} price rows`);
if (warnings.length) {
  console.log("Warnings:");
  for (const w of warnings) console.log("  ⚠", w);
}
if (errors.length) {
  console.error("FAILED:");
  for (const e of errors) console.error("  ✗", e);
  process.exit(1);
}
console.log("OK — TZ tire/AC/puncture tariffs match catalog");
process.exit(0);
