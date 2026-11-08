import type { Operation } from "@/lib/smart-scheduler/catalog";

export type OperationGroup = {
  label: string;
  codes: string[];
};

export type OperationSearch =
  | { mode: "groups"; groups: OperationGroup[] }
  | { mode: "operations"; hits: { code: string; nameRu: string; namePl: string }[] };

const GENERIC = new Set(["замена", "замен", "wymiana", "wymiane", "wymian"]);

const FREQUENT = new Set(["MA-001", "MA-015", "BR-001", "BR-003", "DI-002", "AC-001", "TY-002"]);

const GROUPS: { label: string; test: (operation: Operation) => boolean }[] = [
  { label: "Колодки", test: (operation) => /колод|klock/i.test(`${operation.operationNameRu} ${operation.operationNamePl}`) },
  { label: "Масло", test: (operation) => /масл|olej/i.test(`${operation.operationNameRu} ${operation.operationNamePl}`) },
  { label: "Рулевые наконечники", test: (operation) => /наконечник|końców|koncow/i.test(`${operation.operationNameRu} ${operation.operationNamePl}`) },
  { label: "Рычаги", test: (operation) => /рычаг|wahacz/i.test(`${operation.operationNameRu} ${operation.operationNamePl}`) },
  { label: "Фильтры", test: (operation) => /фильтр|filtr/i.test(`${operation.operationNameRu} ${operation.operationNamePl}`) },
];

function fold(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("ё", "е")
    .replaceAll("ą", "a")
    .replaceAll("ć", "c")
    .replaceAll("ę", "e")
    .replaceAll("ł", "l")
    .replaceAll("ń", "n")
    .replaceAll("ó", "o")
    .replaceAll("ś", "s")
    .replaceAll("ź", "z")
    .replaceAll("ż", "z");
}

function tokens(value: string): string[] {
  return fold(value).split(/[^a-zа-я0-9]+/i).filter((token) => token.length >= 3);
}

function distance(left: string, right: string): number {
  if (Math.abs(left.length - right.length) > 2) return 3;
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const current = row[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
      previous = current;
    }
    if (Math.min(...row) > 2) return 3;
  }
  return row[right.length];
}

function matches(query: string, operation: Operation): number {
  const hay = [
    operation.operationCode,
    operation.operationNameRu,
    operation.operationNamePl,
    operation.category,
    operation.overlapGroup,
  ].map(fold);
  const folded = fold(query);
  if (hay[0] === folded) return 100;
  if (hay.some((item) => item.includes(folded))) return FREQUENT.has(operation.operationCode) ? 80 : 70;
  const words = hay.flatMap(tokens);
  let best = 0;
  for (const token of tokens(query)) {
    for (const word of words) {
      if (word.startsWith(token) || token.startsWith(word)) best = Math.max(best, 60);
      else if (token.length >= 5 && word.length >= 5 && (word.startsWith(token.slice(0, 5)) || token.startsWith(word.slice(0, 5)))) best = Math.max(best, 55);
      else if (token.length >= 5 && word.length >= 5 && distance(token, word) <= 1) best = Math.max(best, 40);
    }
  }
  if (best === 0) return 0;
  return FREQUENT.has(operation.operationCode) ? best + 5 : best;
}

export function searchOperations(catalog: Operation[], query: string): OperationSearch {
  const significant = tokens(query).filter((token) => !GENERIC.has(token));
  const broad = tokens(query).length > 0 && significant.length === 0;
  if (broad || fold(query).trim() === "замена") {
    return {
      mode: "groups",
      groups: GROUPS.map((group) => ({
        label: group.label,
        codes: catalog.filter((operation) => operation.isActive && group.test(operation)).map((operation) => operation.operationCode),
      })).filter((group) => group.codes.length > 0),
    };
  }
  const hits = catalog
    .map((operation) => ({ operation, score: matches(significant.join(" ") || query, operation) }))
    .filter((item) => item.operation.isActive && item.score > 0)
    .sort((a, b) => b.score - a.score || a.operation.operationCode.localeCompare(b.operation.operationCode))
    .slice(0, 8)
    .map((item) => ({
      code: item.operation.operationCode,
      nameRu: item.operation.operationNameRu,
      namePl: item.operation.operationNamePl,
    }));
  return { mode: "operations", hits };
}
