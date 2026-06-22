/**
 * Import Motowarsztat ZL kosztorys PDFs into production CRM as completed orders.
 * Usage: npx tsx scripts/bulk-import-zl-to-cloud.mjs [folder]
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

const pdfDir =
  process.argv[2] ||
  "C:/Users/Asus/Desktop/фактуры сервис/Новая папка";

const { prepareImportDraft, normalizeImportOrderKey, importOrderExists, bufferToImportDataUrl } =
  await import("../src/lib/import-work-order-helpers.ts");
const { extractPdfTextFromBuffer } = await import(
  "../src/lib/server/pdf-text-extract.ts"
);
const { parseWorkOrderImportText } = await import(
  "../src/lib/motowarsztat-import-parser.ts"
);
const { createWorkOrderFromImport } = await import(
  "../src/lib/create-work-order-from-import.ts"
);
const { cloudMutateCrmStore } = await import(
  "../src/lib/server/crm-cloud-mutate.ts"
);

async function importOne(filePath, index) {
  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);
  const text = await extractPdfTextFromBuffer(buffer);
  const parsed = parseWorkOrderImportText(text);
  const draft = prepareImportDraft(parsed, fileName, index);
  const orderKey = normalizeImportOrderKey(draft.orderNumber, fileName);

  let resultSummary = null;
  const put = await cloudMutateCrmStore(async (db) => {
    if (importOrderExists(db, orderKey)) {
      resultSummary = { skipped: true, orderKey, reason: "already_exists" };
      return false;
    }

    const createResult = await createWorkOrderFromImport(db, {
      ...draft,
      attachment: {
        name: fileName,
        mime: "application/pdf",
        dataUrl: bufferToImportDataUrl(buffer, "application/pdf"),
      },
    });

    if (!createResult.ok) {
      resultSummary = {
        skipped: true,
        orderKey,
        reason: createResult.error,
      };
      return false;
    }

    resultSummary = {
      skipped: false,
      orderKey,
      orderId: createResult.orderId,
      orderNumber: createResult.orderNumber,
      clientName: draft.clientName,
      phone: draft.phone,
      services: draft.services.length,
      parts: draft.parts.length,
    };
    return createResult.orderNumber;
  });

  return { put, resultSummary, fileName };
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const files = fs
    .readdirSync(pdfDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf") && /^ZL/i.test(f))
    .sort();

  if (!files.length) {
    console.error("No ZL PDF files in", pdfDir);
    process.exit(1);
  }

  console.log(`Importing ${files.length} PDF(s) from:\n  ${pdfDir}\n`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(pdfDir, files[i]);
    const { put, resultSummary, fileName } = await importOne(filePath, i + 1);

    if (!put.ok) {
      failed++;
      console.log(`✗ ${fileName}: cloud error — ${put.error}`);
      continue;
    }

    if (resultSummary?.skipped) {
      skipped++;
      console.log(`○ ${fileName}: ${resultSummary.orderKey} — ${resultSummary.reason}`);
      continue;
    }

    imported++;
    console.log(
      `✓ ${fileName}: ${resultSummary.orderNumber} | ${resultSummary.clientName} | ${resultSummary.services} usług, ${resultSummary.parts} części`
    );
  }

  console.log(`\nDone: imported ${imported}, skipped ${skipped}, failed ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
