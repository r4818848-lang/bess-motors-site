import type { VinDecodeResult } from "./vin-decode";
import { emptyVinResult } from "./vin-decode";

export function applyVinDecodeToForm(
  current: Record<string, string>,
  decoded: VinDecodeResult,
  vin: string
): Record<string, string> {
  return {
    ...current,
    vin,
    make: decoded.make || current.make,
    model: decoded.model || current.model,
    engine: decoded.engine || current.engine,
    trim: decoded.trim || current.trim,
    power: decoded.power || current.power,
    powerKw: decoded.powerKw || current.powerKw,
    transmission: decoded.transmission || current.transmission,
    year: decoded.year || current.year,
    engineVolume: decoded.engineVolume || current.engineVolume,
    drivetrain: decoded.drivetrain || current.drivetrain,
    fuelType: decoded.fuelType || current.fuelType,
  };
}

/** Decode VIN via server API (NHTSA) with WMI fallback */
export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const cleaned = vin.replace(/\s/g, "").toUpperCase();

  if (cleaned.length !== 17) {
    return { ...emptyVinResult, error: "invalid_length" };
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned)) {
    return { ...emptyVinResult, error: "invalid_format" };
  }

  try {
    const res = await fetch(`/api/vin/decode?vin=${encodeURIComponent(cleaned)}`);
    const data = (await res.json()) as VinDecodeResult;
    if (data.found) return data;
    if (data.error) return { ...emptyVinResult, error: data.error };
  } catch {
    /* offline */
  }

  return { ...emptyVinResult, error: "not_found" };
}
