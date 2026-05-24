import type { VinDecodeResult } from "./vin-decode";
import { cleanVinField } from "./vin-decode-shared";
import type { VinProviderHit } from "./vin-providers/types";

function normToken(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normMake(s: string): string {
  return normToken(s).replace(/benz/g, "mercedes benz");
}

function normModel(s: string): string {
  return normToken(s).replace(/serie(s)?/g, "series");
}

function modelsMatch(a: string, b: string): boolean {
  const na = normModel(a);
  const nb = normModel(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  return false;
}

function voteBest(
  hits: VinProviderHit[],
  field: keyof VinDecodeResult,
  normalizer: (s: string) => string = normToken
): string {
  const scores = new Map<string, { value: string; score: number }>();

  for (const hit of hits) {
    const raw = hit.data[field];
    if (typeof raw !== "string") continue;
    const value = cleanVinField(raw);
    if (!value || value.length < 1) continue;
    if (field === "year" && !/^(19|20)\d{2}$/.test(value)) continue;
    if (field === "model" && value.length < 2) continue;

    const key = normalizer(value);
    const prev = scores.get(key);
    const score = (prev?.score ?? 0) + hit.weight;
    scores.set(key, { value, score });
  }

  let best = "";
  let bestScore = 0;
  for (const { value, score } of scores.values()) {
    if (score > bestScore) {
      bestScore = score;
      best = value;
    }
  }
  return best;
}

function mergeScalarField(
  hits: VinProviderHit[],
  field: keyof VinDecodeResult
): string {
  const voted = voteBest(hits, field);
  if (voted) return voted;

  const sorted = [...hits].sort((a, b) => b.weight - a.weight);
  for (const hit of sorted) {
    const v = hit.data[field];
    if (typeof v === "string" && cleanVinField(v)) return cleanVinField(v);
  }
  return "";
}

/** Combine multiple provider hits into one result (weighted voting) */
export function buildConsensus(
  hits: VinProviderHit[]
): {
  result: Partial<VinDecodeResult>;
  series: string;
  bodyClass: string;
  sourcesUsed: string[];
  confidence: number;
} {
  if (!hits.length) {
    return { result: {}, series: "", bodyClass: "", sourcesUsed: [], confidence: 0 };
  }

  const sourcesUsed = hits.map((h) => h.source);
  const make = voteBest(hits, "make", normMake) || mergeScalarField(hits, "make");
  const model = voteBest(hits, "model", normModel) || mergeScalarField(hits, "model");
  const year = voteBest(hits, "year") || mergeScalarField(hits, "year");

  let series = "";
  let bodyClass = "";
  for (const hit of [...hits].sort((a, b) => b.weight - a.weight)) {
    if (!series && hit.series) series = hit.series;
    if (!bodyClass && hit.bodyClass) bodyClass = hit.bodyClass;
  }

  const withModel = hits.filter((h) => cleanVinField(h.data.model ?? "").length >= 2);
  const agreeingModel = withModel.filter((h) => modelsMatch(h.data.model ?? "", model));
  const maxWeight = hits.reduce((m, h) => Math.max(m, h.weight), 0);
  const agreeWeight = agreeingModel.reduce((s, h) => s + h.weight, 0);
  const confidence =
    make && model
      ? Math.min(100, Math.round(40 + (agreeWeight / Math.max(maxWeight * hits.length, 1)) * 60))
      : make
        ? Math.min(60, Math.round(25 + (hits.length / 8) * 35))
        : 0;

  const result: Partial<VinDecodeResult> = {
    make,
    model,
    year,
    trim: mergeScalarField(hits, "trim"),
    engine: mergeScalarField(hits, "engine"),
    engineVolume: mergeScalarField(hits, "engineVolume"),
    power: mergeScalarField(hits, "power"),
    powerKw: mergeScalarField(hits, "powerKw"),
    transmission: mergeScalarField(hits, "transmission"),
    drivetrain: mergeScalarField(hits, "drivetrain"),
    fuelType: mergeScalarField(hits, "fuelType"),
    color: mergeScalarField(hits, "color"),
    colorHex: mergeScalarField(hits, "colorHex"),
  };

  return { result, series, bodyClass, sourcesUsed, confidence };
}
