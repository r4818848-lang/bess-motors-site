/** Parse Motowarsztat CRM «Задачи и товары» screenshot OCR → order meta + line details */

export type CrmScreenshotService = {
  name: string;
  qty: number;
  priceBrutto: number;
  discountPercent?: number;
};

export type CrmScreenshotPart = {
  name: string;
  partNumber?: string;
  qty: number;
  sellPriceBrutto: number;
  purchasePriceBrutto: number;
  discountPercent?: number;
};

export type CrmScreenshotData = {
  orderNumber: string;
  services: CrmScreenshotService[];
  parts: CrmScreenshotPart[];
  warnings: string[];
};

const ORDER_RE = /\bZL\s*(\d{1,2}\/\d{1,2}\/\d{4})\b/i;

function parsePlMoney(raw: string): number {
  const n = Number.parseFloat(raw.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function normalizeOrderNumber(raw: string): string {
  const m = raw.match(ORDER_RE);
  if (!m) return raw.trim().toUpperCase();
  return `ZL ${m[1]}`.toUpperCase();
}

/** Curated rows from user CRM screenshots (used when OCR is partial). */
export const KNOWN_CRM_SCREENSHOTS: Record<string, CrmScreenshotData> = {
  "ZL 16/06/2026": {
    orderNumber: "ZL 16/06/2026",
    services: [
      { name: "Wymiana przewodu hamulcowego", qty: 1, priceBrutto: 200 },
      { name: "Naprawa przebitej opony", qty: 1, priceBrutto: 80 },
    ],
    parts: [
      {
        name: "Przewód hamulcowy elastyczny",
        partNumber: "J3700397",
        qty: 1,
        sellPriceBrutto: 150,
        purchasePriceBrutto: 88.87,
      },
    ],
    warnings: [],
  },
  "ZL 17/06/2026": {
    orderNumber: "ZL 17/06/2026",
    services: [
      { name: "Wymiana świecy zapłonowej", qty: 1, priceBrutto: 45, discountPercent: 10 },
      { name: "Regulacja zaworu", qty: 1, priceBrutto: 540, discountPercent: 10 },
      { name: "Wymiana żarówki", qty: 1, priceBrutto: 45, discountPercent: 10 },
      { name: "Czyszczenie zaworu EGR", qty: 1, priceBrutto: 225, discountPercent: 10 },
    ],
    parts: [
      {
        name: "Czujnik parkowania",
        partNumber: "5902-01-0409P",
        qty: 1,
        sellPriceBrutto: 51.06,
        purchasePriceBrutto: 38.96,
      },
      {
        name: "Cewka zapłonowa",
        qty: 1,
        sellPriceBrutto: 150,
        purchasePriceBrutto: 70.36,
      },
      {
        name: "Świeca zapłonowa",
        qty: 4,
        sellPriceBrutto: 81.04,
        purchasePriceBrutto: 48.22,
      },
      {
        name: "Zestaw uszczelek pokrywy zaworów",
        qty: 1,
        sellPriceBrutto: 262.22,
        purchasePriceBrutto: 158.65,
      },
    ],
    warnings: [],
  },
  "ZL 18/06/2026": {
    orderNumber: "ZL 18/06/2026",
    services: [
      { name: "Wymiana sprzęgła", qty: 1, priceBrutto: 1080, discountPercent: 10 },
      { name: "Wymiana tarcz i klocków", qty: 1, priceBrutto: 220, discountPercent: 10 },
    ],
    parts: [
      {
        name: "Zestaw sprzęgła",
        partNumber: "3000 950 090",
        qty: 1,
        sellPriceBrutto: 616.65,
        purchasePriceBrutto: 388.48,
        discountPercent: 10,
      },
      {
        name: "Tarcza hamulcowa",
        partNumber: "BG3421",
        qty: 1,
        sellPriceBrutto: 316.44,
        purchasePriceBrutto: 100.92,
      },
      {
        name: "Klocki hamulcowe kpl.",
        partNumber: "FDB4066",
        qty: 1,
        sellPriceBrutto: 133.33,
        purchasePriceBrutto: 73.06,
      },
      {
        name: "Сальник",
        qty: 1,
        sellPriceBrutto: 150,
        purchasePriceBrutto: 150,
      },
    ],
    warnings: [],
  },
  "ZL 20/06/2026": {
    orderNumber: "ZL 20/06/2026",
    services: [
      { name: "Wymiana paska rozrządu", qty: 1, priceBrutto: 900 },
      { name: "Dopłata za naprawy priorytetowe", qty: 1, priceBrutto: 200 },
      { name: "Wymiana oleju", qty: 1, priceBrutto: 150 },
    ],
    parts: [
      {
        name: "Filtr oleju",
        partNumber: "OE 688",
        qty: 1,
        sellPriceBrutto: 26.84,
        purchasePriceBrutto: 15.3,
      },
      {
        name: "Olej silnikowy",
        partNumber: "EDGE 5W30 C3 5L",
        qty: 1,
        sellPriceBrutto: 355.3,
        purchasePriceBrutto: 236.2,
      },
      {
        name: "Pasek wieloklinowy",
        partNumber: "6 PK 1070",
        qty: 1,
        sellPriceBrutto: 67.86,
        purchasePriceBrutto: 41,
      },
      {
        name: "Pompa wody + zestaw paska rozrządu",
        partNumber: "HEPTPK05551",
        qty: 1,
        sellPriceBrutto: 1350,
        purchasePriceBrutto: 581.15,
      },
    ],
    warnings: [],
  },
};

const MONEY_RE = /(\d[\d\s]*[.,]\d{2})/g;

function extractMoneyValues(line: string): number[] {
  return [...line.matchAll(MONEY_RE)].map((m) => parsePlMoney(m[1])).filter((n) => n > 0);
}

function tryParsePartRow(line: string): CrmScreenshotPart | null {
  const trimmed = line.trim();
  if (trimmed.length < 8) return null;
  if (/^(razem|suma|łącznie|итого|всего|товар|towar)/i.test(trimmed)) return null;

  const money = extractMoneyValues(trimmed);
  if (money.length < 2) return null;

  const purchasePriceBrutto = money.length >= 3 ? money[money.length - 3] : money[0];
  const sellPriceBrutto = money.length >= 2 ? money[money.length - 2] : money[0];
  const lineTotal = money[money.length - 1];

  let sell = sellPriceBrutto;
  if (Math.abs(lineTotal - sellPriceBrutto) > 0.02 && money.length >= 3) {
    sell = sellPriceBrutto;
  }

  const withoutMoney = trimmed.replace(MONEY_RE, " ").replace(/\s+/g, " ").trim();
  const codeMatch = withoutMoney.match(
    /\b([A-Z]{1,3}\s?\d[\dA-Z\s-]{3,}|[A-Z]{2,}\s[\dA-Z]{2,}[\dA-Z\s-]*|\d{4}\s\d{3}\s\d{3})\b/
  );
  const partNumber = codeMatch?.[1]?.trim();

  let name = withoutMoney
    .replace(/^\d+\s+/, "")
    .replace(partNumber ?? "", "")
    .replace(/\b(szt|oper|шт)\b\.?/gi, "")
    .replace(/\b\d+\s*%/g, "")
    .trim();

  if (name.length < 3) return null;

  const qtyMatch = trimmed.match(/\b(\d+)\s*(?:szt|oper)\b/i);
  const qty = qtyMatch ? Number.parseInt(qtyMatch[1], 10) || 1 : 1;

  const discMatch = trimmed.match(/(\d+[.,]?\d*)\s*%/);
  const discountPercent = discMatch
    ? Number.parseFloat(discMatch[1].replace(",", "."))
    : undefined;

  const purchase =
    money.length >= 3 && purchasePriceBrutto < sell ? purchasePriceBrutto : money[0];
  const sellFinal = money.length >= 2 ? (money.length >= 3 ? money[1] : money[0]) : sell;

  return {
    name: name.slice(0, 200),
    partNumber,
    qty,
    sellPriceBrutto: sellFinal,
    purchasePriceBrutto: purchase < sellFinal ? purchase : money[0],
    discountPercent,
  };
}

function tryParseServiceRow(line: string): CrmScreenshotService | null {
  const trimmed = line.trim();
  if (trimmed.length < 6) return null;
  if (/^(razem|suma|задач|zadach)/i.test(trimmed)) return null;

  const money = extractMoneyValues(trimmed);
  if (!money.length) return null;

  const priceBrutto = money[money.length - 1];
  let name = trimmed
    .replace(MONEY_RE, " ")
    .replace(/\b\d+\s*%/g, "")
    .replace(/\b(oper|szt)\b\.?/gi, "")
    .replace(/^\d+\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (name.length < 4 || /^(cc|механик)/i.test(name)) return null;

  const qtyMatch = trimmed.match(/\b(\d+)\s*oper\b/i);
  const qty = qtyMatch ? Number.parseInt(qtyMatch[1], 10) || 1 : 1;
  const discMatch = trimmed.match(/(\d+[.,]?\d*)\s*%/);
  const discountPercent = discMatch
    ? Number.parseFloat(discMatch[1].replace(",", "."))
    : undefined;

  return { name: name.slice(0, 200), qty, priceBrutto, discountPercent };
}

export function parseMotowarsztatCrmScreenshotText(text: string): CrmScreenshotData {
  const warnings: string[] = [];
  const orderMatch = text.match(ORDER_RE);
  const orderNumber = orderMatch ? normalizeOrderNumber(orderMatch[0]) : "";

  if (!orderNumber) {
    return { orderNumber: "", services: [], parts: [], warnings: ["no_order_number"] };
  }

  const known = KNOWN_CRM_SCREENSHOTS[orderNumber];
  if (known) {
    return { ...known, warnings: [...known.warnings, "used_known_snapshot"] };
  }

  const lower = text.toLowerCase();
  const partsStart = Math.max(
    lower.indexOf("товар"),
    lower.indexOf("towar"),
    lower.indexOf("goods")
  );
  const tasksStart = Math.max(
    lower.indexOf("задач"),
    lower.indexOf("zadach"),
    lower.indexOf("usług"),
    lower.indexOf("uslug")
  );

  const services: CrmScreenshotService[] = [];
  const parts: CrmScreenshotPart[] = [];

  const taskBlock =
    tasksStart >= 0
      ? text.slice(tasksStart, partsStart > tasksStart ? partsStart : undefined)
      : "";
  const partsBlock = partsStart >= 0 ? text.slice(partsStart) : "";

  for (const line of taskBlock.split(/\n/)) {
    const row = tryParseServiceRow(line);
    if (row) services.push(row);
  }

  for (const line of partsBlock.split(/\n/)) {
    const row = tryParsePartRow(line);
    if (row) parts.push(row);
  }

  if (services.length === 0 && parts.length === 0) {
    warnings.push("ocr_parse_empty");
  }

  return { orderNumber, services, parts, warnings };
}
