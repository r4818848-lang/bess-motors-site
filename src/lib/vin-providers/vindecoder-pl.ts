import { createHash } from "crypto";
import type { VinDecodeResult } from "../vin-decode";
import { buildPowerFields, cleanVinField, extractFromTree, pickString } from "../vin-decode-shared";
import type { VinProviderHit } from "./types";

/**
 * VINdecoder.pl / AutoISO (bp.autoiso.pl) — popular in PL parts trade.
 * Inter Cars and other distributors use similar TecDoc-backed catalogs;
 * this API is a dedicated VIN→vehicle decoder for the Polish market.
 */
export async function fetchVindecoderPl(vin: string): Promise<VinProviderHit | null> {
  const apiuid = process.env.VINDECODER_PL_API_UID?.trim();
  const apiKey = process.env.VINDECODER_PL_API_KEY?.trim();
  if (!apiuid || !apiKey) return null;

  const lang = process.env.VINDECODER_PL_LANG?.trim() || "pl";
  const base =
    process.env.VINDECODER_PL_API_BASE?.trim() || "https://bp.autoiso.pl/api/v3";
  const checksum = createHash("md5").update(`${apiuid}${apiKey}${vin}`).digest("hex");
  const url = `${base}/getDecoderFree/apiuid:${apiuid}/checksum:${checksum}/vin:${vin}/lang:${lang}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, unknown>;
    if (data.error || data.status === "error") return null;

    const manufacturer = (data.manufacturer ?? data.Manufacturer) as Record<string, unknown> | undefined;
    const decoder = (data.decoder ?? data.Decoder ?? data.decode) as Record<string, unknown> | undefined;
    const analyze = (data.analyze ?? data.Analyze) as Record<string, unknown> | undefined;

    const make =
      pickString(manufacturer ?? {}, ["name", "make", "brand", "producer"]) ||
      pickString(decoder ?? {}, ["make", "brand", "manufacturer"]) ||
      extractFromTree(data, [/^make$/i, /^brand$/i, /^producer$/i])[0] ||
      "";

    if (!make) return null;

    const model =
      pickString(decoder ?? {}, ["model", "modelName", "model_name", "vehicle_model"]) ||
      pickString(analyze ?? {}, ["model"]) ||
      extractFromTree(data, [/^model$/i, /^modelname$/i])[0] ||
      "";

    const year =
      pickString(decoder ?? {}, ["year", "modelYear", "model_year", "production_year"]) ||
      pickString(analyze ?? {}, ["year"]) ||
      extractFromTree(data, [/year/i])[0]?.match(/\b(19|20)\d{2}\b/)?.[0] ||
      "";

    const trim =
      pickString(decoder ?? {}, ["version", "trim", "variant", "equipment"]) ||
      pickString(analyze ?? {}, ["version", "trim"]) ||
      "";

    const hp =
      pickString(decoder ?? {}, ["power_hp", "engine_power", "power"]) ||
      extractFromTree(data, [/power/i, /hp/i])[0]?.match(/(\d+)\s*hp/i)?.[1] ||
      "";
    const kw = pickString(decoder ?? {}, ["power_kw", "engine_kw"]) || "";
    const { power, powerKw } = buildPowerFields(hp, kw);

    const disp =
      pickString(decoder ?? {}, ["engine_capacity", "displacement", "engine_volume"]) ||
      extractFromTree(data, [/displacement/i, /capacity/i, /engine.*ccm/i])[0] ||
      "";
    let engineVolume = "";
    if (disp) {
      const n = parseFloat(disp.replace(/[^\d.]/g, ""));
      engineVolume = n > 50 ? `${(n / 1000).toFixed(1)}L` : disp.includes("L") ? disp : `${disp}L`;
    }

    const partial: Partial<VinDecodeResult> = {
      make,
      model,
      year: year.match(/\b(19|20)\d{2}\b/) ? year.match(/\b(19|20)\d{2}\b/)![0] : year,
      trim,
      engineVolume,
      power,
      powerKw,
      fuelType:
        pickString(decoder ?? {}, ["fuel", "fuel_type", "fuelType"]) ||
        extractFromTree(data, [/fuel/i])[0] ||
        "",
      transmission: pickString(decoder ?? {}, ["transmission", "gearbox"]) || "",
      drivetrain: pickString(decoder ?? {}, ["drive", "drive_type", "drivetrain"]) || "",
      engine: [engineVolume, pickString(decoder ?? {}, ["engine", "engine_type"])]
        .filter(Boolean)
        .join(" · "),
    };

    return { source: "vindecoder-pl", weight: 90, data: partial };
  } catch {
    return null;
  }
}

export function vindecoderPlConfigured(): boolean {
  return Boolean(
    process.env.VINDECODER_PL_API_UID?.trim() && process.env.VINDECODER_PL_API_KEY?.trim()
  );
}
