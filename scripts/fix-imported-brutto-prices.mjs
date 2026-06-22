/**
 * One-time: fix work orders imported before brutto→net storage fix.
 * PDF brutto was saved directly in net price fields — divide by VAT once.
 * Usage: npx tsx scripts/fix-imported-brutto-prices.mjs
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

const { grossToNet } = await import("../src/lib/crm-display-price.ts");
const { cloudMutateCrmStore } = await import(
  "../src/lib/server/crm-cloud-mutate.ts"
);

function isImportedOrder(order) {
  return /import\s*(mw|kosztorys|pdf)/i.test(order.internalNotes ?? "");
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  let fixed = 0;
  const put = await cloudMutateCrmStore((db) => {
    const vatRate = db.settings.vatRate ?? 23;
    for (const order of db.workOrders) {
      if (!isImportedOrder(order) || !order.vatEnabled) continue;

      let touched = false;
      for (const s of order.services) {
        if (s.price > 0) {
          const next = grossToNet(s.price, vatRate);
          if (Math.abs(next - s.price) > 0.001) {
            s.price = next;
            touched = true;
          }
        }
      }
      for (const p of order.parts) {
        if (p.sellPrice > 0) {
          const next = grossToNet(p.sellPrice, vatRate);
          if (Math.abs(next - p.sellPrice) > 0.001) {
            p.sellPrice = next;
            touched = true;
          }
        }
        if (p.purchasePrice > 0) {
          const next = grossToNet(p.purchasePrice, vatRate);
          if (Math.abs(next - p.purchasePrice) > 0.001) {
            p.purchasePrice = next;
            touched = true;
          }
        }
      }
      if (touched) {
        fixed++;
        console.log(`Fixed ${order.number}`);
      }
    }
    return fixed > 0 ? `fixed_${fixed}` : false;
  });

  if (!put.ok) {
    console.error("Cloud update failed:", put.error);
    process.exit(1);
  }
  console.log(fixed ? `Done. Fixed ${fixed} order(s).` : "No imported orders needed fixing.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
