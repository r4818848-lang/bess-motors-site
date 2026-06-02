/** Heuristic parse of Motowarsztat / workshop PDF text → CRM work order draft */

export type ImportWorkOrderDraft = {
  clientName?: string;
  phone?: string;
  email?: string;
  plate?: string;
  vin?: string;
  make?: string;
  model?: string;
  orderNumber?: string;
  services: { name: string; qty: number; price: number }[];
  internalNotes?: string;
  warnings: string[];
};

const PHONE_RE = /(?:\+48\s?)?(?:\d{3}[\s-]?){2}\d{3}|\d{9}/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const VIN_RE = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
const PLATE_RE =
  /\b([A-Z]{1,3}[\s-]?[A-Z0-9]{4,6}|[A-Z]{2}[\s-]?\d{4,5}[\s-]?[A-Z]{1,3})\b/gi;

function cleanPlate(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toUpperCase();
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

function extractServices(text: string): ImportWorkOrderDraft["services"] {
  const services: ImportWorkOrderDraft["services"] = [];
  const skip = /^(razem|suma|vat|netto|brutto|total|data|zlecenie|klient|telefon|vin|rej)/i;

  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (trimmed.length < 4 || skip.test(trimmed)) continue;

    const priceMatch = trimmed.match(/(\d{1,6}[,.]\d{2})\s*(?:zł|pln)?/i);
    if (!priceMatch) continue;

    const price = Number.parseFloat(priceMatch[1].replace(",", "."));
    if (!Number.isFinite(price)) continue;

    let name = trimmed
      .replace(priceMatch[0], "")
      .replace(/^\d+([.,]\d+)?\s*(szt|kpl|h)?\s*/i, "")
      .replace(/[\t|]+/g, " ")
      .trim();

    if (name.length < 2) continue;
    if (/^\d+$/.test(name)) continue;

    services.push({ name: name.slice(0, 200), qty: 1, price });
  }

  const seen = new Set<string>();
  return services.filter((s) => {
    const key = s.name.toLowerCase();
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
  const phone = phones.find((p) => p.length === 9) ? `+48${phones.find((p) => p.length === 9)}` : undefined;

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
    ]) ??
    labelValue(normalized, ["firma", "nazwa firmy"]);

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
    const parts = makeModel.split(/[,/|]/).map((x) => x.trim()).filter(Boolean);
    if (parts.length >= 2) {
      make = parts[0];
      model = parts.slice(1).join(" ");
    } else {
      const words = makeModel.split(/\s+/);
      make = words[0];
      model = words.slice(1).join(" ") || undefined;
    }
  }

  plate =
    plate ??
    labelValue(normalized, ["rejestracja", "nr rej", "rej.", "tablica", "registration"]);

  const services = extractServices(normalized);
  if (services.length === 0) warnings.push("no_services_detected");
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
    services,
    internalNotes: orderNumber ? `Import MW: ${orderNumber}` : "Import z Motowarsztat (PDF/foto)",
    warnings,
  };
}
