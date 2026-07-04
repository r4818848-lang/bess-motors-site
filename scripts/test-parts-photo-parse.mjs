import { readFileSync } from "node:fs";
import { parsePartsOrderPhotoText } from "../src/lib/parts-order-photo-parser.ts";
import { ocrPartsOrderImageBuffer } from "../src/lib/server/ocr-import-image.ts";

const sampleImage =
  process.argv[2] ||
  "C:/Users/Asus/.cursor/projects/c-Users-Asus-Desktop-website-bess-motors/assets/c__Users_Asus_AppData_Roaming_Cursor_User_workspaceStorage_8d0c661dbeaa40b9d054a49f3c772917_images_image-8b4a462b-94f0-4998-844d-54d440849fde.png";

const inlineOcr = `ToBap 3akazaHO O6pa60TaHO LleHa 3a egnHuuy skn HAC OnTOBaA CTOHMOCTb BK HAC
0 986 628 584
<> CanoHHblń OwnbTp 1 1 62,37 PLN 62,37 PLN
AP 103/6
RZ Bosnywaoiń OwnoTp 1 1 37,75 PLN 37,75 PLN
OP 575
gz» MacnsHbiń OwnoTp 1 1 16,57 PLN 16,57 PLN
8100 X-CLEAN+ 5W30 5L
A MoTopHoe Macno no aBTO 1 1 273,34 PLN 273,34 PLN`;

const columnOcr = `Товар
0 986 628 584
Салонный Фильтр
AP 103/6
Воздушный фильтр
OP 575
Масляный фильтр
8100 X-CLEAN+ 5W30 5L
Моторное масло по авто
62,37 PLN
37,75 PLN
16,57 PLN
273,34 PLN
62,37 PLN
37,75 PLN
16,57 PLN
273,34 PLN`;

function assert(count, rows, label) {
  console.log(`\n=== ${label} (${rows.length} rows) ===`);
  for (const r of rows) {
    console.log(`${r.partNumber} | ${r.name} | ${r.priceBrutto}`);
  }
  if (rows.length !== count) {
    console.error(`Expected ${count} rows, got ${rows.length}`);
    process.exitCode = 1;
  }
}

assert(4, parsePartsOrderPhotoText(inlineOcr), "inline OCR");
assert(4, parsePartsOrderPhotoText(columnOcr), "column OCR");

if (sampleImage) {
  const buf = readFileSync(sampleImage);
  const text = await ocrPartsOrderImageBuffer(buf);
  const rows = parsePartsOrderPhotoText(text);
  if (rows.length !== 4) {
    console.log("--- OCR text ---\n" + text);
  }
  assert(4, rows, "live image OCR");
}
