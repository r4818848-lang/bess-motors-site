import { readFileSync } from "fs";
import { pathToFileURL } from "url";
import path from "path";

const root = path.join(import.meta.dirname, "..");
const parserUrl = pathToFileURL(
  path.join(root, "src/lib/motowarsztat-import-parser.ts")
).href;

const { parseWorkOrderImportText } = await import(parserUrl);

const FIXTURE = `ZL 1/06/2026
Status: Nowe zlecenie
Data utworzenia: 2026-06-01

Dane klienta
Imię i nazwisko: Kaja Sobczak
Telefon: 652901242
Email: ubaran@wozniak.pl
Nazwa firmy: Jasińska
NIP: 4695701329

Dane pojazdu
Marka i model: Audi A4
VIN: 53E82FABD81599176
Stan licznika: 594 259 km

Kosztorys
Usługi
Wymiana uszczelki pod głowicą 3,53 oper 98,40 zł 347,35 zł
Wymiana pompy płynu chłodzącego 2,7 oper 98,40 zł 265,68 zł
RAZEM 1 350,05 zł

Towary
Zestaw uszczelki pod głowicą 1 szt. 290,00 zł
Pompa płynu chłodzącego 1 szt. 139,20 zł
Pierścień tłokowy - komplet 4 szt. 75,41 zł 301,65 zł
`;

const parsed = parseWorkOrderImportText(FIXTURE);
const ok =
  parsed.clientName?.includes("Kaja") &&
  parsed.phone?.includes("652901242") &&
  parsed.vin === "53E82FABD81599176" &&
  parsed.services.length >= 2 &&
  parsed.parts.length >= 2;

console.log(JSON.stringify({ ok, parsed: { ...parsed, services: parsed.services.length, parts: parsed.parts.length } }, null, 2));
process.exit(ok ? 0 : 1);
