/** Service expenses — CRM / Telegram admin */

import type { ServiceExpense } from "./store";

export const TELEGRAM_EXPENSES_SAFE_LIMIT = 3800;

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
  emptyHint?: string;
  subtitle?: string;
  /** @deprecated use buildExpensesListMessages for full lists */
  rowLimit?: number;
};

function formatExpenseRow(
  e: ServiceExpense,
  categoryLabel: (category: ServiceExpense["category"]) => string
): string {
  const [y, m, d] = e.date.split("-");
  const dateLabel = y && m && d ? `${d}.${m}.${y}` : e.date;
  return (
    clipCell(dateLabel, 10) +
    clipCell(categoryLabel(e.category), 10) +
    clipCell(formatMoneyPln(e.amount), 10) +
    clipCell(e.description, 20)
  );
}

function tableHeaderLine(): string {
  return (
    clipCell("Дата", 10) +
    clipCell("Кат.", 10) +
    clipCell("Сумма", 10) +
    clipCell("Описание", 20) +
    "\n" +
    "─".repeat(48)
  );
}

/** One message body: header + pre table (no outer title — caller adds). */
function wrapPreTable(inner: string): string {
  return `<pre>${escapePreText(inner)}</pre>`;
}

/**
 * Split full expense list across Telegram messages — all rows shown, no pagination UI.
 */
export function buildExpensesListMessages(
  rows: ServiceExpense[],
  options: Omit<FormatExpensesTableOptions, "rowLimit">
): string[] {
  if (!rows.length) {
    return [`💸 <b>${options.title}</b>\n\n${options.emptyHint ?? "Пока пусто."}`];
  }

  const totals = computeExpensesTotals(rows);
  const titleBlock =
    `💸 <b>${options.title}</b>\n` +
    (options.subtitle ? `${options.subtitle}\n` : "") +
    `Записей: <b>${totals.count}</b> · Итого: <b>${formatMoneyPln(totals.amount)} zł</b>\n\n`;

  const footer = "─".repeat(48) + `\nИтого: ${formatMoneyPln(totals.amount)} zł`;
  const rowLines = rows.map((e) => formatExpenseRow(e, options.categoryLabel));

  const messages: string[] = [];
  let chunkLines: string[] = [];
  let chunkIndex = 0;

  const flushChunk = (isLast: boolean) => {
    if (!chunkLines.length) return;
    const part =
      messages.length === 0
        ? titleBlock
        : "";
    const body =
      tableHeaderLine() +
      "\n" +
      chunkLines.join("\n") +
      (isLast ? `\n${footer}` : "");
    messages.push(part + wrapPreTable(body));
    chunkLines = [];
    chunkIndex++;
  };

  for (let i = 0; i < rowLines.length; i++) {
    const isLast = i === rowLines.length - 1;
    const trial = [...chunkLines, rowLines[i]];
    const trialBody =
      tableHeaderLine() +
      "\n" +
      trial.join("\n") +
      (isLast ? `\n${footer}` : "");
    const trialMsg =
      (messages.length === 0 ? titleBlock : `💸 <b>${options.title}</b>\n\n`) +
      wrapPreTable(trialBody);

    if (trialMsg.length > TELEGRAM_EXPENSES_SAFE_LIMIT && chunkLines.length > 0) {
      flushChunk(false);
      chunkLines.push(rowLines[i]);
      if (isLast) flushChunk(true);
    } else {
      chunkLines.push(rowLines[i]);
      if (isLast) flushChunk(true);
    }
  }

  return messages.length ? messages : [titleBlock + wrapPreTable(tableHeaderLine() + `\n${footer}`)];
}

export function formatExpensesTable(
  rows: ServiceExpense[],
  options: FormatExpensesTableOptions
): string {
  if (options.rowLimit != null) {
    return buildExpensesListMessages(rows.slice(0, options.rowLimit), options)[0];
  }
  return buildExpensesListMessages(rows, options)[0];
}
