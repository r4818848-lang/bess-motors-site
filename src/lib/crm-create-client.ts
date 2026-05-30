import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { ensureReferralCode } from "@/lib/referral-code";
import type { Database, User, Vehicle } from "@/lib/store";

export type CreateClientInput = {
  name: string;
  phone: string;
  plate?: string;
  make?: string;
  model?: string;
  vin?: string;
  mileage?: number;
  email?: string;
};

export type CreateClientError = "phone_required" | "name_required";

export type CreateClientResult =
  | {
      ok: true;
      userId: string;
      vehicleId: string;
      createdUser: boolean;
      createdVehicle: boolean;
      user: User;
    }
  | { ok: false; error: CreateClientError };

function emptyVehicleFields(userId: string, plate: string): Vehicle {
  return {
    id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    vin: "",
    plate,
    mileage: 0,
    make: "—",
    model: "—",
    engine: "",
    engineVolume: "",
    trim: "",
    power: "",
    transmission: "",
    drivetrain: "",
    year: "",
    color: "",
    fuelType: "",
    notes: "",
    userId,
  };
}

/** Admin CRM: create client + vehicle or attach vehicle to existing phone */
export async function createCrmClientWithVehicle(
  db: Database,
  input: CreateClientInput
): Promise<CreateClientResult> {
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "phone_required" };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "name_required" };

  const today = new Date().toISOString().slice(0, 10);
  const plateRaw = input.plate?.trim() ?? "";
  const plateKey = normalizePlateKey(plateRaw);
  const displayPlate = plateRaw || "—";

  let user = db.users.find(
    (u) => u.role === "client" && normalizePhone(u.phone) === phone
  );

  let createdUser = false;
  let createdVehicle = false;

  if (!user) {
    user = {
      id: `client-${Date.now()}`,
      phone,
      name,
      role: "client",
      createdAt: today,
      email: input.email?.trim() || undefined,
    };
    if (plateKey.length >= 2) {
      user.passwordHash = await hashPassword(plateKey);
    }
    ensureReferralCode(user, db);
    db.users.push(user);
    createdUser = true;
  } else if (name && name !== "—") {
    user.name = name;
    if (input.email?.trim()) user.email = input.email.trim();
  }

  const userVehicles = db.vehicles.filter((v) => v.userId === user!.id);

  if (plateKey.length >= 2) {
    const byPlate = userVehicles.find(
      (v) => normalizePlateKey(v.plate) === plateKey
    );
    if (byPlate) {
      if (input.make?.trim()) byPlate.make = input.make.trim();
      if (input.model?.trim()) byPlate.model = input.model.trim();
      if (input.vin?.trim()) byPlate.vin = input.vin.trim();
      if (input.mileage != null && input.mileage > 0) byPlate.mileage = input.mileage;
      return {
        ok: true,
        userId: user.id,
        vehicleId: byPlate.id,
        createdUser,
        createdVehicle: false,
        user,
      };
    }
  }

  let vehicle = userVehicles.find(
    (v) => !v.plate?.trim() || v.plate === "—"
  );

  if (vehicle && plateKey.length >= 2) {
    vehicle.plate = displayPlate;
    if (input.make?.trim()) vehicle.make = input.make.trim();
    if (input.model?.trim()) vehicle.model = input.model.trim();
    if (input.vin?.trim()) vehicle.vin = input.vin.trim();
    if (input.mileage != null && input.mileage > 0) vehicle.mileage = input.mileage;
    if (!user.passwordHash && plateKey.length >= 2) {
      user.passwordHash = await hashPassword(plateKey);
    }
    return {
      ok: true,
      userId: user.id,
      vehicleId: vehicle.id,
      createdUser,
      createdVehicle: false,
      user,
    };
  }

  if (!vehicle || plateKey.length >= 2) {
    vehicle = {
      ...emptyVehicleFields(user.id, displayPlate),
      make: input.make?.trim() || "—",
      model: input.model?.trim() || "—",
      vin: input.vin?.trim() || "",
      mileage: input.mileage ?? 0,
    };
    db.vehicles.push(vehicle);
    createdVehicle = true;
    if (!user.passwordHash && plateKey.length >= 2) {
      user.passwordHash = await hashPassword(plateKey);
    }
  }

  return {
    ok: true,
    userId: user.id,
    vehicleId: vehicle.id,
    createdUser,
    createdVehicle,
    user,
  };
}
