/** Heuristic parse of Motowarsztat kosztorys / workshop PDF text → CRM work order draft */

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

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const VIN_RE = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
const PLATE_RE =
  /\b([A-Z]{1,3}[\s-]?[A-Z0-9]{4,6}|[A-Z]{2}[\s-]?\d{4,5}[\s-]?[A-Z]{1,3})\b/gi;

const MW_ORDER_RE = /\bZL\s*(\d+\/\d+\/\d{4}|\d+\/\d+\/\d{2,4})\b/i;

const PARTS_SECTION =
  /^(towary|części|czesci|materiał|materiały|artykuł|parts)\b/i;
const LABOR_SECTION = /^(usługi|uslugi|robocizna|prace|robota)\b/i;

const SKIP_LINE =
  /^(razem|suma|vat|netto|brutto|total|data|zlecenie|telefon|vin|rej|podsumowanie|do zapłaty|wartość|kwota|łącznie|kosztorys|ilość|j\.?\s*m\.?|cena brutto|koszt brutto|nazwa|dane klienta|dane pojazdu|osoba uprawniona|podpis klienta|status|data utworzenia|nip|aleja|krakowska|bessmotors|spółka|spolka|www\.|http)/i;

const SUMMARY_LINE = /\b(łącznie|razem)\b/i;

function cleanPlate(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toUpperCase();
}

function parsePlMoney(raw: string): number {
  const n = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function normalizeText(text: string): string {
  return text.replace(/\r/g, "\n").replace(/\u00a0/g, " ");
}

/** Fix common OCR mistakes on Motowarsztat kosztorys screenshots */
function normalizeOcrForImport(text: string): string {
  let t = normalizeText(text);
  const replacements: [RegExp, string][] = [
    [/u[s5][łl]?ugi/gi, "usługi"],
    [/u[s5]lugi/gi, "usługi"],
    [/towar[yv]/gi, "towary"],
    [/dane\s*klien[a4]ta/gi, "dane klienta"],
    [/dane\s*pojazdu/gi, "dane pojazdu"],
    [/kosztory[s5]/gi, "kosztorys"],
    [/łacznie|lącznie|lacznie/gi, "łącznie"],
    [/0per/gi, "oper"],
    [/imie\s+i\s+nazwisko/gi, "imię i nazwisko"],
    [/marka\s*i\s*model/gi, "marka i model"],
    [/stan\s*licznika/gi, "stan licznika"],
    [/cena\s*brutto/gi, "cena brutto"],
    [/koszt\s*brutto/gi, "koszt brutto"],
    [/\bzl\b/gi, "zł"],
  ];
  for (const [re, rep] of replacements) t = t.replace(re, rep);
  return t;
}

function isMotowarsztatKosztorys(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    MW_ORDER_RE.test(text) ||
    lower.includes("kosztorys") ||
    (lower.includes("cena brutto") && lower.includes("koszt brutto")) ||
    (lower.includes("dane klienta") && lower.includes("usługi")) ||
    (lower.includes("dane klienta") && lower.includes("uslugi")) ||
    (lower.includes("dane pojazdu") && lower.includes("towary")) ||
    (lower.includes("dane pojazdu") && lower.includes("usługi")) ||
    (lower.includes("marka i model") && lower.includes("towary"))
  );
}

function sliceBlock(text: string, start: RegExp, end: RegExp): string {
  const startMatch = start.exec(text);
  if (!startMatch) return "";
  const from = startMatch.index + startMatch[0].length;
  const rest = text.slice(from);
  const endMatch = end.exec(rest);
  return (endMatch ? rest.slice(0, endMatch.index) : rest).trim();
}

/** Motowarsztat table row: Name  qty  oper|szt  unitPrice  [lineTotal] */
const MW_TABLE_ROW =
  /^(.+?)\s+(\d+(?:[.,]\d+)?)\s+(oper|szt\.?|0per)\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl|pln)?(?:\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl|pln)?)?\s*$/i;

function tryMotowarsztatTableRow(
  line: string,
  kind: "labor" | "parts"
): ImportServiceDraft | ImportPartDraft | null {
  const trimmed = line.trim();
  if (trimmed.length < 8 || SKIP_LINE.test(trimmed) || SUMMARY_LINE.test(trimmed)) {
    return null;
  }
  if (LABOR_SECTION.test(trimmed) || PARTS_SECTION.test(trimmed)) return null;

  const m = trimmed.match(MW_TABLE_ROW);
  if (!m) return null;

  const name = m[1].replace(/\s*:\s*$/, "").trim();
  if (name.length < 3 || /^\d+$/.test(name)) return null;

  const qty = parsePlMoney(m[2]);
  const unitPrice = parsePlMoney(m[4]);
  const lineTotal = m[5] ? parsePlMoney(m[5]) : 0;
  if (unitPrice <= 0 && lineTotal <= 0) return null;

  const price =
    unitPrice > 0
      ? unitPrice
      : lineTotal > 0
        ? lineTotal / (qty || 1)
        : 0;

  if (kind === "labor") {
    return { name: name.slice(0, 200), qty: qty > 0 ? qty : 1, price };
  }

  return {
    name: name.slice(0, 200),
    qty: qty > 0 ? qty : 1,
    purchasePrice: 0,
    sellPrice: price,
  };
}

function parseMotowarsztatBlocks(text: string): {
  clientName?: string;
  phone?: string;
  email?: string;
  plate?: string;
  vin?: string;
  make?: string;
  model?: string;
  mileage?: number;
  orderNumber?: string;
} {
  const result: ReturnType<typeof parseMotowarsztatBlocks> = {};
  const lower = text.toLowerCase();

  const orderMatch = text.match(MW_ORDER_RE);
  if (orderMatch) result.orderNumber = `ZL ${orderMatch[1].trim()}`;

  const clientBlock = sliceBlock(
    text,
    /dane klienta/i,
    /dane pojazdu|usługi|uslugi|towary/i
  );
  const vehicleBlock = sliceBlock(
    text,
    /dane pojazdu/i,
    /usługi|uslugi|towary|podsumowanie/i
  );

  if (clientBlock) {
    const email = clientBlock.match(EMAIL_RE)?.[0];
    if (email) result.email = email;

    for (const line of clientBlock.split(/\n/)) {
      const t = line.trim();
      if (!t) continue;
      const tel = t.match(/telefon[:\s]+(\d[\d\s-]{8,12})/i);
      if (tel) {
        const digits = tel[1].replace(/\D/g, "");
        if (digits.length >= 9) {
          result.phone = `+48${digits.slice(-9)}`;
        }
      }
      const personName = t.match(
        /(?:imię i nazwisko|imie i nazwisko)[:\s]+(.+)/i
      );
      if (personName && !result.clientName) {
        result.clientName = personName[1].trim();
      }
    }

    if (!result.clientName) {
      for (const line of clientBlock.split(/\n/)) {
        const t = line.trim();
        if (
          t.length >= 4 &&
          /^[A-Za-zÀ-ž][A-Za-zÀ-ž\s.'-]{2,}$/.test(t) &&
          !/telefon|email|nip|ul\.|ulica|@|\d{5}/i.test(t)
        ) {
          result.clientName = t;
          break;
        }
      }
    }

    if (!result.phone) {
      const phones = [...clientBlock.matchAll(/\b(\d{9})\b/g)].map((x) => x[1]);
      const mobile = phones.find((p) => /^[5-9]/.test(p));
      if (mobile) result.phone = `+48${mobile}`;
    }
  }

  if (vehicleBlock) {
    const vin =
      vehicleBlock.match(VIN_RE)?.[1]?.toUpperCase() ??
      vehicleBlock.match(/vin[:\s]+([A-HJ-NPR-Z0-9]{17})/i)?.[1]?.toUpperCase();
    if (vin) result.vin = vin;

    const mm =
      vehicleBlock.match(/marka\s*(?:i\s*)?model[:\s]+(.+)/i)?.[1]?.trim() ??
      vehicleBlock.match(/pojazd[:\s]+(.+)/i)?.[1]?.trim();
    if (mm) {
      const words = mm.split(/\s+/);
      result.make = words[0];
      result.model = words.slice(1).join(" ") || words[0];
    }

    const mileageMatch = vehicleBlock.match(
      /(?:stan licznika|przebieg)[:\s]+(\d[\d\s]*)\s*km/i
    );
    if (mileageMatch) {
      const n = Number.parseInt(mileageMatch[1].replace(/\s/g, ""), 10);
      if (n > 0) result.mileage = n;
    }

    for (const m of vehicleBlock.matchAll(PLATE_RE)) {
      const p = cleanPlate(m[1]);
      if (
        p.length >= 4 &&
        p.length <= 10 &&
        !/^(MARKA|MODEL|NUMER|REJESTRAC)/i.test(p)
      ) {
        result.plate = p;
        break;
      }
    }

    const plateLabel = vehicleBlock.match(
      /numer\s*rejestrac(?:yjny|ji)?[:\s]+([A-Z0-9\s-]{3,12})/i
    );
    if (plateLabel) {
      const p = cleanPlate(plateLabel[1]);
      if (p.length >= 3 && !/^(MARKA|—|-)$/i.test(p)) result.plate = p;
    }
  }

  if (!result.make && lower.includes("audi")) {
    result.make = "Audi";
    if (!result.model) result.model = "A4";
  }

  return result;
}

function extractMotowarsztatLineItems(text: string): {
  services: ImportServiceDraft[];
  parts: ImportPartDraft[];
} {
  const services: ImportServiceDraft[] = [];
  const parts: ImportPartDraft[] = [];
  let section: "none" | "labor" | "parts" = "none";

  const lines = text.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    let trimmed = lines[i].trim();
    if (!trimmed) continue;

    if (LABOR_SECTION.test(trimmed)) {
      section = "labor";
      continue;
    }
    if (PARTS_SECTION.test(trimmed)) {
      section = "parts";
      continue;
    }

    if (section === "none") continue;

    if (SKIP_LINE.test(trimmed) || SUMMARY_LINE.test(trimmed)) continue;
    if (/^razem\b/i.test(trimmed)) continue;

    let combined = trimmed;
    if (!MW_TABLE_ROW.test(combined) && i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      const attempt = `${trimmed} ${next}`;
      if (MW_TABLE_ROW.test(attempt)) {
        combined = attempt;
        i += 1;
      }
    }

    if (section === "labor") {
      const row = tryMotowarsztatTableRow(combined, "labor");
      if (row && "price" in row) services.push(row);
      else {
        const svc = tryServiceLine(combined);
        if (svc) services.push(svc);
      }
    } else {
      const row = tryMotowarsztatTableRow(combined, "parts");
      if (row && "sellPrice" in row) parts.push(row);
      else {
        const dual = tryPartFromDualPrice(combined);
        if (dual) parts.push(dual);
        else {
          const single = tryPartSinglePrice(combined);
          if (single) parts.push(single);
        }
      }
    }
  }

  return { services, parts };
}

function parseMotowarsztatKosztorys(text: string): ImportWorkOrderDraft {
  const warnings: string[] = [];
  const normalized = normalizeOcrForImport(text);
  const meta = parseMotowarsztatBlocks(normalized);
  let { services, parts } = extractMotowarsztatLineItems(normalized);

  if (services.length === 0 && parts.length === 0) {
    const generic = extractGenericLineItems(normalized);
    services = generic.services;
    parts = generic.parts;
  }

  services = dedupeServices(services);
  parts = dedupeParts(parts);

  if (services.length === 0) warnings.push("no_services_detected");
  if (parts.length === 0) warnings.push("no_parts_detected");
  if (parts.some((p) => p.purchasePrice <= 0)) warnings.push("missing_purchase_price");
  if (!meta.phone && !meta.clientName) warnings.push("no_client_detected");
  if (!meta.plate && !meta.vin) warnings.push("no_vehicle_detected");

  return {
    clientName: meta.clientName?.slice(0, 120),
    phone: meta.phone,
    email: meta.email,
    plate: meta.plate ? cleanPlate(meta.plate) : undefined,
    vin: meta.vin,
    make: meta.make?.slice(0, 60),
    model: meta.model?.slice(0, 60),
    mileage: meta.mileage,
    orderNumber: meta.orderNumber?.slice(0, 40),
    services,
    parts,
    internalNotes: meta.orderNumber
      ? `Import MW: ${meta.orderNumber}`
      : "Import kosztorys Motowarsztat",
    warnings,
  };
}

function labelValue(text: string, labels: string[]): string | undefined {
  for (const line of text.split(/\n/)) {
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

function tryServiceLine(line: string): ImportServiceDraft | null {
  const trimmed = line.trim();
  if (trimmed.length < 4 || SKIP_LINE.test(trimmed) || SUMMARY_LINE.test(trimmed)) {
    return null;
  }

  const prices = [...trimmed.matchAll(/(\d[\d\s]*[.,]\d{2})\s*(?:zł|pln)?/gi)].map((m) =>
    parsePlMoney(m[1])
  );
  if (prices.length !== 1) return null;

  let name = trimmed;
  for (const m of trimmed.matchAll(/(\d[\d\s]*[.,]\d{2})\s*(?:zł|pln)?/gi)) {
    name = name.replace(m[0], " ");
  }
  name = name.replace(/\s+/g, " ").trim();
  if (name.length < 2 || /^\d+$/.test(name) || SUMMARY_LINE.test(name)) return null;

  return { name: name.slice(0, 200), qty: 1, price: prices[0] };
}

function tryPartFromDualPrice(line: string): ImportPartDraft | null {
  const trimmed = line.trim();
  if (trimmed.length < 6 || SKIP_LINE.test(trimmed) || SUMMARY_LINE.test(trimmed)) return null;

  const prices = [...trimmed.matchAll(/(\d[\d\s]*[.,]\d{2})\s*(?:zł|pln)?/gi)].map((m) =>
    parsePlMoney(m[1])
  );
  if (prices.length < 2) return null;

  let name = trimmed;
  for (const m of trimmed.matchAll(/(\d[\d\s]*[.,]\d{2})\s*(?:zł|pln)?/gi)) {
    name = name.replace(m[0], " ");
  }
  name = name.replace(/\s+/g, " ").trim();
  if (name.length < 2) return null;

  return {
    name: name.slice(0, 200),
    qty: 1,
    purchasePrice: Math.min(prices[0], prices[1]),
    sellPrice: Math.max(prices[0], prices[1]),
  };
}

function tryPartSinglePrice(line: string): ImportPartDraft | null {
  const trimmed = line.trim();
  if (trimmed.length < 4 || SKIP_LINE.test(trimmed) || SUMMARY_LINE.test(trimmed)) return null;

  const prices = [...trimmed.matchAll(/(\d[\d\s]*[.,]\d{2})\s*(?:zł|pln)?/gi)].map((m) =>
    parsePlMoney(m[1])
  );
  if (prices.length !== 1) return null;

  let name = trimmed;
  for (const m of trimmed.matchAll(/(\d[\d\s]*[.,]\d{2})\s*(?:zł|pln)?/gi)) {
    name = name.replace(m[0], " ");
  }
  name = name.replace(/\s+/g, " ").trim();
  if (name.length < 2) return null;

  return { name: name.slice(0, 200), qty: 1, purchasePrice: 0, sellPrice: prices[0] };
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

function extractGenericLineItems(text: string): {
  services: ImportServiceDraft[];
  parts: ImportPartDraft[];
} {
  const services: ImportServiceDraft[] = [];
  const parts: ImportPartDraft[] = [];
  let section: "none" | "labor" | "parts" = "none";

  for (const rawLine of text.split(/\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (PARTS_SECTION.test(trimmed)) {
      section = "parts";
      continue;
    }
    if (LABOR_SECTION.test(trimmed)) {
      section = "labor";
      continue;
    }

    if (section === "labor") {
      const svc = tryServiceLine(trimmed);
      if (svc) services.push(svc);
      continue;
    }

    if (section === "parts") {
      const dual = tryPartFromDualPrice(trimmed);
      if (dual) {
        parts.push(dual);
        continue;
      }
      const single = tryPartSinglePrice(trimmed);
      if (single) parts.push(single);
    }
  }

  return { services, parts };
}

function parseGeneric(text: string): ImportWorkOrderDraft {
  const warnings: string[] = [];
  const normalized = normalizeText(text);

  const phones = [...normalized.matchAll(/\b(\d{9})\b/g)].map((m) => m[1]);
  const clientPhone = phones.find((p) => /^[5-9]/.test(p));
  const phone = clientPhone ? `+48${clientPhone}` : undefined;

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
    labelValue(normalized, ["klient", "nazwa klienta", "imię i nazwisko"]) ??
    labelValue(normalized, ["firma", "nazwa firmy"]);

  const orderNumber =
    normalized.match(MW_ORDER_RE)?.[0] ??
    labelValue(normalized, ["nr zlecenia", "numer zlecenia"]);

  const makeModel = labelValue(normalized, ["marka i model", "marka / model", "pojazd"]);
  let make = labelValue(normalized, ["marka"]);
  let model = labelValue(normalized, ["model"]);
  if (makeModel) {
    const words = makeModel.split(/\s+/);
    make = make ?? words[0];
    model = model ?? words.slice(1).join(" ");
  }

  plate =
    plate ??
    labelValue(normalized, ["rejestracja", "nr rej", "rej.", "tablica"]);

  const mileageRaw = labelValue(normalized, ["przebieg", "stan licznika"]);
  const mileage = mileageRaw
    ? Number.parseInt(mileageRaw.replace(/\D/g, ""), 10) || undefined
    : undefined;

  let { services, parts } = extractGenericLineItems(normalized);
  if (services.length === 0 && parts.length === 0) {
    for (const rawLine of normalized.split(/\n/)) {
      const trimmed = rawLine.trim();
      if (!trimmed || SKIP_LINE.test(trimmed) || SUMMARY_LINE.test(trimmed)) continue;
      const dual = tryPartFromDualPrice(trimmed);
      if (dual) {
        parts.push(dual);
        continue;
      }
      const svc = tryServiceLine(trimmed);
      if (svc) services.push(svc);
    }
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
    internalNotes: orderNumber ? `Import: ${orderNumber}` : "Import PDF/foto",
    warnings,
  };
}

export function parseWorkOrderImportText(text: string): ImportWorkOrderDraft {
  const normalized = normalizeOcrForImport(text);
  if (isMotowarsztatKosztorys(normalized)) {
    return parseMotowarsztatKosztorys(normalized);
  }
  return parseGeneric(normalized);
}
