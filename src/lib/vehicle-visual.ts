import type { Vehicle } from "./store";

export type VehicleBodyType = "sedan" | "sport" | "suv" | "hatch";

export interface VehicleVisualProfile {
  bodyType: VehicleBodyType;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  rim: string;
  glass: string;
}

const BRAND_PALETTES: Record<string, Omit<VehicleVisualProfile, "bodyType">> = {
  BMW: {
    primary: "#1a2744",
    secondary: "#243556",
    accent: "#0066b2",
    glow: "rgba(0,102,178,0.55)",
    rim: "#9ca3af",
    glass: "#1e293b",
  },
  "Mercedes-Benz": {
    primary: "#1f2937",
    secondary: "#374151",
    accent: "#c0c0c0",
    glow: "rgba(192,192,192,0.45)",
    rim: "#d1d5db",
    glass: "#111827",
  },
  Porsche: {
    primary: "#0f0f0f",
    secondary: "#262626",
    accent: "#c41e1e",
    glow: "rgba(196,30,30,0.5)",
    rim: "#737373",
    glass: "#171717",
  },
  Volkswagen: {
    primary: "#1e3a5f",
    secondary: "#2563eb",
    accent: "#60a5fa",
    glow: "rgba(96,165,250,0.4)",
    rim: "#94a3b8",
    glass: "#1e293b",
  },
  Audi: {
    primary: "#111827",
    secondary: "#1f2937",
    accent: "#dc2626",
    glow: "rgba(220,38,38,0.45)",
    rim: "#cbd5e1",
    glass: "#0f172a",
  },
};

const DEFAULT_PALETTE: Omit<VehicleVisualProfile, "bodyType"> = {
  primary: "#18181b",
  secondary: "#27272a",
  accent: "#e10600",
  glow: "rgba(225,6,0,0.5)",
  rim: "#a1a1aa",
  glass: "#1c1917",
};

function detectBodyType(make: string, model: string, trim?: string): VehicleBodyType {
  const text = `${make} ${model} ${trim ?? ""}`.toLowerCase();
  if (/911|carrera|gt3|gt4|rs3|rs4|rs5|rs6|rs7|m2|m3|m4|m5|amg gt|corvette|supra|z4|tt |718|boxster|i8|sport/i.test(text)) {
    return "sport";
  }
  if (/x[1-7]|q[2-8]|glc|gle|gla|macan|cayenne|tiguan|touareg|kuga|rav4|xc\d|suv|discovery|range rover/i.test(text)) {
    return "suv";
  }
  if (/golf|polo|leon|a3|fabia|focus|i20|i30|hatch|gti|gtd/i.test(text)) {
    return "hatch";
  }
  return "sedan";
}

function resolveBrandPalette(make: string): Omit<VehicleVisualProfile, "bodyType"> {
  const key = Object.keys(BRAND_PALETTES).find(
    (b) => make.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(make.toLowerCase())
  );
  return key ? BRAND_PALETTES[key] : DEFAULT_PALETTE;
}

/** Visual profile from VIN-decoded vehicle data (make, model, trim, color) */
export function getVehicleVisualProfile(vehicle: Partial<Vehicle>): VehicleVisualProfile {
  const make = vehicle.make?.trim() || "Auto";
  const model = vehicle.model?.trim() || "";
  const palette = resolveBrandPalette(make);
  const bodyType = detectBodyType(make, model, vehicle.trim);

  if (vehicle.colorHex?.trim()) {
    return {
      bodyType,
      ...palette,
      primary: vehicle.colorHex.trim(),
      secondary: palette.secondary,
    };
  }

  if (vehicle.color?.trim()) {
    return {
      bodyType,
      ...palette,
      primary: vehicle.color.trim(),
      secondary: palette.secondary,
    };
  }

  return { bodyType, ...palette };
}

export function vehicleDisplayTitle(vehicle: Partial<Vehicle>): string {
  const parts = [vehicle.make, vehicle.model].filter(Boolean);
  return parts.join(" ") || "—";
}

export function vehicleDisplaySubtitle(vehicle: Partial<Vehicle>): string {
  const parts = [
    vehicle.year,
    vehicle.trim,
    vehicle.engineVolume || vehicle.engine,
    vehicle.power,
  ].filter(Boolean);
  return parts.join(" · ");
}
