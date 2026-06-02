/** Heuristic parse of Motowarsztat / workshop PDF text → CRM work order draft */

export type ImportServiceDraft = {
  name: string;
  qty: number;
  price: number;
};

export type ImportPartDraft = {
  name: string;
  qty: number;
  purchasePrice: number;
  sellPrice: number;
  partNumber?: string;
};

export type ImportWorkOrderDraft = {
  clientName?: string;
  phone?: string;
  email?: string;
  plate?: string;
  vin?: string;
  make?: string;
  model?: string;
  mileage?: number;
  orderNumber?: string;
  services: ImportServiceDraft[];
  parts: ImportPartDraft[];
  internalNotes?: string;
  warnings: string[];
};

const PHONE_RE = /(?:\+48\s?)?(?:\d{3}[\s-]?){2}\d{3}|\d{9}/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const VIN_RE = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
const PLATE_RE =
  /\b([A-Z]{1,3}[\s-]?[A-Z0-9]{4,6}|[A-Z]{2}[\s-]?\d{4,5}[\s-]?[A-Z]{1,3})\b/gi;

const PARTS_SECTION_START =
  /^(części|czesci|towar|materiał|materiały|artykuł|parts|detale|materiały eksploatacyjne)\b/i;
const LABOR_SECTION_START =
  /^(usługi|uslugi|robocizna|prace|robota|labor|usługa|wykonane prace|operacje)\b/i;
const VEHICLE_SECTION_START = /^(pojazd|samochód|auto|dane pojazdu|vehicle)\b/i;
const SKIP_LINE =
  /^(razem|suma|vat|netto|brutto|total|data|zlecenie|klient|telefon|vin|rej|podsumowanie|do zapłaty|wartość|kwota)/i;

type ParseSection = "none" | "labor" | "parts" | "vehicle";

function cleanPlate(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toUpperCase();
}

function parseMoney(raw: string): number {
  return Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
}

function labelValue(text: string, labels: string[]): string | undefined {
  const lines = text.split(/\n/);
  for (const line of lines) {
    const lower = line.toLowerCase();
    for (const label of labels) {
      const idx = lower.indexOf(label.toLowerCase());
      if (idx === -1) continue;
      const after = line.slice(idx + label.length).replace(/^[\s:.\-–—]+/, "").trim();
      if (after.length >= 2) return after;
    }
  }
  return undefined;
}

function parseQtyPrefix(line: string): { qty: number; rest: string } {
  const m = line.match(/^(\d+(?:[.,]\d+)?)\s*(szt|kpl|szt\.|pcs|x|godz|h|rbh)\s+/i);
  if (!m) return { qty: 1, rest: line };
  const qty = Number.parseFloat(m[1].replace(",", "."));
  return { qty: Number.isFinite(qty) && qty > 0 ? qty : 1, rest: line.slice(m[0].length) };
}

function stripPricesFromLine(line: string): string {
  let name = line;
  for (const m of line.matchAll(/(\d{1,6}[,.]\d{2})\s*(?:zł|pln)?/gi)) {
    name = name.replace(m[0], " ");
  }
  return name
    .replace(/^\d+([.,]\d+)?\s*(szt|kpl|szt\.|godz|h|rbh)?\s*/i, "")
    .replace(/[\t|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countPrices(line: string): number[] {
  return [...line.matchAll(/(\d{1,6}[,.]\d{2})\s*(?:zł|pln)?/gi)]
    .map((m) => parseMoney(m[1]))
    .filter((n) => Number.isFinite(n));
}

/** One price → labor / service line */
function tryServiceLine(line: string): ImportServiceDraft | null {
  const trimmed = line.trim();
  if (trimmed.length < 4 || SKIP_LINE.test(trimmed)) return null;
  if (PARTS_SECTION_START.test(trimmed) || LABOR_SECTION_START.test(trimmed)) return null;

  const prices = countPrices(trimmed);
  if (prices.length !== 1) return null;

  const name = stripPricesFromLine(trimmed);
  if (name.length < 2 || /^\d+$/.test(name)) return null;

  const { qty, rest } = parseQtyPrefix(name);
  const finalName = rest.length >= 2 ? rest : name;

  return {
    name: finalName.slice(0, 200),
    qty,
    price: prices[0],
  };
}

/** Two prices → part (zakup / sprzedaż) */
function tryPartLine(line: string): ImportPartDraft | null {
  const trimmed = line.trim();
  if (trimmed.length < 6 || SKIP_LINE.test(trimmed)) return null;

  const prices = countPrices(trimmed);
  if (prices.length < 2) return null;

  const purchasePrice = Math.min(...prices.slice(0, 2));
  const sellPrice = Math.max(...prices.slice(0, 2));
  const name = stripPricesFromLine(trimmed);
  if (name.length < 2 || /^\d+$/.test(name)) return null;

  const { qty, rest } = parseQtyPrefix(name);
  const finalName = rest.length >= 2 ? rest : name;

  return {
    name: finalName.slice(0, 200),
    qty,
    purchasePrice,
    sellPrice,
  };
}

/** One price in parts table — sell only; zakup uzupełnisz w CRM */
function tryPartSinglePrice(line: string): ImportPartDraft | null {
  const trimmed = line.trim();
  if (trimmed.length < 4 || SKIP_LINE.test(trimmed)) return null;

  const prices = countPrices(trimmed);
  if (prices.length !== 1) return null;

  const name = stripPricesFromLine(trimmed);
  if (name.length < 2 || /^\d+$/.test(name)) return null;

  const { qty, rest } = parseQtyPrefix(name);
  const finalName = rest.length >= 2 ? rest : name;

  return {
    name: finalName.slice(0, 200),
    qty,
    purchasePrice: 0,
    sellPrice: prices[0],
  };
}

function dedupeServices(items: ImportServiceDraft[]): ImportServiceDraft[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    const key = s.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeParts(items: ImportPartDraft[]): ImportPartDraft[] {
  const seen = new Set<string>();
  return items.filter((p) => {
    const key = `${p.name.toLowerCase()}|${p.sellPrice}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractLineItems(text: string): { services: ImportServiceDraft[]; parts: ImportPartDraft[] } {
  const services: ImportServiceDraft[] = [];
  const parts: ImportPartDraft[] = [];
  let section: ParseSection = "none";

  for (const rawLine of text.split(/\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (PARTS_SECTION_START.test(trimmed)) {
      section = "parts";
      continue;
    }
    if (LABOR_SECTION_START.test(trimmed)) {
      section = "labor";
      continue;
    }
    if (VEHICLE_SECTION_START.test(trimmed)) {
      section = "vehicle";
      continue;
    }

    if (section === "labor") {
      const svc = tryServiceLine(trimmed);
      if (svc) services.push(svc);
      continue;
    }

    if (section === "parts") {
      const dual = tryPartLine(trimmed);
      if (dual) {
        parts.push(dual);
        continue;
      }
      const single = tryPartSinglePrice(trimmed);
      if (single) parts.push(single);
      continue;
    }
  }

  return { services, parts };
}

function extractFallback(text: string): { services: ImportServiceDraft[]; parts: ImportPartDraft[] } {
  const services: ImportServiceDraft[] = [];
  const parts: ImportPartDraft[] = [];

  for (const rawLine of text.split(/\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || SKIP_LINE.test(trimmed)) continue;
    if (PARTS_SECTION_START.test(trimmed) || LABOR_SECTION_START.test(trimmed)) continue;

    const partDual = tryPartLine(trimmed);
    if (partDual) {
      parts.push(partDual);
      continue;
    }
    const svc = tryServiceLine(trimmed);
    if (svc) services.push(svc);
  }

  return { services, parts };
}

function parseMileage(text: string): number | undefined {
  const raw =
    labelValue(text, ["przebieg", "mileage", "stan licznika"]) ??
    text.match(/przebieg[:\s]+(\d[\d\s]*)\s*km/i)?.[1];
  if (!raw) return undefined;
  const n = Number.parseInt(raw.replace(/\s/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function parseWorkOrderImportText(text: string): ImportWorkOrderDraft {
  const warnings: string[] = [];
  const normalized = text.replace(/\r/g, "\n");

  const phones = [...normalized.matchAll(PHONE_RE)].map((m) =>
    m[0].replace(/\s/g, "").replace(/^\+48/, "").slice(-9)
  );
  const phone = phones.find((p) => p.length === 9)
    ? `+48${phones.find((p) => p.length === 9)}`
    : undefined;

  const email = normalized.match(EMAIL_RE)?.[0];

  const vin =
    labelValue(normalized, ["vin", "numer vin"]) ??
    normalized.match(VIN_RE)?.[1]?.toUpperCase();

  let plate: string | undefined;
  for (const m of normalized.matchAll(PLATE_RE)) {
    const p = cleanPlate(m[1]);
    if (p.length >= 4 && p.length <= 10 && !/^\d+$/.test(p)) {
      plate = p;
      break;
    }
  }

  const clientName =
    labelValue(normalized, [
      "klient",
      "nazwa klienta",
      "kontrahent",
      "odbiorca",
      "client",
      "imię i nazwisko",
    ]) ?? labelValue(normalized, ["firma", "nazwa firmy"]);

  const orderNumber = labelValue(normalized, [
    "nr zlecenia",
    "numer zlecenia",
    "zlecenie nr",
    "order",
    "zl ",
    "zl.",
  ]);

  const makeModel =
    labelValue(normalized, [
      "pojazd",
      "samochód",
      "auto",
      "marka / model",
      "marka i model",
    ]) ?? labelValue(normalized, ["marka", "model"]);

  let make =
    labelValue(normalized, ["marka", "marka pojazdu", "producent"]) ?? undefined;
  let model =
    labelValue(normalized, ["model", "model pojazdu"]) ?? undefined;

  if (makeModel && (!make || !model)) {
    const segments = makeModel.split(/[,/|]/).map((x) => x.trim()).filter(Boolean);
    if (segments.length >= 2) {
      make = make ?? segments[0];
      model = model ?? segments.slice(1).join(" ");
    } else {
      const words = makeModel.split(/\s+/);
      make = make ?? words[0];
      model = model ?? (words.slice(1).join(" ") || undefined);
    }
  }

  plate =
    plate ??
    labelValue(normalized, [
      "rejestracja",
      "nr rej",
      "rej.",
      "tablica",
      "registration",
      "nr rejestracyjny",
    ]);

  const mileage = parseMileage(normalized);

  let { services, parts } = extractLineItems(normalized);
  if (services.length === 0 && parts.length === 0) {
    const fallback = extractFallback(normalized);
    services = fallback.services;
    parts = fallback.parts;
  }

  services = dedupeServices(services);
  parts = dedupeParts(parts);

  if (services.length === 0) warnings.push("no_services_detected");
  if (parts.length === 0) warnings.push("no_parts_detected");
  if (parts.some((p) => p.purchasePrice <= 0)) warnings.push("missing_purchase_price");
  if (!phone && !clientName) warnings.push("no_client_detected");
  if (!plate && !vin) warnings.push("no_vehicle_detected");

  return {
    clientName: clientName?.slice(0, 120),
    phone,
    email,
    plate: plate ? cleanPlate(plate) : undefined,
    vin,
    make: make?.slice(0, 60),
    model: model?.slice(0, 60),
    mileage,
    orderNumber: orderNumber?.slice(0, 40),
    services,
    parts,
    internalNotes: orderNumber
      ? `Import MW: ${orderNumber}`
      : "Import z Motowarsztat (PDF/foto)",
    warnings,
  };
}
