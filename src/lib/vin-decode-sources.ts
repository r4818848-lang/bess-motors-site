import type { VinDecodeResult } from "./vin-decode";
import { parseNhtsaVinRow, decodeVinLocal, emptyVinResult } from "./vin-decode";

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  const s = value.trim();
  if (!s || s === "Not Applicable" || s === "NULL" || s === "0") return "";
  return s;
}

function mergeResults(base: VinDecodeResult, extra: Partial<VinDecodeResult>): VinDecodeResult {
  return {
    found: base.found || Boolean(extra.make),
    make: base.make || extra.make || "",
    model: base.model || extra.model || "",
    engine: base.engine || extra.engine || "",
    engineVolume: base.engineVolume || extra.engineVolume || "",
    trim: base.trim || extra.trim || "",
    power: base.power || extra.power || "",
    powerKw: base.powerKw || extra.powerKw || "",
    transmission: base.transmission || extra.transmission || "",
    drivetrain: base.drivetrain || extra.drivetrain || "",
    fuelType: base.fuelType || extra.fuelType || "",
    year: base.year || extra.year || "",
    color: base.color || extra.color,
    colorHex: base.colorHex || extra.colorHex,
    error: base.error || extra.error,
  };
}

async function fetchNhtsaValues(vin: string): Promise<VinDecodeResult | null> {
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const row = data.Results?.[0];
  if (!row) return null;
  const parsed = parseNhtsaVinRow(row);
  return parsed.found ? parsed : null;
}

async function fetchNhtsaExtended(vin: string): Promise<Partial<VinDecodeResult> | null> {
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinExtended/${encodeURIComponent(vin)}?format=json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const results = data.Results as Array<{ Variable: string; Value: string }> | undefined;
  if (!results?.length) return null;

  const map = new Map<string, string>();
  for (const row of results) {
    if (row.Variable && row.Value) map.set(row.Variable, row.Value);
  }

  const make = clean(map.get("Make"));
  if (!make) return null;

  const hp = clean(map.get("Engine HP")) || clean(map.get("Engine Brake (hp) From"));
  const kw = clean(map.get("Engine kW"));
  let power = "";
  let powerKw = "";
  const hpNum = parseFloat(hp);
  const kwNum = parseFloat(kw);
  if (!Number.isNaN(hpNum) && hpNum > 0) {
    power = `${Math.round(hpNum)} HP`;
    powerKw = `${Number.isNaN(kwNum) || kwNum <= 0 ? Math.round(hpNum * 0.7457) : Math.round(kwNum)} kW`;
  } else if (!Number.isNaN(kwNum) && kwNum > 0) {
    powerKw = `${Math.round(kwNum)} kW`;
    power = `${Math.round(kwNum / 0.7457)} HP`;
  }

  const dispL = clean(map.get("Displacement (L)"));
  const engineVolume = dispL ? `${dispL}L` : "";

  return {
    make,
    model: clean(map.get("Model")) || clean(map.get("Model - Model Year")),
    year: clean(map.get("Model Year")),
    trim: [clean(map.get("Trim")), clean(map.get("Series")), clean(map.get("Trim2"))]
      .filter(Boolean)
      .join(" "),
    engine: [
      engineVolume,
      clean(map.get("Engine Configuration")),
      clean(map.get("Engine Number of Cylinders"))
        ? `${clean(map.get("Engine Number of Cylinders"))} cyl`
        : "",
    ]
      .filter(Boolean)
      .join(" · "),
    engineVolume,
    power,
    powerKw,
    transmission: clean(map.get("Transmission Style")) || clean(map.get("Transmission Speeds")),
    drivetrain: clean(map.get("Drive Type")),
    fuelType: clean(map.get("Fuel Type - Primary")) || clean(map.get("Fuel Type - Secondary")),
  };
}

async function fetchAutoDev(vin: string): Promise<Partial<VinDecodeResult> | null> {
  const key = process.env.AUTO_DEV_API_KEY?.trim();
  if (!key) return null;

  try {
    const res = await fetch(`https://api.auto.dev/vin/${encodeURIComponent(vin)}`, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      make?: { name?: string };
      model?: { name?: string };
      years?: Array<{ year?: number; styles?: Array<{ trim?: string; engine?: { horsepower?: number } }> }>;
    };

    const make = data.make?.name?.trim();
    if (!make) return null;

    const yearEntry = data.years?.[0];
    const style = yearEntry?.styles?.[0];
    const hp = style?.engine?.horsepower;

    return {
      make,
      model: data.model?.name?.trim() || "",
      year: yearEntry?.year ? String(yearEntry.year) : "",
      trim: style?.trim || "",
      power: hp ? `${Math.round(hp)} HP` : "",
      powerKw: hp ? `${Math.round(hp * 0.7457)} kW` : "",
    };
  } catch {
    return null;
  }
}

/** Multi-source VIN decode: NHTSA values + extended + Auto.dev + WMI fallback */
export async function decodeVinFromSources(vin: string): Promise<VinDecodeResult> {
  let result: VinDecodeResult = { ...emptyVinResult };

  const [values, extended, autoDev] = await Promise.all([
    fetchNhtsaValues(vin),
    fetchNhtsaExtended(vin),
    fetchAutoDev(vin),
  ]);

  if (values) result = values;
  if (extended) result = mergeResults(result, extended);
  if (autoDev) result = mergeResults(result, autoDev);

  if (result.found && result.make) {
    return { ...result, found: true };
  }

  const local = decodeVinLocal(vin);
  if (local.found) {
    return { ...mergeResults({ ...emptyVinResult, found: false }, local), found: true };
  }

  return { ...emptyVinResult, error: "not_found" };
}
