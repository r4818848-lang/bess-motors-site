/** Parse supplier order screenshots (Telegram parts photo import). */

export type ParsedPartsOrderRow = {
  partNumber: string;
  name: string;
  priceBrutto: number;
};

const QTY_PRICE_TAIL =
  /\s+\d+\s+\d+\s+(\d{1,6}[.,]\d{2})\s*PLN(?:\s+\d{1,6}[.,]\d{2}\s*PLN)?\s*$/i;

const HEADER_RE =
  /^(товар|тobap|заказано|3akaza|обработано|o6pa|цена|леha|ценa|оптовая|оптовая|optov|скн|ндс|product|ordered|processed|wholesale)/i;

const STANDALONE_PLN_RE = /^(\d{1,6}[.,]\d{2})\s*(?:PLN|zł|zl)\s*$/i;

function parsePlnAmount(raw: string): number | null {
  const m = raw.trim().replace(",", ".").match(/^(\d{1,6})\.(\d{2})$/);
  if (!m) return null;
  const n = Number.parseFloat(`${m[1]}.${m[2]}`);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function cleanPartName(raw: string): string {
  return raw
    .replace(/^[<>{}\[\]|\\\/]+/g, "")
    .replace(/^[A-Za-zА-Яа-яЁё]{1,2}\s+(?=[A-Za-zА-Яа-яЁё])/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPartNumber(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function looksLikeCatalogCode(line: string): boolean {
  const t = cleanPartNumber(line);
  if (t.length < 2 || t.length > 36 || HEADER_RE.test(t)) return false;
  if (QTY_PRICE_TAIL.test(t) || STANDALONE_PLN_RE.test(t)) return false;
  if (/(?:[а-яё]{4,}|[a-ząćęłńóśźż]{4,})/u.test(t) && /\s+[а-яёa-ząćęłńóśźż]/iu.test(t)) {
    return false;
  }
  if (/^\d[\d\s./+-]{3,}$/.test(t)) return true;
  if (/^[A-ZА-Я0-9]{1,5}\s*[\d/+\-]/iu.test(t)) return true;
  if (/^[A-Z0-9][A-Z0-9\s/+\-.,]{2,}$/i.test(t) && !/\s+(?:фильтр|масло|filter|olej)/iu.test(t)) {
    return true;
  }
  return false;
}

function isPartNumberLine(line: string): boolean {
  return looksLikeCatalogCode(line);
}

function findPartNumberAbove(lines: string[], index: number): string {
  for (let j = index - 1; j >= Math.max(0, index - 4); j--) {
    const l = lines[j]!;
    if (l.length < 3 || HEADER_RE.test(l) || QTY_PRICE_TAIL.test(l)) continue;
    if (isPartNumberLine(l)) return cleanPartNumber(l);
    if (looksLikePartName(l)) break;
  }
  return "";
}

function looksLikePartName(line: string): boolean {
  const t = cleanPartName(line);
  if (t.length < 3 || HEADER_RE.test(t)) return false;
  if (QTY_PRICE_TAIL.test(t) || STANDALONE_PLN_RE.test(t)) return false;
  if (/^\d+\s+\d+/.test(t)) return false;
  if (looksLikeCatalogCode(t)) return false;
  return /[A-Za-zА-Яа-яЁёĄąĆćĘęŁłŃńÓóŚśŹźŻż]{2,}/u.test(t);
}

function parseInlineLayout(lines: string[]): ParsedPartsOrderRow[] {
  const results: ParsedPartsOrderRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (HEADER_RE.test(line)) continue;

    const tail = line.match(QTY_PRICE_TAIL);
    if (!tail) continue;

    const priceBrutto = parsePlnAmount(tail[1]!);
    if (priceBrutto == null) continue;

    let namePart = line.replace(QTY_PRICE_TAIL, "").trim();
    const partNumber = findPartNumberAbove(lines, i);

    if (isPartNumberLine(namePart)) {
      namePart = "";
    }

    const name = cleanPartName(namePart);
    if (!name) continue;

    results.push({
      partNumber,
      name,
      priceBrutto,
    });
  }

  return results;
}

function extractItemPairs(lines: string[]): { partNumber: string; name: string }[] {
  const items: { partNumber: string; name: string }[] = [];
  let pendingNumber: string | null = null;

  for (const line of lines) {
    if (HEADER_RE.test(line)) continue;
    if (STANDALONE_PLN_RE.test(line)) break;
    if (QTY_PRICE_TAIL.test(line)) break;

    if (isPartNumberLine(line)) {
      pendingNumber = cleanPartNumber(line);
      continue;
    }

    if (looksLikePartName(line)) {
      items.push({
        partNumber: pendingNumber ?? "",
        name: cleanPartName(line),
      });
      pendingNumber = null;
    }
  }

  return items;
}

function extractStandalonePrices(lines: string[]): number[] {
  const prices: number[] = [];
  for (const line of lines) {
    const m = line.match(STANDALONE_PLN_RE);
    if (!m) continue;
    const p = parsePlnAmount(m[1]!);
    if (p != null) prices.push(p);
  }

  if (prices.length >= 4 && prices.length % 2 === 0) {
    const half = prices.length / 2;
    const first = prices.slice(0, half);
    const second = prices.slice(half);
    if (first.every((v, i) => Math.abs(v - second[i]!) < 0.001)) {
      return first;
    }
  }

  return prices;
}

function parseColumnLayout(lines: string[]): ParsedPartsOrderRow[] {
  const items = extractItemPairs(lines);
  const prices = extractStandalonePrices(lines);
  if (!items.length || !prices.length) return [];

  const count = Math.min(items.length, prices.length);
  const results: ParsedPartsOrderRow[] = [];
  for (let i = 0; i < count; i++) {
    results.push({
      partNumber: items[i]!.partNumber,
      name: items[i]!.name,
      priceBrutto: prices[i]!,
    });
  }
  return results;
}

export function parsePartsOrderPhotoText(text: string): ParsedPartsOrderRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const inline = parseInlineLayout(lines);
  const column = parseColumnLayout(lines);
  if (column.length > inline.length) return column;
  if (inline.length >= 2) return inline;
  if (column.length) return column;
  return inline;
}
