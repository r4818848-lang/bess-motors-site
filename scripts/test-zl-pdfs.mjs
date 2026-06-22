import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const dir =
  process.argv[2] ||
  "C:/Users/Asus/Desktop/фактуры сервис/Новая папка";

const { extractPdfTextFromBuffer } = await import(
  "../src/lib/server/pdf-text-extract.ts"
);
const { parseWorkOrderImportText } = await import(
  "../src/lib/motowarsztat-import-parser.ts"
);

const files = readdirSync(dir)
  .filter((f) => f.toLowerCase().endsWith(".pdf") && f.startsWith("ZL"))
  .sort();

for (const name of files) {
  const path = join(dir, name);
  const buf = readFileSync(path);
  const text = await extractPdfTextFromBuffer(buf);
  const parsed = parseWorkOrderImportText(text);
  console.log("\n========", name, "========");
  console.log("text length:", text.length);
  console.log("preview:\n", text.slice(0, 1200));
  console.log("\nPARSED:", JSON.stringify(parsed, null, 2));
}
