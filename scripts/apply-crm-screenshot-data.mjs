/**
 * Apply purchase prices + part numbers from CRM screenshots to existing orders.
 * Usage: npx tsx scripts/apply-crm-screenshot-data.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const { KNOWN_CRM_SCREENSHOTS } = await import(
  "../src/lib/motowarsztat-crm-screenshot-parser.ts"
);
const {
  enrichWorkOrderFromScreenshot,
  findWorkOrderByNumber,
} = await import("../src/lib/enrich-work-order-from-screenshot.ts");
const { cloudMutateCrmStore } = await import(
  "../src/lib/server/crm-cloud-mutate.ts"
);

const API_BASE = (process.env.CRM_API_BASE || "https://www.bess-motors.com").replace(
  /\/$/,
  ""
);

function hasSupabaseKeys() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function staffLogin() {
  const phone = process.env.ADMIN_PHONE?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!phone || !password) {
    throw new Error("Missing ADMIN_PHONE or ADMIN_PASSWORD in .env.local");
  }

  const res = await fetch(`${API_BASE}/api/auth/staff-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok || !data.token) {
    throw new Error(`staff login failed: ${data.error || res.status}`);
  }
  return data.token;
}

function applySnapshotsToDb(db) {
  const results = [];

  for (const snapshot of Object.values(KNOWN_CRM_SCREENSHOTS)) {
    const order = findWorkOrderByNumber(db, snapshot.orderNumber);
    if (!order) {
      results.push({ order: snapshot.orderNumber, status: "not_found" });
      continue;
    }

    const vatRate = db.settings.vatRate ?? 23;
    const enrichResult = enrichWorkOrderFromScreenshot(order, snapshot, vatRate);
    order.updatedAt = new Date().toISOString();
    results.push({
      order: snapshot.orderNumber,
      status: "ok",
      updates: enrichResult.updates ?? [],
      warnings: enrichResult.warnings ?? [],
    });
  }

  return results;
}

async function applyViaSupabase() {
  const results = [];

  for (const snapshot of Object.values(KNOWN_CRM_SCREENSHOTS)) {
    let enrichResult = null;
    const put = await cloudMutateCrmStore((db) => {
      const order = findWorkOrderByNumber(db, snapshot.orderNumber);
      if (!order) return false;
      const vatRate = db.settings.vatRate ?? 23;
      enrichResult = enrichWorkOrderFromScreenshot(order, snapshot, vatRate);
      order.updatedAt = new Date().toISOString();
      return order.number;
    });

    if (!put.ok) {
      results.push({ order: snapshot.orderNumber, status: "not_found" });
      continue;
    }

    results.push({
      order: snapshot.orderNumber,
      status: "ok",
      updates: enrichResult?.updates ?? [],
      warnings: enrichResult?.warnings ?? [],
    });
  }

  return results;
}

async function applyViaProductionApi() {
  const token = await staffLogin();

  const batchRes = await fetch(`${API_BASE}/api/crm/work-orders/apply-known-screenshots`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const batchText = await batchRes.text();
  let batch;
  try {
    batch = JSON.parse(batchText);
  } catch {
    throw new Error(
      `apply-known-screenshots failed (${batchRes.status}): ${batchText.slice(0, 200)}`
    );
  }
  if (!batchRes.ok || !batch.ok) {
    throw new Error(`apply-known-screenshots failed: ${batch.error || batchRes.status}`);
  }

  return batch.results ?? [];
}

function printResults(results) {
  for (const r of results) {
    console.log("\n", r.order, r.status);
    if (r.updates?.length) {
      for (const u of r.updates) {
        console.log(`  + ${u.kind} «${u.name}»: ${u.fields.join(", ")}`);
      }
    }
    if (r.warnings?.length) console.log("  warnings:", r.warnings.join("; "));
  }
}

async function main() {
  const results = hasSupabaseKeys()
    ? await applyViaSupabase()
    : await applyViaProductionApi();

  printResults(results);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
