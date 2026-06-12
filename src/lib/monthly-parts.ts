/** Monthly parts log — purchase vs sell prices (Telegram admin / CRM) */

export type MonthlyPartEntry = {
  id: string;
  /** YYYY-MM */
  month: string;
  name: string;
  partNumber: string;
  purchasePrice: number;
  sellPrice: number;
  qty: number;
  createdAt: string;
  source?: "telegram" | "crm";
};

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

  const pipe = trimmed.split("|").map((s) => s.trim());
  if (pipe.length >= 4) {
    const sell = parseMoney(pipe[pipe.length - 1]);
    const purchase = parseMoney(pipe[pipe.length - 2]);
    if (sell == null || purchase == null) return { ok: false };
    return {
      ok: true,
      name: pipe.slice(0, pipe.length - 3).join(" | ").trim(),
      partNumber: pipe[pipe.length - 3],
      purchasePrice: purchase,
      sellPrice: sell,
      qty: 1,
    };
  }

  const priceMatch = trimmed.match(/^(.+?)\s+(\d+(?:[.,]\d{1,2})?)\s+(\d+(?:[.,]\d{1,2})?)\s*$/);
  if (priceMatch) {
    const sell = parseMoney(priceMatch[3]);
    const purchase = parseMoney(priceMatch[2]);
    if (sell == null || purchase == null) return { ok: false };
    return {
      ok: true,
      name: priceMatch[1].trim(),
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
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function formatMonthlyPartsList(
  items: MonthlyPartEntry[],
  month: string
): string {
  const rows = filterMonthlyParts(items, month);
  if (!rows.length) {
    return `📦 <b>Запчасти — ${formatMonthLabel(month)}</b>\n\nПока пусто. Нажмите «Добавить» и отправьте строки.`;
  }

  let totalBuy = 0;
  let totalSell = 0;
  const lines = rows.slice(0, 40).map((r, i) => {
    const buy = r.purchasePrice * r.qty;
    const sell = r.sellPrice * r.qty;
    totalBuy += buy;
    totalSell += sell;
    const num = r.partNumber ? ` · <code>${r.partNumber}</code>` : "";
    return (
      `${i + 1}. <b>${r.name}</b>${num}\n` +
      `   закуп <b>${r.purchasePrice.toFixed(2)}</b> → продажа <b>${r.sellPrice.toFixed(2)}</b> zł` +
      (r.qty !== 1 ? ` × ${r.qty}` : "")
    );
  });

  const more = rows.length > 40 ? `\n\n… и ещё ${rows.length - 40} поз.` : "";
  const margin = totalSell - totalBuy;

  return [
    `📦 <b>Запчасти — ${formatMonthLabel(month)}</b>`,
    `Позиций: <b>${rows.length}</b>`,
    "",
    ...lines,
    more,
    "",
    `Σ закуп: <b>${totalBuy.toFixed(2)} zł</b>`,
    `Σ продажа: <b>${totalSell.toFixed(2)} zł</b>`,
    `Маржа: <b>${margin >= 0 ? "+" : ""}${margin.toFixed(2)} zł</b>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function createMonthlyPartEntry(
  month: string,
  parsed: Extract<ParsedPartLine, { ok: true }>
): MonthlyPartEntry {
  return {
    id: `mp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    month,
    name: parsed.name,
    partNumber: parsed.partNumber,
    purchasePrice: parsed.purchasePrice,
    sellPrice: parsed.sellPrice,
    qty: parsed.qty,
    createdAt: new Date().toISOString(),
    source: "telegram",
  };
}
