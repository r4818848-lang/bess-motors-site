export interface VinDecodeResult {
  make: string;
  model: string;
  engine: string;
  engineVolume: string;
  trim: string;
  power: string;
  powerKw: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  year: string;
  color?: string;
  colorHex?: string;
  found: boolean;
  error?: string;
}

export const emptyVinResult: VinDecodeResult = {
  make: "",
  model: "",
  engine: "",
  engineVolume: "",
  trim: "",
  power: "",
  powerKw: "",
  transmission: "",
  drivetrain: "",
  fuelType: "",
  year: "",
  found: false,
};

function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  const s = value.trim();
  if (!s || s === "Not Applicable" || s === "NULL" || s === "0") return "";
  return s;
}

function hpToKw(hp: number): number {
  return Math.round(hp * 0.7457);
}

function kwToHp(kw: number): number {
  return Math.round(kw / 0.7457);
}

function buildPowerFields(hpRaw: string, kwRaw: string): { power: string; powerKw: string } {
  const hpNum = parseFloat(hpRaw);
  const kwNum = parseFloat(kwRaw);
  let power = "";
  let powerKw = "";

  if (!Number.isNaN(hpNum) && hpNum > 0) {
    power = `${Math.round(hpNum)} HP`;
    powerKw = `${Number.isNaN(kwNum) || kwNum <= 0 ? hpToKw(hpNum) : Math.round(kwNum)} kW`;
  } else if (!Number.isNaN(kwNum) && kwNum > 0) {
    powerKw = `${Math.round(kwNum)} kW`;
    power = `${kwToHp(kwNum)} HP`;
  }

  return { power, powerKw };
}

function buildEngineLabel(row: Record<string, unknown>): string {
  const parts: string[] = [];
  const disp = clean(row.DisplacementL);
  const cc = clean(row.DisplacementCC);
  const cyl = clean(row.EngineCylinders);
  const config = clean(row.EngineConfiguration);
  const model = clean(row.EngineModel);

  if (disp) parts.push(`${disp}L`);
  else if (cc) parts.push(`${cc} cm³`);

  if (config) parts.push(config);
  if (cyl) parts.push(`${cyl} cyl`);
  if (model) parts.push(model);

  return parts.join(" · ");
}

export function parseNhtsaVinRow(row: Record<string, unknown>): VinDecodeResult {
  const make = clean(row.Make);
  if (!make) return { ...emptyVinResult, error: "not_found" };

  const model = clean(row.Model);
  const year = clean(row.ModelYear);
  const trim = [clean(row.Trim), clean(row.Series), clean(row.Trim2)]
    .filter(Boolean)
    .join(" ");

  const dispL = clean(row.DisplacementL);
  const engineVolume = dispL ? `${dispL}L` : clean(row.DisplacementCC) ? `${clean(row.DisplacementCC)} cm³` : "";

  const { power, powerKw } = buildPowerFields(
    clean(row.EngineHP) || clean(row.EnginePower),
    clean(row.EngineKW)
  );

  const transmission =
    clean(row.TransmissionStyle) ||
    clean(row.TransmissionSpeeds) ||
    "";

  const drivetrain = clean(row.DriveType) || clean(row.DriveTypePrimary) || "";
  const fuelType = clean(row.FuelTypePrimary) || clean(row.FuelTypeSecondary) || "";

  return {
    found: true,
    make,
    model,
    year,
    trim,
    engine: buildEngineLabel(row),
    engineVolume,
    power,
    powerKw,
    transmission,
    drivetrain,
    fuelType,
  };
}

/** WMI prefix fallback when NHTSA has no data */
const wmiDatabase: Record<string, Omit<VinDecodeResult, "found">> = {
  WBA: { make: "BMW", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  WBS: { make: "BMW M", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  WDB: { make: "Mercedes-Benz", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  WDC: { make: "Mercedes-Benz", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  WAU: { make: "Audi", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  TRU: { make: "Audi", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  WP0: { make: "Porsche", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  WP1: { make: "Porsche", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  WVW: { make: "Volkswagen", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  WV1: { make: "Volkswagen", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  WV2: { make: "Volkswagen", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  VSS: { make: "SEAT", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  SKO: { make: "Skoda", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  TMB: { make: "Skoda", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  VF1: { make: "Renault", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  VF3: { make: "Peugeot", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  VF7: { make: "Citroën", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  YV1: { make: "Volvo", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  YV4: { make: "Volvo", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  ZFA: { make: "Fiat", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  ZFF: { make: "Ferrari", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  SAL: { make: "Land Rover", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  SAJ: { make: "Jaguar", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  JTD: { make: "Toyota", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  JHM: { make: "Honda", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  KMH: { make: "Hyundai", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  KNA: { make: "Kia", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  WMA: { make: "MAN", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
  W0L: { make: "Opel", model: "", engine: "", engineVolume: "", trim: "", power: "", powerKw: "", transmission: "", drivetrain: "", fuelType: "", year: "" },
};

function vinModelYear(vin: string): string {
  const code = vin.charAt(9);
  const map: Record<string, number> = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
    J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
    T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
    "1": 2001, "2": 2002, "3": 2003, "4": 2004, "5": 2005, "6": 2006,
    "7": 2007, "8": 2008, "9": 2009,
  };
  const y = map[code];
  return y ? String(y) : "";
}

export function decodeVinLocal(vin: string): VinDecodeResult {
  const prefix = vin.slice(0, 3).toUpperCase();
  const match = wmiDatabase[prefix];
  if (!match || vin.length !== 17) return { ...emptyVinResult, error: "not_found" };

  const year = vinModelYear(vin);
  return {
    ...match,
    year,
    found: true,
  };
}
