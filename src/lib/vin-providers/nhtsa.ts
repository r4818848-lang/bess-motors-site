import { parseNhtsaVinRow, type VinDecodeResult } from "../vin-decode";
import { buildPowerFields, cleanVinField } from "../vin-decode-shared";
import type { VinProviderHit } from "./types";

export async function fetchNhtsaValuesHit(vin: string): Promise<VinProviderHit | null> {
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const row = data.Results?.[0];
  if (!row) return null;
  const parsed = parseNhtsaVinRow(row);
  if (!parsed.found) return null;
  return { source: "nhtsa", weight: 60, data: parsed };
}

export async function fetchNhtsaExtendedHit(vin: string): Promise<VinProviderHit | null> {
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

  const make = cleanVinField(map.get("Make"));
  if (!make) return null;

  const series = cleanVinField(map.get("Series"));
  const bodyClass = cleanVinField(map.get("Body Class")) || cleanVinField(map.get("Body Type"));

  const hp = cleanVinField(map.get("Engine HP")) || cleanVinField(map.get("Engine Brake (hp) From"));
  const kw = cleanVinField(map.get("Engine kW"));
  const { power, powerKw } = buildPowerFields(hp, kw);

  const dispL = cleanVinField(map.get("Displacement (L)"));
  const engineVolume = dispL ? `${dispL}L` : "";

  let model =
    cleanVinField(map.get("Model")) ||
    cleanVinField(map.get("Model - Model Year")) ||
    cleanVinField(map.get("Vehicle Descriptor"));

  if (!model && series && !/^RR\d$/i.test(series)) model = series;

  const partial: Partial<VinDecodeResult> = {
    make,
    model,
    year: cleanVinField(map.get("Model Year")),
    trim: [cleanVinField(map.get("Trim")), series, cleanVinField(map.get("Trim2"))]
      .filter(Boolean)
      .join(" "),
    engine: [
      engineVolume,
      cleanVinField(map.get("Engine Configuration")),
      cleanVinField(map.get("Engine Number of Cylinders"))
        ? `${cleanVinField(map.get("Engine Number of Cylinders"))} cyl`
        : "",
    ]
      .filter(Boolean)
      .join(" · "),
    engineVolume,
    power,
    powerKw,
    transmission:
      cleanVinField(map.get("Transmission Style")) || cleanVinField(map.get("Transmission Speeds")),
    drivetrain: cleanVinField(map.get("Drive Type")),
    fuelType:
      cleanVinField(map.get("Fuel Type - Primary")) ||
      cleanVinField(map.get("Fuel Type - Secondary")),
  };

  return {
    source: "nhtsa-extended",
    weight: 55,
    data: partial,
    series,
    bodyClass,
  };
}
