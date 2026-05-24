import type { VinDecodeResult } from "../vin-decode";
import { buildPowerFields, cleanVinField } from "../vin-decode-shared";
import type { VinProviderHit } from "./types";

/**
 * TecDoc VIN API — same catalog family used by Inter Cars, Auto Partner, etc.
 * Inter Cars API (webapi.intercars.eu) is for orders/stock, not VIN decode;
 * TecDoc VIN lookup is the correct integration path for parts-catalog accuracy.
 */
export async function fetchTecDocVin(vin: string): Promise<VinProviderHit | null> {
  const apiKey = process.env.TECDOC_API_KEY?.trim();
  if (!apiKey) return null;

  const base = process.env.TECDOC_API_BASE?.trim() || "http://webapi.auto-data.pro/tecdoc/vin";
  const lang = process.env.TECDOC_LANG?.trim() || "en";

  try {
    const res = await fetch(base, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        getVehiclesByVIN: {
          arg0: {
            lang,
            vin,
            manuId: null,
            modelId: null,
            maxVehiclesToReturn: 3,
          },
        },
      }),
      next: { revalidate: 86400 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      matchingVehicles?: Array<{
        vehicleDetails?: Record<string, unknown>;
        carName?: string;
      }>;
      data?: {
        matchingVehicles?: Array<{
          vehicleDetails?: Record<string, unknown>;
          carName?: string;
        }>;
      };
    };

    const vehicles = data.matchingVehicles ?? data.data?.matchingVehicles;
    if (!vehicles?.length) return null;

    const best = vehicles[0];
    const d = best.vehicleDetails ?? {};
    const carName = cleanVinField(best.carName);

    const make =
      cleanVinField(d.mfrName) ||
      cleanVinField(d.manuName) ||
      cleanVinField(d.brand) ||
      "";
    if (!make) return null;

    const model =
      cleanVinField(d.modelName) ||
      cleanVinField(d.model) ||
      carName.split(/\s+/).slice(1).join(" ") ||
      "";

    const year =
      cleanVinField(d.yearOfConstruction) ||
      cleanVinField(d.constructionYear) ||
      cleanVinField(d.year) ||
      "";

    const trim = [
      cleanVinField(d.typeName),
      cleanVinField(d.vehicleTypeName),
      cleanVinField(d.motorType),
    ]
      .filter(Boolean)
      .join(" ");

    const hp = cleanVinField(d.powerHpFrom) || cleanVinField(d.powerHpTo) || "";
    const kw = cleanVinField(d.powerKwFrom) || cleanVinField(d.powerKwTo) || "";
    const { power, powerKw } = buildPowerFields(hp, kw);

    const ccm = cleanVinField(d.cylinderCapacityCcm) || cleanVinField(d.capacityCC);
    const engineVolume = ccm ? `${(parseFloat(ccm) / 1000).toFixed(1)}L` : "";

    const partial: Partial<VinDecodeResult> = {
      make,
      model,
      year: year.match(/\d{4}/)?.[0] || year,
      trim: trim || carName,
      engineVolume,
      power,
      powerKw,
      fuelType: cleanVinField(d.fuelType) || cleanVinField(d.fuelTypeName) || "",
      transmission: cleanVinField(d.transmissionType) || "",
      drivetrain: cleanVinField(d.driveType) || "",
      engine: [
        engineVolume,
        cleanVinField(d.engineType),
        cleanVinField(d.cylinderCount) ? `${cleanVinField(d.cylinderCount)} cyl` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    };

    return {
      source: "tecdoc",
      weight: 95,
      data: partial,
      bodyClass: cleanVinField(d.bodyType) || cleanVinField(d.vehicleTypeName),
    };
  } catch {
    return null;
  }
}

export function tecdocConfigured(): boolean {
  return Boolean(process.env.TECDOC_API_KEY?.trim());
}
