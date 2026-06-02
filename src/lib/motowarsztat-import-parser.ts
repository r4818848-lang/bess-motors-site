/** Heuristic parse of Motowarsztat / workshop PDF text → CRM work order draft */

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
  orderNumber?: string;
  /** @deprecated Import does not add labor lines — use `parts` */
  services: { name: string; qty: number; price: number }[];
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
  /^(części|czesci|towar|materiał|materiały|artykuł|parts|detale)\b/i;
const LABOR_SECTION_START =
  /^(usługi|uslugi|robocizna|prace|robota|labor|usługa)\b/i;
const SKIP_LINE =
  /^(razem|suma|vat|netto|brutto|total|data|zlecenie|klient|telefon|vin|rej|podsumowanie|do zapłaty)/i;

function cleanPlate(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toUpperCase();
}

function parseMoney(raw: string): number {
  return Number.parseFloat(raw.replace(",", "."));
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
  const m = line.match(/^(\d+(?:[.,]\d+)?)\s*(szt|kpl|szt\.|pcs|x)\s+/i);
  if (!m) return { qty: 1, rest: line };
  const qty = Number.parseFloat(m[1].replace(",", "."));
  return { qty: Number.isFinite(qty) && qty > 0 ? qty : 1, rest: line.slice(m[0].length) };
}

/** Line with two money values → part (zakup / sprzedaż) */
function tryDualPricePart(line: string): ImportPartDraft | null {
  const trimmed = line.trim();
  if (trimmed.length < 6 || SKIP_LINE.test(trimmed) || LABOR_SECTION_START.test(trimmed)) {
    return null;
  }

  const prices = [...trimmed.matchAll(/(\d{1,6}[,.]\d{2})\s*(?:zł|pln)?/gi)].map((m) =>
    parseMoney(m[1])
  );
  if (prices.length < 2) return null;

  const purchasePrice = Math.min(prices[0], prices[1]);
  const sellPrice = Math.max(prices[0], prices[1]);
  let name = trimmed;
  for (const m of trimmed.matchAll(/(\d{1,6}[,.]\d{2})\s*(?:zł|pln)?/gi)) {
    name = name.replace(m[0], " ");
  }
  name = name.replace(/^\d+([.,]\d+)?\s*(szt|kpl|szt\.)?\s*/i, "").replace(/\s+/g, " ").trim();
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

/** Single sell price in parts section — purchase filled manually later */
function trySinglePricePart(line: string): ImportPartDraft | null {
  const trimmed = line.trim();
  if (trimmed.length < 4 || SKIP_LINE.test(trimmed)) return null;

  const priceMatch = trimmed.match(/(\d{1,6}[,.]\d{2})\s*(?:zł|pln)?/i);
  if (!priceMatch) return null;

  const sellPrice = parseMoney(priceMatch[1]);
  if (!Number.isFinite(sellPrice)) return null;

  let name = trimmed
    .replace(priceMatch[0], "")
    .replace(/^\d+([.,]\d+)?\s*(szt|kpl|h)?\s*/i, "")
    .replace(/[\t|]+/g, " ")
    .trim();

  if (name.length < 2 || /^\d+$/.test(name)) return null;
  const { qty, rest } = parseQtyPrefix(name);
  const finalName = rest.length >= 2 ? rest : name;

  return {
    name: finalName.slice(0, 200),
    qty,
    purchasePrice: 0,
    sellPrice,
  };
}

function extractParts(text: string): ImportPartDraft[] {
  const parts: ImportPartDraft[] = [];
  let inPartsSection = false;
  let inLaborSection = false;

  for (const rawLine of text.split(/\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (PARTS_SECTION_START.test(trimmed)) {
      inPartsSection = true;
      inLaborSection = false;
      continue;
    }
    if (LABOR_SECTION_START.test(trimmed)) {
      inLaborSection = true;
      inPartsSection = false;
      continue;
    }
    if (inLaborSection) continue;

    const dual = tryDualPricePart(trimmed);
    if (dual) {
      parts.push(dual);
      continue;
    }

    if (inPartsSection) {
      const single = trySinglePricePart(trimmed);
      if (single) parts.push(single);
    }
  }

  // Fallback: dual-price lines anywhere (tables without section headers)
  if (parts.length === 0) {
    for (const rawLine of text.split(/\n/)) {
      const dual = tryDualPricePart(rawLine.trim());
      if (dual) parts.push(dual);
    }
  }

  const seen = new Set<string>();
  return parts.filter((p) => {
    const key = `${p.name.toLowerCase()}|${p.purchasePrice}|${p.sellPrice}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  const vin = normalized.match(VIN_RE)?.[1]?.toUpperCase();

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
    ]) ?? labelValue(normalized, ["firma", "nazwa firmy"]);

  const orderNumber = labelValue(normalized, [
    "nr zlecenia",
    "numer zlecenia",
    "zlecenie nr",
    "order",
  ]);

  const makeModel =
    labelValue(normalized, ["pojazd", "samochód", "auto", "marka / model"]) ??
    labelValue(normalized, ["marka", "model"]);

  let make: string | undefined;
  let model: string | undefined;
  if (makeModel) {
    const segments = makeModel.split(/[,/|]/).map((x) => x.trim()).filter(Boolean);
    if (segments.length >= 2) {
      make = segments[0];
      model = segments.slice(1).join(" ");
    } else {
      const words = makeModel.split(/\s+/);
      make = words[0];
      model = words.slice(1).join(" ") || undefined;
    }
  }

  plate =
    plate ??
    labelValue(normalized, ["rejestracja", "nr rej", "rej.", "tablica", "registration"]);

  const parts = extractParts(normalized);
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
    orderNumber: orderNumber?.slice(0, 40),
    services: [],
    parts,
    internalNotes: [
      orderNumber ? `Import MW: ${orderNumber}` : "Import z Motowarsztat (PDF/foto)",
      "Prace (usługi) dodaj ręcznie w CRM — z importu nie są kopiowane.",
    ].join("\n"),
    warnings,
  };
}
