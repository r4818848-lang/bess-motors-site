import type { VinDecodeResult } from "./vin-decode";

const KNOWN_MODELS: Array<{ pattern: RegExp; model: string }> = [
  { pattern: /\bwraith\b/i, model: "Wraith" },
  { pattern: /\bghost\b/i, model: "Ghost" },
  { pattern: /\bcullinan\b/i, model: "Cullinan" },
  { pattern: /\bdawn\b/i, model: "Dawn" },
  { pattern: /\bphantom\b/i, model: "Phantom" },
  { pattern: /\bspectre\b/i, model: "Spectre" },
  { pattern: /\bs[\s-]?class\b|s580|s650|s680|maybach/i, model: "S-Class" },
  { pattern: /\be[\s-]?class\b/i, model: "E-Class" },
  { pattern: /\bc[\s-]?class\b/i, model: "C-Class" },
  { pattern: /\bgle\b/i, model: "GLE" },
  { pattern: /\bgls\b/i, model: "GLS" },
  { pattern: /\broma\b/i, model: "Roma" },
  { pattern: /\bhurac[aá]n\b/i, model: "Huracán" },
  { pattern: /\b911\b|carrera/i, model: "911" },
  { pattern: /\bcayenne\b/i, model: "Cayenne" },
  { pattern: /\bmacan\b/i, model: "Macan" },
  { pattern: /\btaycan\b/i, model: "Taycan" },
];

function titleCaseMake(make: string): string {
  const m = make.trim();
  if (!m) return m;
  if (/rolls/i.test(m)) return "Rolls-Royce";
  if (/mercedes/i.test(m)) return "Mercedes-Benz";
  if (/^bmw\s*m$/i.test(m)) return "BMW M";
  if (/^bmw$/i.test(m)) return "BMW";
  return m
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function cleanTrim(trim: string): string {
  return trim
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*re-?facelift[^)]*\)/gi, "")
    .replace(/\b\d{3}\s*\([^)]+\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function findModelInText(...parts: string[]): string {
  const text = parts.filter(Boolean).join(" ");
  for (const { pattern, model } of KNOWN_MODELS) {
    if (pattern.test(text)) return model;
  }
  return "";
}

/** Infer BMW series from VDS when APIs return only the brand */
function inferBmwModel(vin: string): string {
  const v = vin.toUpperCase();
  if (!v.startsWith("WBA") && !v.startsWith("WBS") && !v.startsWith("WBY")) return "";

  const seriesDigit = v.charAt(3);
  if (/^[1-8]$/.test(seriesDigit)) {
    return v.startsWith("WBS") ? `M${seriesDigit}` : `${seriesDigit} Series`;
  }

  const vds = v.slice(3, 8);
  const mMatch = vds.match(/^[XM](\d)/i);
  if (mMatch) return `X${mMatch[1]}`;
  if (/^M[0-9]/.test(vds)) return vds.slice(0, 2).replace(/(\d)/, " $1").trim();

  const modelCode = v.slice(3, 7);
  const codeMap: Record<string, string> = {
    FR9C: "5 Series",
    JA7C: "7 Series",
    JB1C: "1 Series",
    JB3C: "3 Series",
    JB5C: "5 Series",
  };
  return codeMap[modelCode] || "";
}

function inferRollsRoyceModel(vin: string, series: string): string {
  const text = `${vin} ${series}`;
  const fromText = findModelInText(text);
  if (fromText) return fromText;

  if (/^RR4/i.test(series)) return "Wraith";
  if (/^RR1/i.test(series)) return "Phantom";
  if (/^RR2/i.test(series)) return "Ghost";
  if (/^RR5/i.test(series)) return "Cullinan";

  return "";
}

function inferMercedesModel(trim: string, series: string, bodyClass: string): string {
  const text = `${trim} ${series} ${bodyClass}`;
  const found = findModelInText(text);
  if (found) return found;
  if (/s[\s-]?klasse|w222|w223|w221/i.test(text)) return "S-Class";
  if (/e[\s-]?klasse|w213/i.test(text)) return "E-Class";
  if (/c[\s-]?klasse|w205|w206/i.test(text)) return "C-Class";
  return "";
}

function inferModel(vin: string, result: VinDecodeResult, extras?: { series?: string; bodyClass?: string }): string {
  const make = result.make.toLowerCase();
  const fromFields = findModelInText(result.model, result.trim, extras?.series ?? "", extras?.bodyClass ?? "");
  if (fromFields) return fromFields;

  if (make.includes("bmw")) return inferBmwModel(vin);
  if (make.includes("rolls")) return inferRollsRoyceModel(vin, extras?.series ?? "");
  if (make.includes("mercedes")) {
    return inferMercedesModel(result.trim, extras?.series ?? "", extras?.bodyClass ?? "");
  }

  return "";
}

function normalizeYear(year: string, vin: string): string {
  const y = year.trim();
  if (/^(19|20)\d{2}$/.test(y)) return y;
  const fromVin = vinModelYearFromVin(vin);
  return fromVin || y;
}

function vinModelYearFromVin(vin: string): string {
  const code = vin.charAt(9);
  const map: Record<string, number> = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
    J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
    T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
    "1": 2001, "2": 2002, "3": 2003, "4": 2004, "5": 2005, "6": 2006,
    "7": 2007, "8": 2008, "9": 2009,
  };
  const y = map[code];
  return y ? String(y) : "";
}

/** Post-process merged decode: clean labels, infer missing model, fix year */
export function normalizeVinDecode(
  vin: string,
  result: VinDecodeResult,
  extras?: { series?: string; bodyClass?: string }
): VinDecodeResult {
  if (!result.make) return result;

  const make = titleCaseMake(result.make);
  let model = result.model.trim();
  let trim = cleanTrim(result.trim);

  const inferred = inferModel(vin, { ...result, make, model, trim }, extras);
  if (!model && inferred) model = inferred;
  else if (model && inferred && /ghost/i.test(model) && /wraith/i.test(inferred)) {
    model = inferred;
  }

  if (model && trim.toLowerCase() === model.toLowerCase()) trim = "";

  const year = normalizeYear(result.year, vin);

  return {
    ...result,
    make,
    model,
    trim,
    year,
    found: true,
  };
}
