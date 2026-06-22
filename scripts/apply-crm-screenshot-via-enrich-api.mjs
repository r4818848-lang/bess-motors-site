/**
 * Apply KNOWN_CRM_SCREENSHOTS via production enrich-screenshot API (no Supabase keys).
 * Usage: npx tsx scripts/apply-crm-screenshot-via-enrich-api.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createCanvas } from "@napi-rs/canvas";

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

const API_BASE = (process.env.CRM_API_BASE || "https://www.bess-motors.com").replace(
  /\/$/,
  ""
);

const { KNOWN_CRM_SCREENSHOTS } = await import(
  "../src/lib/motowarsztat-crm-screenshot-parser.ts"
);

function orderLabelPng(orderNumber) {
  const canvas = createCanvas(1200, 400);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1200, 400);
  ctx.fillStyle = "#000000";
  ctx.font = "bold 72px Arial";
  ctx.fillText(orderNumber, 40, 200);
  ctx.font = "36px Arial";
  ctx.fillText("Задачи и товары / Zadania i towary", 40, 300);
  return canvas.toBuffer("image/png");
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

async function enrichOne(token, orderNumber) {
  const png = orderLabelPng(orderNumber);
  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), `${orderNumber}.png`);
  form.append("apply", "true");

  const res = await fetch(`${API_BASE}/api/crm/work-orders/enrich-screenshot`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${orderNumber}: ${res.status} ${text.slice(0, 200)}`);
  }
  if (!res.ok || !data.ok) {
    throw new Error(`${orderNumber}: ${data.error || res.status}`);
  }
  return data.result;
}

async function main() {
  const token = await staffLogin();
  const results = [];

  for (const snapshot of Object.values(KNOWN_CRM_SCREENSHOTS)) {
    try {
      const result = await enrichOne(token, snapshot.orderNumber);
      results.push({
        order: snapshot.orderNumber,
        status: "ok",
        updates: result?.updates ?? [],
        warnings: result?.warnings ?? [],
      });
    } catch (e) {
      results.push({
        order: snapshot.orderNumber,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  for (const r of results) {
    console.log("\n", r.order, r.status);
    if (r.error) console.log("  error:", r.error);
    if (r.updates?.length) {
      for (const u of r.updates) {
        console.log(`  + ${u.kind} «${u.name}»: ${u.fields.join(", ")}`);
      }
    }
    if (r.warnings?.length) console.log("  warnings:", r.warnings.join("; "));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
