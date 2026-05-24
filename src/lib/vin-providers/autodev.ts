import type { VinDecodeResult } from "../vin-decode";
import type { VinProviderHit } from "./types";

export async function fetchAutoDevHit(vin: string): Promise<VinProviderHit | null> {
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

    const partial: Partial<VinDecodeResult> = {
      make,
      model: data.model?.name?.trim() || "",
      year: yearEntry?.year ? String(yearEntry.year) : "",
      trim: style?.trim || "",
      power: hp ? `${Math.round(hp)} HP` : "",
      powerKw: hp ? `${Math.round(hp * 0.7457)} kW` : "",
    };

    return { source: "autodev", weight: 75, data: partial };
  } catch {
    return null;
  }
}
