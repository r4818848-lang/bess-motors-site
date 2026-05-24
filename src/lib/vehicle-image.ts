import type { Vehicle } from "./store";
import { decodeVinPaint } from "./vin-paint";

const IMAGIN_CUSTOMER =
  process.env.NEXT_PUBLIC_IMAGIN_CUSTOMER?.trim() || "img";

export interface ImaginParams {
  make: string;
  modelFamily: string;
  modelRange?: string;
  modelYear: string;
  paintDescription: string;
  powerTrain?: string;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeMake(make: string): string {
  const m = make.trim().toLowerCase();
  if (m.includes("mercedes")) return "mercedes-benz";
  if (m.includes("vw") || m === "volkswagen") return "volkswagen";
  if (m.includes("bmw")) return "bmw";
  return slug(make);
}

/** Map decoded make/model/trim to IMAGIN.studio parameters */
export function resolveImaginParams(vehicle: Partial<Vehicle>): ImaginParams {
  const make = normalizeMake(vehicle.make || "auto");
  const model = (vehicle.model || "").trim();
  const trim = (vehicle.trim || "").trim();
  const text = `${model} ${trim}`.toLowerCase();
  const year = vehicle.year?.trim() || "2020";

  let paintDescription = vehicle.color?.trim() || "";
  if (!paintDescription && vehicle.vin && vehicle.make) {
    paintDescription = decodeVinPaint(vehicle.vin, vehicle.make).color;
  }
  if (!paintDescription) paintDescription = "Metallic Grey";

  let modelFamily = slug(model || "sedan");
  let modelRange = "";

  if (make === "bmw") {
    if (/\bm5\b|f90/i.test(text)) modelFamily = "m5";
    else if (/\bm3\b|f80|g80/i.test(text)) modelFamily = "m3";
    else if (/\bm4\b|f82|g82/i.test(text)) modelFamily = "m4";
    else if (/\bm8\b/i.test(text)) modelFamily = "m8";
    else if (/\bx7\b/i.test(text)) modelFamily = "x7";
    else if (/\bx6\b/i.test(text)) modelFamily = "x6";
    else if (/\bx5\b|f15|g05/i.test(text)) modelFamily = "x5";
    else if (/\bx3\b|g01/i.test(text)) modelFamily = "x3";
    else if (/\bx1\b/i.test(text)) modelFamily = "x1";
    else if (/3[\s-]?series|320|330|340/i.test(text)) modelFamily = "3-series";
    else if (/5[\s-]?series|520|530|540/i.test(text)) {
      modelFamily = "5-series";
      if (/\bm5\b/i.test(text)) modelRange = "m5";
    }
    else if (/7[\s-]?series|740|750/i.test(text)) modelFamily = "7-series";
    else if (/i4|i7|ix/i.test(text)) modelFamily = slug(model);
  } else if (make === "mercedes-benz") {
    if (/c[\s-]?class|c200|c300|c43|c63/i.test(text)) modelFamily = "c-class";
    else if (/e[\s-]?class|e200|e300|e43|e63/i.test(text)) modelFamily = "e-class";
    else if (/s[\s-]?class|s500|s63/i.test(text)) modelFamily = "s-class";
    else if (/gle|ml/i.test(text)) modelFamily = "gle";
    else if (/glc/i.test(text)) modelFamily = "glc";
    else if (/gla/i.test(text)) modelFamily = "gla";
    else if (/a[\s-]?class|a200|a45/i.test(text)) modelFamily = "a-class";
  } else if (make === "audi") {
    if (/a3|s3|rs3/i.test(text)) modelFamily = "a3";
    else if (/a4|s4|rs4/i.test(text)) modelFamily = "a4";
    else if (/a6|s6|rs6/i.test(text)) modelFamily = "a6";
    else if (/a8|s8/i.test(text)) modelFamily = "a8";
    else if (/q5|sq5|rsq5/i.test(text)) modelFamily = "q5";
    else if (/q7|sq7/i.test(text)) modelFamily = "q7";
    else if (/q3|rsq3/i.test(text)) modelFamily = "q3";
    else if (/tt|tts|tt rs/i.test(text)) modelFamily = "tt";
  } else if (make === "porsche") {
    if (/911|carrera|gt3|turbo/i.test(text)) modelFamily = "911";
    else if (/cayenne/i.test(text)) modelFamily = "cayenne";
    else if (/macan/i.test(text)) modelFamily = "macan";
    else if (/panamera/i.test(text)) modelFamily = "panamera";
    else if (/taycan/i.test(text)) modelFamily = "taycan";
    else if (/718|boxster|cayman/i.test(text)) modelFamily = "718";
  } else if (make === "volkswagen") {
    if (/golf|gti|gtd|r/i.test(text)) modelFamily = "golf";
    else if (/passat/i.test(text)) modelFamily = "passat";
    else if (/tiguan/i.test(text)) modelFamily = "tiguan";
    else if (/touareg/i.test(text)) modelFamily = "touareg";
    else if (/polo/i.test(text)) modelFamily = "polo";
  }

  const fuel = (vehicle.fuelType || "").toLowerCase();
  let powerTrain: string | undefined;
  if (/electric|ev|bev/i.test(fuel)) powerTrain = "electric";
  else if (/hybrid|phev/i.test(fuel)) powerTrain = "hybrid";
  else if (/diesel/i.test(fuel)) powerTrain = "diesel";
  else if (/petrol|gasoline|gas/i.test(fuel)) powerTrain = "petrol";

  return {
    make,
    modelFamily,
    modelRange: modelRange || undefined,
    modelYear: year,
    paintDescription,
    powerTrain,
  };
}

export function buildVehicleImageUrl(vehicle: Partial<Vehicle>, width = 900): string {
  if (vehicle.imageUrl?.trim()) return vehicle.imageUrl.trim();

  const { make, modelFamily, modelRange, modelYear, paintDescription, powerTrain } =
    resolveImaginParams(vehicle);

  const params = new URLSearchParams({
    customer: IMAGIN_CUSTOMER,
    make,
    modelFamily,
    modelYear,
    paintDescription,
    angle: "23",
    zoomType: "fullscreen",
    width: String(width),
  });

  if (modelRange) params.set("modelRange", modelRange);
  if (powerTrain) params.set("powerTrain", powerTrain);

  return `https://cdn.imagin.studio/getImage?${params.toString()}`;
}

/** Fill color + cached image URL on vehicle record after VIN decode */
export function enrichVehicleMedia(vehicle: Partial<Vehicle>): Partial<Vehicle> {
  const make = vehicle.make?.trim() || "";
  const vin = vehicle.vin?.replace(/\s/g, "").toUpperCase() || "";

  let color = vehicle.color?.trim();
  let colorHex = vehicle.colorHex?.trim();

  if (vin.length === 17 && make && !color) {
    const paint = decodeVinPaint(vin, make);
    color = paint.color;
    colorHex = paint.colorHex;
  }

  const enriched = { ...vehicle, color, colorHex };
  const imageUrl = buildVehicleImageUrl(enriched);

  return { ...enriched, imageUrl };
}
