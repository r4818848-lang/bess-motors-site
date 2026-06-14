/** Service expenses — CRM / Telegram admin */

import type { ServiceExpense } from "./store";

export const TELEGRAM_EXPENSES_SAFE_LIMIT = 3800;

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

export function clipCell(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t.padEnd(max, " ");
  return `${t.slice(0, max - 1)}…`;
}

export function escapePreText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function filterExpensesByMonth(
  items: ServiceExpense[] | undefined,
  month: string
): ServiceExpense[] {
  return (items ?? [])
    .filter((e) => e.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function sortExpensesNewest(items: ServiceExpense[] | undefined): ServiceExpense[] {
  return [...(items ?? [])].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
  );
}

export type ExpensesTotals = {
  amount: number;
  count: number;
};

export function computeExpensesTotals(rows: ServiceExpense[]): ExpensesTotals {
  let amount = 0;
  for (const r of rows) amount += r.amount;
  return { amount, count: rows.length };
}

export type FormatExpensesTableOptions = {
  title: string;
  categoryLabel: (category: ServiceExpense["category"]) => string;
  rowLimit?: number;
  emptyHint?: string;
  /** Extra line under title (e.g. grand total for paginated view) */
  subtitle?: string;
};

export function formatExpensesTable(
  rows: ServiceExpense[],
  options: FormatExpensesTableOptions
): string {
  if (!rows.length) {
    return `💸 <b>${options.title}</b>\n\n${options.emptyHint ?? "Пока пусто."}`;
  }

  const totals = computeExpensesTotals(rows);
  const header =
    `💸 <b>${options.title}</b>\n` +
    (options.subtitle ? `${options.subtitle}\n` : "") +
    `Записей: <b>${totals.count}</b> · Итого: <b>${formatMoneyPln(totals.amount)} zł</b>\n\n`;

  const buildBody = (rowLimit: number): string => {
    const lines: string[] = [];
    lines.push(
      clipCell("Дата", 8) +
        clipCell("Кат.", 10) +
        clipCell("Сумма", 10) +
        clipCell("Описание", 20)
    );
    lines.push("─".repeat(48));

    for (const e of rows.slice(0, rowLimit)) {
      const [, m, d] = e.date.split("-");
      lines.push(
        clipCell(`${d}.${m}`, 8) +
          clipCell(options.categoryLabel(e.category), 10) +
          clipCell(formatMoneyPln(e.amount), 10) +
          clipCell(e.description, 20)
      );
    }
    if (rows.length > rowLimit) {
      lines.push(`… ещё ${rows.length - rowLimit} записей`);
    }

    lines.push("─".repeat(48));
    lines.push(`Итого: ${formatMoneyPln(totals.amount)} zł`);
    return escapePreText(lines.join("\n"));
  };

  let rowLimit = options.rowLimit ?? Math.min(rows.length, 40);
  let table = buildBody(rowLimit);
  while (header.length + table.length + 11 > TELEGRAM_EXPENSES_SAFE_LIMIT && rowLimit > 5) {
    rowLimit -= 5;
    table = buildBody(rowLimit);
  }

  return `${header}<pre>${table}</pre>`;
}
