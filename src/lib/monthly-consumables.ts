/** Monthly consumables — purchase only (no sale). Prices entered as brutto. */

import {
  TELEGRAM_SAFE_HTML_LIMIT,
  bruttoToNetto,
  clipCell,
  escapePreText,
  formatMoneyPln,
  formatMonthLabel,
} from "./monthly-parts";

export type MonthlyConsumableEntry = {
  id: string;
  month: string;
  name: string;
  partNumber: string;
  purchaseBrutto: number;
  purchaseNetto: number;
  qty: number;
  createdAt: string;
  source?: "telegram" | "crm";
};

export function filterMonthlyConsumables(
  items: MonthlyConsumableEntry[] | undefined,
  month: string
): MonthlyConsumableEntry[] {
  return (items ?? [])
    .filter((e) => e.month === month)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export type MonthlyConsumablesTotals = {
  purchaseNetto: number;
  purchaseBrutto: number;
  count: number;
};

/** Brutto is user input — netto always derived from brutto for totals/display. */
export function normalizeConsumablePrices(e: MonthlyConsumableEntry): {
  purchaseBrutto: number;
  purchaseNetto: number;
} {
  const purchaseBrutto = e.purchaseBrutto ?? 0;
  return {
    purchaseBrutto,
    purchaseNetto: bruttoToNetto(purchaseBrutto),
  };
}

export function computeMonthlyConsumablesTotals(
  rows: MonthlyConsumableEntry[]
): MonthlyConsumablesTotals {
  let purchaseNetto = 0;
  let purchaseBrutto = 0;
  for (const r of rows) {
    const q = r.qty || 1;
    const p = normalizeConsumablePrices(r);
    purchaseNetto += p.purchaseNetto * q;
    purchaseBrutto += p.purchaseBrutto * q;
  }
  return { purchaseNetto, purchaseBrutto, count: rows.length };
}

function formatRowDate(iso: string): string {
  const d = iso.slice(0, 10);
  const [, m, day] = d.split("-");
  return `${day}.${m}`;
}

export function formatMonthlyConsumablesTable(
  items: MonthlyConsumableEntry[],
  month: string
): string {
  const rows = filterMonthlyConsumables(items, month);
  if (!rows.length) {
    return `🧴 <b>Расходники — ${formatMonthLabel(month)}</b>\n\nПока пусто. Нажмите «Добавить».`;
  }

  const totals = computeMonthlyConsumablesTotals(rows);
  const header =
    `🧴 <b>Расходники — ${formatMonthLabel(month)}</b>\n` +
    `Позиций: <b>${totals.count}</b>\n\n`;

  const buildBody = (rowLimit: number): string => {
    const lines: string[] = [];
    lines.push(
      clipCell("Дата", 6) +
        clipCell("Название", 22) +
        clipCell("Зак.N", 10) +
        clipCell("Зак.B", 10)
    );
    lines.push("─".repeat(48));

    for (const r of rows.slice(0, rowLimit)) {
      const q = r.qty || 1;
      const p = normalizeConsumablePrices(r);
      lines.push(
        clipCell(formatRowDate(r.createdAt), 6) +
          clipCell(r.name, 22) +
          clipCell(formatMoneyPln(p.purchaseNetto * q), 10) +
          clipCell(formatMoneyPln(p.purchaseBrutto * q), 10)
      );
    }
    if (rows.length > rowLimit) {
      lines.push(`… ещё ${rows.length - rowLimit} поз.`);
    }

    lines.push("─".repeat(48));
    lines.push(
      `Итого закуп (нет/брут): ${formatMoneyPln(totals.purchaseNetto)} / ${formatMoneyPln(totals.purchaseBrutto)} zł`
    );
    lines.push(`VAT 23% — ввод брутто, нетто авто`);
    return escapePreText(lines.join("\n"));
  };

  let rowLimit = Math.min(rows.length, 30);
  let table = buildBody(rowLimit);
  while (header.length + table.length + 11 > TELEGRAM_SAFE_HTML_LIMIT && rowLimit > 3) {
    rowLimit -= 3;
    table = buildBody(rowLimit);
  }

  return `${header}<pre>${table}</pre>`;
}

export function createMonthlyConsumableEntry(
  month: string,
  fields: {
    name: string;
    partNumber: string;
    purchaseBrutto: number;
    qty?: number;
  }
): MonthlyConsumableEntry {
  const purchaseNetto = bruttoToNetto(fields.purchaseBrutto);
  return {
    id: `mc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    month,
    name: fields.name.trim(),
    partNumber: fields.partNumber.trim(),
    purchaseBrutto: fields.purchaseBrutto,
    purchaseNetto,
    qty: fields.qty ?? 1,
    createdAt: new Date().toISOString(),
    source: "telegram",
  };
}
