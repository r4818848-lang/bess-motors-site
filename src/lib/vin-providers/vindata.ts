import type { VinDecodeResult } from "../vin-decode";
import { buildPowerFields, cleanVinField } from "../vin-decode-shared";
import type { VinProviderHit } from "./types";

/** VINdata.io — European VIN decoder (dealer / parts-oriented data) */
export async function fetchVindata(vin: string): Promise<VinProviderHit | null> {
  const apiKey = process.env.VINDATA_API_KEY?.trim();
  if (!apiKey) return null;

  const base =
    process.env.VINDATA_API_BASE?.trim() ||
    "https://gxvtafqbraaifsnthsyj.supabase.co/functions/v1/api-vin-decode";

  try {
    const url = `${base}?vin=${encodeURIComponent(vin)}`;
    const res = await fetch(url, {
      headers: { "x-api-key": apiKey },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      error?: string;
      vehicle?: Record<string, unknown>;
    };

    if (data.error || !data.vehicle) return null;

    const v = data.vehicle;
    const make = cleanVinField(v.make);
    if (!make) return null;

    const yearRaw = v.year;
    const year =
      typeof yearRaw === "number"
        ? String(yearRaw)
        : cleanVinField(yearRaw as string);

    const hp = cleanVinField(v.engine_power_hp as string) || "";
    const kw = cleanVinField(v.battery_net as string) || "";
    const { power, powerKw } = buildPowerFields(hp, kw);

    const partial: Partial<VinDecodeResult> = {
      make,
      model: cleanVinField(v.model) || "",
      year,
      trim: cleanVinField(v.variant) || cleanVinField(v.trim as string) || "",
      engineVolume: cleanVinField(v.engine_displacement as string) || "",
      power,
      powerKw,
      fuelType: cleanVinField(v.fuel_type as string) || "",
      drivetrain: cleanVinField(v.drive_type as string) || "",
      color: cleanVinField(v.exterior_color as string),
    };

    return { source: "vindata", weight: 85, data: partial };
  } catch {
    return null;
  }
}

export function vindataConfigured(): boolean {
  return Boolean(process.env.VINDATA_API_KEY?.trim());
}
