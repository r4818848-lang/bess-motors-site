/** Monthly parts log — purchase & sell (Telegram admin / CRM). Prices entered as brutto. */

export const MONTHLY_PARTS_VAT_RATE = 0.23;

export type MonthlyPartEntry = {
  id: string;
  /** YYYY-MM */
  month: string;
  name: string;
  partNumber: string;
  /** Purchase brutto (user input) */
  purchaseBrutto?: number;
  purchaseNetto?: number;
  /** Sale brutto (user input) */
  sellBrutto?: number;
  sellNetto?: number;
  /** @deprecated legacy — treated as netto if brutto fields missing */
  purchasePrice?: number;
  sellPrice?: number;
  qty: number;
  createdAt: string;
  source?: "telegram" | "telegram-invoice" | "crm";
};

export type NormalizedPartPrices = {
  purchaseBrutto: number;
  purchaseNetto: number;
  sellBrutto: number;
  sellNetto: number;
};

export function bruttoToNetto(brutto: number): number {
  return Math.round((brutto / (1 + MONTHLY_PARTS_VAT_RATE)) * 100) / 100;
}

export function nettoToBrutto(netto: number): number {
  return Math.round(netto * (1 + MONTHLY_PARTS_VAT_RATE) * 100) / 100;
}

/** Resolve brutto/netto for display and totals (brutto input wins; legacy netto-only supported). */
export function normalizePartPrices(e: MonthlyPartEntry): NormalizedPartPrices {
  const purchaseBrutto =
    e.purchaseBrutto ?? nettoToBrutto(e.purchaseNetto ?? e.purchasePrice ?? 0);
  const purchaseNetto =
    e.purchaseBrutto != null
      ? bruttoToNetto(e.purchaseBrutto)
      : (e.purchaseNetto ?? e.purchasePrice ?? bruttoToNetto(purchaseBrutto));

  const sellBrutto = e.sellBrutto ?? nettoToBrutto(e.sellNetto ?? e.sellPrice ?? 0);
  const sellNetto =
    e.sellBrutto != null
      ? bruttoToNetto(e.sellBrutto)
      : (e.sellNetto ?? e.sellPrice ?? bruttoToNetto(sellBrutto));

  return { purchaseBrutto, purchaseNetto, sellBrutto, sellNetto };
}

export function formatMoneyPln(n: number): string {
  return n.toFixed(2);
}

export function currentMonthKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
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

export function parsePartMoneyInput(text: string): number | null {
  return parseMoney(text);
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
  const [, m, day] = d.split("-");
  return `${day}.${m}`;
}

export const TELEGRAM_SAFE_HTML_LIMIT = 3800;

export function escapePreText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function clipCell(text: string, max: number): string {
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
    const p = normalizePartPrices(r);
    purchaseNetto += p.purchaseNetto * q;
    purchaseBrutto += p.purchaseBrutto * q;
    sellNetto += p.sellNetto * q;
    sellBrutto += p.sellBrutto * q;
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

export type FormatMonthlyPartsTableOpts = {
  icon?: string;
  listName?: string;
};

export function formatMonthlyPartsTable(
  items: MonthlyPartEntry[],
  month: string,
  opts?: FormatMonthlyPartsTableOpts
): string {
  const icon = opts?.icon ?? "📦";
  const listName = opts?.listName ?? "Запчасти";
  const rows = filterMonthlyParts(items, month);
  if (!rows.length) {
    return `${icon} <b>${listName} — ${formatMonthLabel(month)}</b>\n\nПока пусто. Нажмите «Добавить».`;
  }

  const totals = computeMonthlyPartsTotals(rows);
  const header =
    `${icon} <b>${listName} — ${formatMonthLabel(month)}</b>\n` +
    `Позиций: <b>${totals.count}</b>\n\n`;

  const buildBody = (rowLimit: number): string => {
    const lines: string[] = [];
    lines.push(
      clipCell("Дата", 6) +
        clipCell("Название", 16) +
        clipCell("Зак.N", 8) +
        clipCell("Зак.B", 8) +
        clipCell("Пр.N", 8) +
        clipCell("Пр.B", 8)
    );
    lines.push("─".repeat(54));

    const shown = rows.slice(0, rowLimit);
    for (const r of shown) {
      const q = r.qty || 1;
      const p = normalizePartPrices(r);
      lines.push(
        clipCell(formatRowDate(r.createdAt), 6) +
          clipCell(r.name, 16) +
          clipCell(formatMoneyPln(p.purchaseNetto * q), 8) +
          clipCell(formatMoneyPln(p.purchaseBrutto * q), 8) +
          clipCell(formatMoneyPln(p.sellNetto * q), 8) +
          clipCell(formatMoneyPln(p.sellBrutto * q), 8)
      );
    }
    if (rows.length > rowLimit) {
      lines.push(`… ещё ${rows.length - rowLimit} поз.`);
    }

    lines.push("─".repeat(54));
    lines.push(
      `Итого закуп (нет/брут): ${formatMoneyPln(totals.purchaseNetto)} / ${formatMoneyPln(totals.purchaseBrutto)} zł`
    );
    lines.push(
      `Итого продажа (нет/брут): ${formatMoneyPln(totals.sellNetto)} / ${formatMoneyPln(totals.sellBrutto)} zł`
    );
    lines.push(
      `Прибыль (нет/брут): ${formatMoneyPln(totals.profitNetto)} / ${formatMoneyPln(totals.profitBrutto)} zł`
    );
    lines.push(`VAT ${Math.round(MONTHLY_PARTS_VAT_RATE * 100)}% — ввод брутто, нетто авто`);
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

export function formatMonthlyPartsList(
  items: MonthlyPartEntry[],
  month: string
): string {
  return formatMonthlyPartsTable(items, month);
}

export function formatMonthlyInvoicePartsTable(
  items: MonthlyPartEntry[],
  month: string
): string {
  return formatMonthlyPartsTable(items, month, {
    icon: "🧾",
    listName: "На фактуру",
  });
}

export function createMonthlyPartEntry(
  month: string,
  fields: {
    name: string;
    partNumber: string;
    purchaseBrutto: number;
    sellBrutto: number;
    qty?: number;
  },
  opts?: { idPrefix?: string; source?: MonthlyPartEntry["source"] }
): MonthlyPartEntry {
  const purchaseNetto = bruttoToNetto(fields.purchaseBrutto);
  const sellNetto = bruttoToNetto(fields.sellBrutto);
  return {
    id: `${opts?.idPrefix ?? "mp"}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    month,
    name: fields.name.trim(),
    partNumber: fields.partNumber.trim(),
    purchaseBrutto: fields.purchaseBrutto,
    purchaseNetto,
    sellBrutto: fields.sellBrutto,
    sellNetto,
    purchasePrice: purchaseNetto,
    sellPrice: sellNetto,
    qty: fields.qty ?? 1,
    createdAt: new Date().toISOString(),
    source: opts?.source ?? "telegram",
  };
}

export function createMonthlyInvoicePartEntry(
  month: string,
  fields: {
    name: string;
    partNumber: string;
    purchaseBrutto: number;
    sellBrutto: number;
    qty?: number;
  }
): MonthlyPartEntry {
  return createMonthlyPartEntry(month, fields, {
    idPrefix: "mip",
    source: "telegram-invoice",
  });
}
