/** Heuristic parse of Motowarsztat kosztorys / workshop PDF text → CRM work order draft */

import { reflowImportOcrText } from "@/lib/import-ocr-reflow";
import { normalizeImportDraftPrices } from "@/lib/import-draft-validate";

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
  /^(razem|suma|vat|netto|brutto|total|data|zlecenie|telefon|vin|rej|podsumowanie|do zapłaty|wartość|kwota|łącznie|kosztorys|ilość|j\.?\s*m\.?|cena brutto|koszt brutto|nazwa|dane klienta|dane pojazdu|osoba uprawniona|podpis klienta|status|data utworzenia|nip|aleja|krakowska|bessmotors|spółka|spolka|www\.|http|udzielono\s+rabatu)/i;

const SUMMARY_LINE = /\b(łącznie|razem)\b/i;

const TABLE_HEADER_LINE = /^lp\.?\s+nazwa\b/i;

const WORKSHOP_PHONES = new Set(["791257229", "48791257229", "5223374059"]);

function normalizeTableLine(line: string): string {
  return line.replace(/\t/g, " ").replace(/\s+/g, " ").trim();
}

function isWorkshopPhone(digits: string): boolean {
  const d = digits.replace(/\D/g, "");
  const last9 = d.slice(-9);
  return WORKSHOP_PHONES.has(d) || WORKSHOP_PHONES.has(last9);
}

function cleanClientName(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const t = raw.replace(/\s+/g, " ").trim();
  if (t.length < 2) return undefined;
  if (
    /^(numer\s+telefonu|telefon|adres|nip|e-?mail|imię|imie|imig)\s*:/i.test(t) ||
    /^firmy\s*:/i.test(t)
  ) {
    return undefined;
  }
  return t;
}

function stripRowIndex(name: string): string {
  return name.replace(/^\d+\s+/, "").trim();
}

function cleanPlate(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toUpperCase();
}

const INVALID_PLATE_WORDS =
  /^(LICZNIKA|LICZNIK|REJESTR|REJESTRACJI|TABLICA|NUMER|STAN|PRZEBIEG|KM|VIN|AUDI|FORD|BMW)$/i;

function isLikelyPlateToken(p: string): boolean {
  if (p.length < 4 || p.length > 9) return false;
  if (INVALID_PLATE_WORDS.test(p)) return false;
  if (!/[A-Z]/.test(p) || !/\d/.test(p)) return false;
  return true;
}

function parsePlMoney(raw: string): number {
  const n = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

/** Koszt brutto per line (what the PDF shows in the last money column). */
function lineTotalPrice(unitPrice: number, lineTotal: number, qty: number): number {
  const q = qty > 0 ? qty : 1;
  if (lineTotal > 0) return parsePlMoney(String(lineTotal));
  if (unitPrice > 0) return parsePlMoney(String(unitPrice * q));
  return 0;
}

/** Kosztorys columns (Cena brutto + Koszt brutto) are both sell — last column is line total. */
function kosztorysSellFromPrices(prices: number[]): number {
  if (!prices.length) return 0;
  return prices[prices.length - 1]!;
}

function extractQtyBeforeUnit(line: string): number {
  const m = line.match(/\b(\d+(?:[.,]\d+)?)\s+(?:oper|szt\.?|aper|apt|jm\.?)\b/i);
  if (!m) return 1;
  const q = parsePlMoney(m[1]);
  return q > 0 ? q : 1;
}

function normalizeText(text: string): string {
  return text.replace(/\r/g, "\n").replace(/\u00a0/g, " ");
}

function isMotowarsztatKosztorys(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("kosztorys") ||
    lower.includes("bessmotors") ||
    (lower.includes("dane klienta") && lower.includes("usługi")) ||
    (lower.includes("dane klienta") && lower.includes("uslugi")) ||
    (lower.includes("dane kienta") && lower.includes("usługi")) ||
    (lower.includes("dane pojazdu") && lower.includes("towary")) ||
    (lower.includes("dane pojazd") && lower.includes("towary")) ||
    (/\bzl\s*\d+\//i.test(text) && lower.includes("towary"))
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

/** Legacy row without Lp. column (OCR / old exports). */
const MW_TABLE_ROW_LEGACY =
  /^(.+?)\s+(\d+(?:[.,]\d+)?)\s+(oper|szt\.?|aper|apt)\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl)?\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl)?\s*$/i;

/** Motowarsztat table row: Lp Name qty oper|szt unitPrice lineTotal */
const MW_TABLE_ROW =
  /^\d+\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+(oper|szt\.?)\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl)?\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl)?\s*$/i;

const MW_TABLE_ROW_ZL_STUCK =
  /^\d+\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+(oper|szt\.?)\s+(\d[\d\s]*[.,]\d{2})(?:zł|zl)(\d[\d\s]*[.,]\d{2})(?:zł|zl)?\s*$/i;

/** Row with Rabat / Cena po rabacie columns — use final Koszt brutto as line total. */
const MW_TABLE_ROW_DISCOUNT =
  /^\d+\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+(oper|szt\.?)\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl)?\s+\d+\s*%\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl)?\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl)?\s*$/i;

/** OCR misreads «szt» as «aper», «oper», column headers merge into rows. */
const MW_TABLE_ROW_OCR =
  /^\d+\s+(.+?)\s+(\d+(?:[.,]\d+)?)\s+(?:aper|szt\.?|oper|apt|jm\.?)\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl)\s+(\d[\d\s]*[.,]\d{2})\s*(?:zł|zl)?\s*$/i;

function rowMatchesMotowarsztatTable(line: string): boolean {
  const n = normalizeTableLine(line);
  return (
    MW_TABLE_ROW.test(n) ||
    MW_TABLE_ROW_ZL_STUCK.test(n) ||
    MW_TABLE_ROW_DISCOUNT.test(n) ||
    MW_TABLE_ROW_OCR.test(n) ||
    MW_TABLE_ROW_LEGACY.test(n)
  );
}

function tryMotowarsztatTableRow(
  line: string,
  kind: "labor" | "parts"
): ImportServiceDraft | ImportPartDraft | null {
  const trimmed = normalizeTableLine(line);
  if (trimmed.length < 8 || SKIP_LINE.test(trimmed) || SUMMARY_LINE.test(trimmed)) {
    return null;
  }
  if (LABOR_SECTION.test(trimmed) || PARTS_SECTION.test(trimmed)) return null;
  if (TABLE_HEADER_LINE.test(trimmed)) return null;
  if (/udzielono\s+rabatu/i.test(trimmed)) return null;

  const discountM = trimmed.match(MW_TABLE_ROW_DISCOUNT);
  const ocrM = trimmed.match(MW_TABLE_ROW_OCR);
  const stdM = trimmed.match(MW_TABLE_ROW) ?? trimmed.match(MW_TABLE_ROW_ZL_STUCK);
  const legacyM = !/^\d+\s/.test(trimmed) ? trimmed.match(MW_TABLE_ROW_LEGACY) : null;
  if (!discountM && !ocrM && !stdM && !legacyM) return null;

  const rawName = (discountM ?? ocrM ?? stdM ?? legacyM)![1].replace(/\s*:\s*$/, "").trim();
  const name = stripRowIndex(rawName);
  if (name.length < 3 || /^\d+$/.test(name)) return null;

  let qty = 1;
  let unitPrice = 0;
  let lineTotal = 0;
  if (discountM) {
    qty = parsePlMoney(discountM[2]) || 1;
    unitPrice = parsePlMoney(discountM[5]);
    lineTotal = parsePlMoney(discountM[6]);
  } else if (ocrM) {
    qty = parsePlMoney(ocrM[2]) || 1;
    unitPrice = parsePlMoney(ocrM[3]);
    lineTotal = parsePlMoney(ocrM[4]);
  } else if (stdM) {
    qty = parsePlMoney(stdM[2]) || 1;
    unitPrice = parsePlMoney(stdM[4]);
    lineTotal = parsePlMoney(stdM[5]);
  } else if (legacyM) {
    qty = parsePlMoney(legacyM[2]) || 1;
    unitPrice = parsePlMoney(legacyM[4]);
    lineTotal = parsePlMoney(legacyM[5]);
  }
  if (unitPrice <= 0 && lineTotal <= 0) return null;

  const q = qty > 0 ? qty : 1;
  const bruttoLine = lineTotalPrice(unitPrice, lineTotal, q);

  if (kind === "labor") {
    return { name: name.slice(0, 200), qty: q, price: bruttoLine };
  }

  return {
    name: name.slice(0, 200),
    qty: q,
    purchasePrice: 0,
    sellPrice: bruttoLine,
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
    /dane\s+klien/i,
    /dane\s+pojazd|usługi|uslugi|towary/i
  );
  const vehicleBlock = sliceBlock(
    text,
    /dane\s+pojazd/i,
    /usługi|uslugi|towary|podsumowanie|kosztorys/i
  );

  if (clientBlock) {
    const email = clientBlock.match(EMAIL_RE)?.[0];
    if (email) result.email = email;

    const personName = clientBlock.match(/imię\s+i\s+nazwisko\s*:\s*([^\n]*)/i)?.[1];
    const cleanedPerson = cleanClientName(personName);
    if (cleanedPerson) result.clientName = cleanedPerson;

    if (!result.clientName) {
      const company = clientBlock.match(
        /nazwa\s+firmy\s*:\s*([\s\S]*?)(?=\n\s*(?:nip|adres|dane\s+pojazd)|$)/i
      )?.[1];
      const cleanedCompany = cleanClientName(
        company?.replace(/\s+/g, " ").trim()
      );
      if (cleanedCompany) result.clientName = cleanedCompany;
    }

    for (const line of clientBlock.split(/\n/)) {
      const t = line.trim();
      if (!t) continue;
      const tel = t.match(/(?:numer\s+)?telefon\w*[:\s]+(\d[\d\s-]{8,12})/i);
      if (tel) {
        const digits = tel[1].replace(/\D/g, "");
        if (digits.length >= 9 && !isWorkshopPhone(digits)) {
          result.phone = `+48${digits.slice(-9)}`;
        }
      }
    }

    if (!result.clientName) {
      for (const line of clientBlock.split(/\n/)) {
        const t = line.trim();
        if (
          t.length >= 4 &&
          /^[A-Za-zÀ-ž][A-Za-zÀ-ž\s.'-]{2,}$/.test(t) &&
          !/telefon|email|nip|ul\.|ulica|@|\d{5}/i.test(t) &&
          cleanClientName(t)
        ) {
          result.clientName = cleanClientName(t);
          break;
        }
      }
    }

    if (!result.phone) {
      const phones = [...clientBlock.matchAll(/\b(\d{9})\b/g)].map((x) => x[1]);
      const mobile = phones.find((p) => /^[5-9]/.test(p) && !isWorkshopPhone(p));
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
      const cleaned = mm.replace(/\s*(numer|vin|rej|stan)\b.*/i, "").trim();
      const words = cleaned.split(/\s+/).filter(Boolean);
      if (words.length) {
        result.make = words[0];
        result.model = words.slice(1).join(" ") || words[0];
      }
    }

    const mileageMatch = vehicleBlock.match(
      /(?:stan licznika|przebieg)[:\s]+(\d[\d\s]*)\s*km/i
    );
    if (mileageMatch) {
      const n = Number.parseInt(mileageMatch[1].replace(/\s/g, ""), 10);
      if (n > 0) result.mileage = n;
    }

    const regLine = vehicleBlock.match(
      /numer\s+rejestracyjny\s*:?\s*\n?\s*([^\n]+)/i
    )?.[1];
    if (regLine) {
      const candidate = regLine.trim();
      if (
        candidate &&
        !/^vin\b/i.test(candidate) &&
        !VIN_RE.test(candidate) &&
        candidate.length <= 12
      ) {
        const p = cleanPlate(candidate);
        if (isLikelyPlateToken(p)) result.plate = p;
      }
    }

    if (!result.plate && vehicleBlock) {
      const vLines = vehicleBlock.split(/\n/).map((l) => l.trim()).filter(Boolean);
      for (let i = 0; i < vLines.length; i++) {
        if (!/numer\s+rejestracyjny/i.test(vLines[i]!)) continue;
        const sameLine = vLines[i]!
          .replace(/numer\s+rejestracyjny\s*:?\s*/i, "")
          .trim();
        if (sameLine && isLikelyPlateToken(cleanPlate(sameLine))) {
          result.plate = cleanPlate(sameLine);
          break;
        }
        for (let j = i + 1; j < Math.min(i + 3, vLines.length); j++) {
          const cand = vLines[j]!;
          if (/^vin\b/i.test(cand) || VIN_RE.test(cand)) break;
          if (/^(marka|poziom|stan)\b/i.test(cand)) continue;
          const p = cleanPlate(cand);
          if (isLikelyPlateToken(p)) {
            result.plate = p;
            break;
          }
        }
        if (result.plate) break;
      }
    }

    if (!result.plate) {
      for (const m of vehicleBlock.matchAll(PLATE_RE)) {
        const p = cleanPlate(m[1]);
        if (isLikelyPlateToken(p) && !/^VIN/i.test(p)) {
          result.plate = p;
          break;
        }
      }
    }
  }

  if (!result.make && lower.includes("audi")) {
    result.make = "Audi";
    if (!result.model) result.model = "A4";
  }
  if (result.make?.toLowerCase().startsWith("aud") && !result.model?.match(/\d/)) {
    result.make = "Audi";
    if (!result.model || result.model.length <= 3) result.model = "A4";
  }

  if (!result.clientName) {
    const personFallback = cleanClientName(
      text.match(/imię\s+i\s+nazwisko\s*:\s*([^\n]*)/i)?.[1]
    );
    if (personFallback) {
      result.clientName = personFallback.split(/\bmarka\b/i)[0]!.trim();
    }
  }

  if (!result.phone) {
    const labeled =
      text.match(/numer\s+telefonu\s*:\s*(\d[\d\s-]{8,12})/i)?.[1] ??
      text.match(/(?:numer\s+)?telefon\w*[:\s]+(\d{9})/i)?.[1];
    if (labeled) {
      const digits = labeled.replace(/\D/g, "");
      if (digits.length >= 9 && !isWorkshopPhone(digits)) {
        result.phone = `+48${digits.slice(-9)}`;
      }
    }
    if (!result.phone) {
      const mobile = [...text.matchAll(/\b([5-9]\d{8})\b/g)]
        .map((m) => m[1])
        .find((p) => !isWorkshopPhone(p));
      if (mobile) result.phone = `+48${mobile}`;
    }
  }

  if (!result.email) {
    const em = text.match(/e-?mail[:\s]+([^\s@]+@[^\s\n]+)/i)?.[1];
    if (em) result.email = em.replace(/\s+/, ".").replace(/\s/g, "");
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
    const trimmed = lines[i].trim();
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
    if (TABLE_HEADER_LINE.test(trimmed)) continue;

    let combined = trimmed;
    if (!rowMatchesMotowarsztatTable(combined) && i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (!TABLE_HEADER_LINE.test(trimmed) && !TABLE_HEADER_LINE.test(next)) {
        const attempt = `${trimmed} ${next}`;
        if (rowMatchesMotowarsztatTable(attempt)) {
          combined = attempt;
          i += 1;
        }
      }
    }

    if (section === "labor") {
      const row = tryMotowarsztatTableRow(combined, "labor");
      if (row && "price" in row) {
        services.push(row);
      } else {
        const svc = tryServiceLine(combined);
        if (svc) services.push(svc);
      }
    } else {
      const row = tryMotowarsztatTableRow(combined, "parts");
      if (row && "sellPrice" in row) {
        parts.push(row);
      } else {
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
  const normalized = normalizeText(text);
  const meta = parseMotowarsztatBlocks(normalized);
  let { services, parts } = extractMotowarsztatLineItems(normalized);

  if (services.length === 0 && parts.length === 0) {
    const generic = extractGenericLineItems(normalized);
    services = generic.services;
    parts = generic.parts;
  }

  services = dedupeServices(services);
  parts = dedupeParts(parts);

  if (services.length === 0 && parts.length === 0) warnings.push("no_lines_detected");
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
  if (/udzielono\s+rabatu/i.test(trimmed)) return null;

  const prices = [...trimmed.matchAll(/(\d[\d\s]*[.,]\d{2})\s*(?:zł|pln)?/gi)].map((m) =>
    parsePlMoney(m[1])
  );
  if (prices.length === 0) return null;

  let name = trimmed;
  for (const m of trimmed.matchAll(/(\d[\d\s]*[.,]\d{2})\s*(?:zł|pln)?/gi)) {
    name = name.replace(m[0], " ");
  }
  name = name.replace(/\s+/g, " ").trim();
  if (name.length < 2 || /^\d+$/.test(name) || SUMMARY_LINE.test(name)) return null;

  const qty = extractQtyBeforeUnit(trimmed);
  const sell = kosztorysSellFromPrices(prices);
  return { name: name.slice(0, 200), qty, price: sell };
}

function tryPartFromDualPrice(line: string): ImportPartDraft | null {
  const trimmed = line.trim();
  if (trimmed.length < 6 || SKIP_LINE.test(trimmed) || SUMMARY_LINE.test(trimmed)) return null;
  if (/udzielono\s+rabatu/i.test(trimmed)) return null;

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

  const qty = extractQtyBeforeUnit(trimmed);
  const sell = kosztorysSellFromPrices(prices);

  // Three+ money values on one line → likely CRM screenshot (purchase + sell + total)
  if (prices.length >= 3) {
    const sorted = [...prices].sort((a, b) => a - b);
    const purchase = sorted[0]!;
    const maxSell = sorted[sorted.length - 1]!;
    if (purchase < maxSell * 0.98) {
      return {
        name: name.slice(0, 200),
        qty,
        purchasePrice: purchase,
        sellPrice: maxSell,
      };
    }
  }

  return {
    name: name.slice(0, 200),
    qty,
    purchasePrice: 0,
    sellPrice: sell,
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
    if (isLikelyPlateToken(p)) {
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

  if (services.length === 0 && parts.length === 0) warnings.push("no_lines_detected");
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
  const normalized = reflowImportOcrText(normalizeText(text));
  const draft = isMotowarsztatKosztorys(normalized)
    ? parseMotowarsztatKosztorys(normalized)
    : parseGeneric(normalized);
  return normalizeImportDraftPrices(draft);
}
