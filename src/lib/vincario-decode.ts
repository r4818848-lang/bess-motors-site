import { createHash } from "crypto";
import type { VinDecodeResult } from "./vin-decode";
import { emptyVinResult } from "./vin-decode";

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  const s = value.trim();
  if (!s || s === "Not Applicable" || s === "NULL" || s === "0" || s === "-") return "";
  return s;
}

function vincarioControlSum(vin: string, id: string, apiKey: string, secret: string): string {
  return createHash("sha1")
    .update(`${vin}|${id}|${apiKey}|${secret}`)
    .digest("hex")
    .slice(0, 10);
}

type VincarioRow = { label?: string; value?: string };

/** Vincario / Vindecoder.eu — strong coverage for European VINs */
export async function fetchVincario(vin: string): Promise<Partial<VinDecodeResult> | null> {
  const apiKey = process.env.VINCARIO_API_KEY?.trim();
  const secret = process.env.VINCARIO_API_SECRET?.trim();
  if (!apiKey || !secret) return null;

  const id = "decode";
  const controlSum = vincarioControlSum(vin, id, apiKey, secret);
  const base = process.env.VINCARIO_API_BASE?.trim() || "https://api.vincario.com/3.2";
  const url = `${base}/${apiKey}/${controlSum}/${id}/${vin}.json`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      error?: boolean;
      message?: string;
      decode?: VincarioRow[];
    };

    if (data.error || !data.decode?.length) return null;

    const map = new Map<string, string>();
    for (const row of data.decode) {
      if (row.label && row.value) map.set(row.label, clean(row.value));
    }

    const make = map.get("Make");
    if (!make) return null;

    const hp = map.get("Engine Power (HP)") || map.get("Engine Power (hp)") || map.get("Engine HP");
    const kw = map.get("Engine Power (kW)") || map.get("Engine kW");
    const disp = map.get("Engine Displacement (ccm)") || map.get("Engine Displacement (L)");

    let engineVolume = "";
    if (disp) {
      const n = parseFloat(disp);
      engineVolume = n > 50 ? `${(n / 1000).toFixed(1)}L` : `${disp}L`;
    }

    let power = "";
    let powerKw = "";
    const hpNum = hp ? parseFloat(hp) : NaN;
    const kwNum = kw ? parseFloat(kw) : NaN;
    if (!Number.isNaN(hpNum) && hpNum > 0) {
      power = `${Math.round(hpNum)} HP`;
      powerKw = !Number.isNaN(kwNum) && kwNum > 0 ? `${Math.round(kwNum)} kW` : `${Math.round(hpNum * 0.7457)} kW`;
    } else if (!Number.isNaN(kwNum) && kwNum > 0) {
      powerKw = `${Math.round(kwNum)} kW`;
      power = `${Math.round(kwNum / 0.7457)} HP`;
    }

    return {
      make,
      model: map.get("Model") || "",
      year: map.get("Model Year") || map.get("Model year") || "",
      trim: [map.get("Trim"), map.get("Series"), map.get("Version")].filter(Boolean).join(" "),
      engine: [engineVolume, map.get("Engine Model"), map.get("Engine Cylinders") ? `${map.get("Engine Cylinders")} cyl` : ""]
        .filter(Boolean)
        .join(" · "),
      engineVolume,
      power,
      powerKw,
      transmission: map.get("Transmission") || map.get("Transmission Type") || "",
      drivetrain: map.get("Drive") || map.get("Drive Type") || "",
      fuelType: map.get("Fuel Type - Primary") || map.get("Fuel Type") || "",
    };
  } catch {
    return null;
  }
}

export function vincarioConfigured(): boolean {
  return Boolean(process.env.VINCARIO_API_KEY?.trim() && process.env.VINCARIO_API_SECRET?.trim());
}

export const vincarioEmpty = emptyVinResult;
