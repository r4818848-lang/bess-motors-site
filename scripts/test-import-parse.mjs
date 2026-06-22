import { readFileSync } from "fs";
import { parseWorkOrderImportText } from "../src/lib/motowarsztat-import-parser.ts";
import { storeUnitPriceFromDisplay } from "../src/lib/crm-display-price.ts";

const sample = `BESSMOTORS SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ
ZL 1/06/2026
Dane klienta
Kaja Sobczak
Telefon: 652901242
Email: ubaran@wozniak.pl
Dane pojazdu
Audi A4
VIN: 53E82FABD81599176
Stan licznika: 594 259 km
Kosztorys
Usługi
Wymiana uszczelki głowicy cylindrów 1 szt 341,12 zł 341,12 zł
Wymiana pompy wody 1 szt 350,05 zł 350,05 zł
RAZEM 1 350,05 zł
Towary
Uszczelka głowicy - zestaw 1 szt 686,58 zł 686,58 zł
Zestaw naprawczy wahacza 1 szt 1 102,01 zł 1 102,01 zł
RAZEM 3 258,03 zł
Łącznie: 4 608,08 zł`;

const tabSample = `ZL 16/06/2026
Dane klienta:
Imię i nazwisko: Bartosz Dabrowski
Numer telefonu: 790828708
Dane pojazdu:
Marka i model Kia Soul
Numer rejestracyjny SBI3AP8
VIN KNAJT813AC7359888
Kosztorys
Usługi:
Lp. Nazwa \tIlość \tJ.m. \tCena brutto \tKoszt brutto
1 \tWymiana przewodu hamulcowego \t1 \toper \t200,00 zł \t200,00 zł
2 \tNaprawa przebitej opony \t1 \toper \t80,00 zł \t80,00 zł
Towary:
Lp. Nazwa \tIlość \tJ.m. \tCena brutto \tKoszt brutto
1 \tPrzewód hamulcowy elastyczny \t1 \tszt. \t150,00 zł \t150,00 zł`;

const discountSample = `ZL 21/06/2026
Dane klienta:
Imię i nazwisko: Basta
Numer telefonu: 697334469
Dane pojazdu:
Marka i model Volkswagen Passat
Numer rejestracyjny WE765MS
Usługi:
Lp. Nazwa \tIlość \tJ.m. \tCena brutto \tRabat \tCena brutto po rabacie \tKoszt brutto
1 \tWymiana uszczelki miski olejowej \t1 \toper \t400,00 zł \t10% \t360,00 zł \t360,00 zł
2 \tWymiana dwóch tylnych amortyzatorów \t2 \toper \t244,44 zł \t10% \t439,99 zł \t439,99 zł
Udzielono rabatu brutto \t88,89 zł`;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const parsed = parseWorkOrderImportText(sample);
console.log("legacy sample:", JSON.stringify(parsed, null, 2));

const tab = parseWorkOrderImportText(tabSample);
assert(tab.clientName === "Bartosz Dabrowski", "tab client name");
assert(tab.services.length === 2, "tab services count");
assert(tab.parts.length === 1, "tab parts count");
assert(tab.parts[0].sellPrice === 150, "tab part price");
console.log("tab sample: OK");

const disc = parseWorkOrderImportText(discountSample);
assert(disc.services.length === 2, "discount services count");
assert(disc.services[0].price === 360, "discount service price");
assert(!disc.services.some((s) => /rabatu/i.test(s.name)), "no discount summary as service");
console.log("discount sample: OK");

const stored250 = storeUnitPriceFromDisplay(250, "gross", 23, true);
console.assert(Math.abs(stored250 - 203.25) < 0.02, "250 brutto stores as net");
console.log("brutto storage sample: OK");

const imgPath =
  process.argv[2] ||
  "C:/Users/Asus/.cursor/projects/c-Users-Asus-Desktop-website/assets/c__Users_Asus_AppData_Roaming_Cursor_User_workspaceStorage_71d6fc7b4634af83b546dc307fa7313f_images_image-4ff27cbc-44ce-4bb3-8c3c-7b4dea21fd7a.png";

if (process.argv[2] !== "--sample-only") {
  try {
    const { ocrImportImageBuffer } = await import("../src/lib/server/ocr-import-image.ts");
    const buf = readFileSync(imgPath);
    const text = await ocrImportImageBuffer(buf);
      console.log("\n--- OCR length:", text.length);
      console.log(text.slice(0, 800));
      const fromImg = parseWorkOrderImportText(text);
      console.log("\n--- Parsed from image:");
      console.log(JSON.stringify(fromImg, null, 2));
  } catch (e) {
    console.error("OCR failed:", e.message);
  }
}
