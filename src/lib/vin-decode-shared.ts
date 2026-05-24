/** Shared helpers for all VIN decode providers */

export function cleanVinField(value: unknown): string {
  if (typeof value !== "string") return "";
  const s = value.trim();
  if (!s || s === "Not Applicable" || s === "NULL" || s === "0" || s === "-" || s === "N/A") {
    return "";
  }
  return s;
}

export function buildPowerFields(
  hpRaw: string,
  kwRaw: string
): { power: string; powerKw: string } {
  const hpNum = parseFloat(hpRaw);
  const kwNum = parseFloat(kwRaw);
  let power = "";
  let powerKw = "";

  if (!Number.isNaN(hpNum) && hpNum > 0) {
    power = `${Math.round(hpNum)} HP`;
    powerKw =
      Number.isNaN(kwNum) || kwNum <= 0 ? `${Math.round(hpNum * 0.7457)} kW` : `${Math.round(kwNum)} kW`;
  } else if (!Number.isNaN(kwNum) && kwNum > 0) {
    powerKw = `${Math.round(kwNum)} kW`;
    power = `${Math.round(kwNum / 0.7457)} HP`;
  }

  return { power, powerKw };
}

export function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string") {
      const c = cleanVinField(v);
      if (c) return c;
    }
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return "";
}

/** Walk nested JSON and collect string values for known automotive keys */
export function extractFromTree(
  root: unknown,
  keyMatchers: RegExp[],
  maxDepth = 6
): string[] {
  const found: string[] = [];
  const seen = new Set<object>();

  function walk(node: unknown, depth: number) {
    if (depth > maxDepth || node == null) return;
    if (typeof node === "string") {
      const c = cleanVinField(node);
      if (c.length >= 2) found.push(c);
      return;
    }
    if (typeof node !== "object") return;
    if (seen.has(node as object)) return;
    seen.add(node as object);

    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }

    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (keyMatchers.some((re) => re.test(key))) {
        if (typeof value === "string" || typeof value === "number") {
          const c = cleanVinField(String(value));
          if (c) found.push(c);
        }
      }
      walk(value, depth + 1);
    }
  }

  walk(root, 0);
  return found;
}
