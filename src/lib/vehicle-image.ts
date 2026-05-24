import type { Vehicle } from "./store";
import { decodeVinPaint } from "./vin-paint";
import { normalizeVinDecode } from "./vin-decode-normalize";
import { emptyVinResult } from "./vin-decode";
import { isLogoStockUrl, resolveStockPhotoUrl } from "./vehicle-stock-photos";

export type VehicleImageSource = "stock" | "render";

export interface VehicleImageInfo {
  source: VehicleImageSource;
  url?: string;
}

/** Resolve image: Wikimedia stock photo or premium SVG render (never watermarked CDN) */
export function resolveVehicleImage(vehicle: Partial<Vehicle>): VehicleImageInfo {
  const stock = resolveStockPhotoUrl(vehicle);
  if (stock && !isLogoStockUrl(stock.url)) {
    return { source: "stock", url: stock.url };
  }

  const saved = vehicle.imageUrl?.trim();
  if (saved && !saved.includes("imagin.studio") && !saved.includes("upload.wikimedia.org")) {
    return { source: "stock", url: saved };
  }

  return { source: "render" };
}

export function buildVehicleImageUrl(vehicle: Partial<Vehicle>): string | null {
  const info = resolveVehicleImage(vehicle);
  return info.url ?? null;
}

/** Fill color + image metadata on vehicle record after VIN decode */
export function enrichVehicleMedia(vehicle: Partial<Vehicle>): Partial<Vehicle> {
  const vin = vehicle.vin?.replace(/\s/g, "").toUpperCase() || "";
  let make = vehicle.make?.trim() || "";
  let model = vehicle.model?.trim() || "";
  let trim = vehicle.trim?.trim() || "";
  let year = vehicle.year?.trim() || "";

  if (vin.length === 17 && make) {
    const normalized = normalizeVinDecode(vin, {
      ...emptyVinResult,
      found: true,
      make,
      model,
      trim,
      year,
      engine: vehicle.engine ?? "",
      engineVolume: vehicle.engineVolume ?? "",
      power: vehicle.power ?? "",
      powerKw: vehicle.powerKw ?? "",
      transmission: vehicle.transmission ?? "",
      drivetrain: vehicle.drivetrain ?? "",
      fuelType: vehicle.fuelType ?? "",
    });
    make = normalized.make;
    model = normalized.model;
    trim = normalized.trim;
    year = normalized.year;
  }

  let color = vehicle.color?.trim();
  let colorHex = vehicle.colorHex?.trim();

  if (vin.length === 17 && make && !color) {
    const paint = decodeVinPaint(vin, make);
    color = paint.color;
    colorHex = paint.colorHex;
  }

  const enriched = { ...vehicle, make, model, trim, year, color, colorHex };
  const imageInfo = resolveVehicleImage(enriched);

  return {
    ...enriched,
    imageUrl: imageInfo.url,
  };
}
