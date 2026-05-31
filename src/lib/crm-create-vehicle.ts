import { normalizePlateKey } from "@/lib/auth";
import type { Database, Vehicle } from "@/lib/store";

export type CreateVehicleInput = {
  userId: string;
  plate?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: string;
  color?: string;
  engine?: string;
  engineVolume?: string;
  power?: string;
  powerKw?: string;
  fuelType?: string;
  mileage?: number;
  transmission?: string;
  notes?: string;
  firstRegistrationDate?: string;
  technicalInspectionExpiry?: string;
  insuranceExpiry?: string;
  engineNumber?: string;
  carType?: string;
};

export type CreateVehicleResult =
  | { ok: true; vehicleId: string; vehicle: Vehicle }
  | { ok: false; error: "owner_required" | "plate_or_vin_required" };

export function createCrmVehicle(db: Database, input: CreateVehicleInput): CreateVehicleResult {
  if (!input.userId) return { ok: false, error: "owner_required" };

  const plateRaw = input.plate?.trim() ?? "";
  const vin = input.vin?.trim().toUpperCase() ?? "";
  if (!plateRaw && vin.length < 5) {
    return { ok: false, error: "plate_or_vin_required" };
  }

  const plateKey = normalizePlateKey(plateRaw);
  const displayPlate = plateRaw || "—";

  if (plateKey.length >= 2) {
    const dup = db.vehicles.find(
      (v) => v.userId === input.userId && normalizePlateKey(v.plate) === plateKey
    );
    if (dup) {
      if (input.make?.trim()) dup.make = input.make.trim();
      if (input.model?.trim()) dup.model = input.model.trim();
      if (vin) dup.vin = vin;
      if (input.mileage != null && input.mileage > 0) dup.mileage = input.mileage;
      return { ok: true, vehicleId: dup.id, vehicle: dup };
    }
  }

  const vehicle: Vehicle = {
    id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: input.userId,
    vin,
    plate: displayPlate,
    mileage: input.mileage ?? 0,
    make: input.make?.trim() || "—",
    model: input.model?.trim() || "—",
    engine: input.engine?.trim() ?? "",
    engineVolume: input.engineVolume?.trim() ?? "",
    trim: "",
    power: input.power?.trim() ?? "",
    powerKw: input.powerKw?.trim() ?? "",
    transmission: input.transmission?.trim() ?? "",
    year: input.year?.trim() ?? "",
    color: input.color?.trim() ?? "",
    fuelType: input.fuelType?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    firstRegistrationDate: input.firstRegistrationDate,
    technicalInspectionExpiry: input.technicalInspectionExpiry,
    insuranceExpiry: input.insuranceExpiry,
    engineNumber: input.engineNumber?.trim(),
    carType: input.carType?.trim(),
  };

  db.vehicles.push(vehicle);
  return { ok: true, vehicleId: vehicle.id, vehicle };
}
