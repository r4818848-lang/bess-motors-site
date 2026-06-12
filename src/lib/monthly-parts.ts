/** Monthly parts log — purchase vs sell prices (Telegram admin / CRM) */

export const MONTHLY_PARTS_VAT_RATE = 0.23;

export type MonthlyPartEntry = {
  id: string;
  /** YYYY-MM */
  month: string;
  name: string;
  partNumber: string;
  /** Purchase price netto (zł) */
  purchasePrice: number;
  /** Sale price netto (zł) */
  sellPrice: number;
  qty: number;
  createdAt: string;
  source?: "telegram" | "crm";
};

export function nettoToBrutto(netto: number): number {
  return Math.round(netto * (1 + MONTHLY_PARTS_VAT_RATE) * 100) / 100;
}

export function formatMoneyPln(n: number): string {
  return n.toFixed(2);
}

export function currentMonthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

export function shiftMonthKey(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return currentMonthKey(date);
}

export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const names = [
    "январь",
    "февраль",
    "март",
    "апрель",
    "май",
    "июнь",
    "июль",
    "август",
    "сентябрь",
    "октябрь",
    "ноябрь",
    "декабрь",
  ];
  const idx = Number.parseInt(m, 10) - 1;
  return `${names[idx] ?? m} ${y}`;
}

function parseMoney(raw: string): number | null {
  const n = Number.parseFloat(raw.trim().replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export type ParsedPartLine =
  | {
      ok: true;
      name: string;
      partNumber: string;
      purchasePrice: number;
      sellPrice: number;
      qty: number;
    }
  | { ok: false };

/** One line: название; номер; закуп; продажа — or without номер */
export function parseMonthlyPartLine(line: string): ParsedPartLine {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return { ok: false };

  const semi = trimmed.split(";").map((s) => s.trim());
  if (semi.length >= 4) {
    const sell = parseMoney(semi[semi.length - 1]);
    const purchase = parseMoney(semi[semi.length - 2]);
    if (sell == null || purchase == null) return { ok: false };
    const partNumber = semi[semi.length - 3];
    const name = semi.slice(0, semi.length - 3).join("; ").trim();
    if (!name) return { ok: false };
    return {
      ok: true,
      name,
      partNumber,
      purchasePrice: purchase,
      sellPrice: sell,
      qty: 1,
    };
  }

  if (semi.length === 3) {
    const sell = parseMoney(semi[2]);
    const purchase = parseMoney(semi[1]);
    const name = semi[0].trim();
    if (!name || sell == null || purchase == null) return { ok: false };
    return {
      ok: true,
      name,
      partNumber: "",
      purchasePrice: purchase,
      sellPrice: sell,
      qty: 1,
    };
  }

  return { ok: false };
}

export function parseMonthlyPartLines(text: string): {
  entries: ParsedPartLine[];
  invalidLines: number;
} {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const entries: ParsedPartLine[] = [];
  let invalidLines = 0;
  for (const line of lines) {
    const parsed = parseMonthlyPartLine(line);
    if (parsed.ok) entries.push(parsed);
    else invalidLines += 1;
  }
  return { entries, invalidLines };
}

export function filterMonthlyParts(
  items: MonthlyPartEntry[] | undefined,
  month: string
): MonthlyPartEntry[] {
  return (items ?? [])
    .filter((e) => e.month === month)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function formatRowDate(iso: string): string {
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split("-");
  return `${day}.${m}`;
}

const TELEGRAM_SAFE_HTML_LIMIT = 3800;

function escapePreText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clipCell(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t.padEnd(max, " ");
  return `${t.slice(0, max - 1)}…`;
}

export type MonthlyPartsTotals = {
  purchaseNetto: number;
  purchaseBrutto: number;
  sellNetto: number;
  sellBrutto: number;
  profitNetto: number;
  profitBrutto: number;
  count: number;
};

export function computeMonthlyPartsTotals(rows: MonthlyPartEntry[]): MonthlyPartsTotals {
  let purchaseNetto = 0;
  let purchaseBrutto = 0;
  let sellNetto = 0;
  let sellBrutto = 0;

  for (const r of rows) {
    const q = r.qty || 1;
    const buyN = r.purchasePrice * q;
    const sellN = r.sellPrice * q;
    purchaseNetto += buyN;
    purchaseBrutto += nettoToBrutto(r.purchasePrice) * q;
    sellNetto += sellN;
    sellBrutto += nettoToBrutto(r.sellPrice) * q;
  }

  return {
    purchaseNetto,
    purchaseBrutto,
    sellNetto,
    sellBrutto,
    profitNetto: sellNetto - purchaseNetto,
    profitBrutto: sellBrutto - purchaseBrutto,
    count: rows.length,
  };
}

/** Monospace table for Telegram (&lt;pre&gt;) */
export function formatMonthlyPartsTable(
  items: MonthlyPartEntry[],
  month: string
): string {
  const rows = filterMonthlyParts(items, month);
  if (!rows.length) {
    return `📦 <b>Запчасти — ${formatMonthLabel(month)}</b>\n\nПока пусто. Нажмите «Добавить».`;
  }

  const totals = computeMonthlyPartsTotals(rows);
  const header =
    `📦 <b>Запчасти — ${formatMonthLabel(month)}</b>\n` +
    `Позиций: <b>${totals.count}</b>\n\n`;

  const buildBody = (rowLimit: number): string => {
    const lines: string[] = [];
    lines.push(
      clipCell("Дата", 6) +
        clipCell("Название", 18) +
        clipCell("Зак.N", 8) +
        clipCell("Зак.B", 8) +
        clipCell("Пр.N", 8) +
        clipCell("Пр.B", 8)
    );
    lines.push("─".repeat(56));

    const shown = rows.slice(0, rowLimit);
    for (const r of shown) {
      const q = r.qty || 1;
      lines.push(
        clipCell(formatRowDate(r.createdAt), 6) +
          clipCell(r.name, 18) +
          clipCell(formatMoneyPln(r.purchasePrice * q), 8) +
          clipCell(formatMoneyPln(nettoToBrutto(r.purchasePrice) * q), 8) +
          clipCell(formatMoneyPln(r.sellPrice * q), 8) +
          clipCell(formatMoneyPln(nettoToBrutto(r.sellPrice) * q), 8)
      );
    }
    if (rows.length > rowLimit) {
      lines.push(`… ещё ${rows.length - rowLimit} поз.`);
    }

    lines.push("─".repeat(56));
    lines.push(
      `Итого закуп (нет/брут): ${formatMoneyPln(totals.purchaseNetto)} / ${formatMoneyPln(totals.purchaseBrutto)} zł`
    );
    lines.push(
      `Итого продажа (нет/брут): ${formatMoneyPln(totals.sellNetto)} / ${formatMoneyPln(totals.sellBrutto)} zł`
    );
    lines.push(
      `Прибыль (нет/брут): ${formatMoneyPln(totals.profitNetto)} / ${formatMoneyPln(totals.profitBrutto)} zł`
    );
    lines.push(`VAT ${Math.round(MONTHLY_PARTS_VAT_RATE * 100)}% — ввод нетто, брутто авто`);
    return escapePreText(lines.join("\n"));
  };

  let rowLimit = Math.min(rows.length, 25);
  let table = buildBody(rowLimit);
  while (header.length + table.length + 11 > TELEGRAM_SAFE_HTML_LIMIT && rowLimit > 3) {
    rowLimit -= 3;
    table = buildBody(rowLimit);
  }

  return `${header}<pre>${table}</pre>`;
}

/** @deprecated use formatMonthlyPartsTable */
export function formatMonthlyPartsList(
  items: MonthlyPartEntry[],
  month: string
): string {
  return formatMonthlyPartsTable(items, month);
}

export function createMonthlyPartEntry(
  month: string,
  fields: {
    name: string;
    partNumber: string;
    purchasePrice: number;
    sellPrice: number;
    qty?: number;
  }
): MonthlyPartEntry {
  return {
    id: `mp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    month,
    name: fields.name.trim(),
    partNumber: fields.partNumber.trim(),
    purchasePrice: fields.purchasePrice,
    sellPrice: fields.sellPrice,
    qty: fields.qty ?? 1,
    createdAt: new Date().toISOString(),
    source: "telegram",
  };
}

export function parsePartMoneyInput(text: string): number | null {
  return parseMoney(text);
}
