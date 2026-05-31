import { normalizePhone, normalizePlateKey } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { ensureReferralCode } from "@/lib/referral-code";
import type {
  ClientPaymentTerms,
  ClientType,
  Database,
  PaymentMethod,
  User,
  Vehicle,
} from "@/lib/store";

export type CreateClientInput = {
  clientType?: ClientType;
  /** Display name (person) or filled from company */
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  nip?: string;
  regon?: string;
  contactFirstName?: string;
  contactLastName?: string;
  postalCode?: string;
  city?: string;
  street?: string;
  country?: string;
  clientPaymentMethod?: PaymentMethod;
  clientPaymentDays?: ClientPaymentTerms;
  discountServicesPercent?: number;
  discountPartsPercent?: number;
  clientDescription?: string;
  marketingConsent?: boolean;
  plate?: string;
  make?: string;
  model?: string;
  vin?: string;
  mileage?: number;
};

export type CreateClientError = "phone_required" | "name_required" | "company_required";

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

function applyClientFields(user: User, input: CreateClientInput): void {
  const type = input.clientType ?? "person";
  user.clientType = type;
  user.email = input.email?.trim() || user.email;
  user.postalCode = input.postalCode?.trim();
  user.city = input.city?.trim();
  user.street = input.street?.trim();
  user.country = input.country?.trim() || "PL";
  user.contactFirstName = input.contactFirstName?.trim();
  user.contactLastName = input.contactLastName?.trim();
  user.clientPaymentMethod = input.clientPaymentMethod;
  user.clientPaymentDays = input.clientPaymentDays;
  user.discountServicesPercent = input.discountServicesPercent;
  user.discountPartsPercent = input.discountPartsPercent;
  user.clientDescription = input.clientDescription?.trim();
  user.marketingConsent = input.marketingConsent ?? false;

  if (type === "company") {
    user.companyName = input.companyName?.trim() || input.name.trim();
    user.nip = input.nip?.replace(/\D/g, "") || undefined;
    user.regon = input.regon?.trim();
    user.name = user.companyName || user.name;
  } else {
    user.companyName = undefined;
    user.nip = undefined;
    user.regon = undefined;
    user.name = input.name.trim();
  }
}

/** Admin CRM: create client + vehicle or attach vehicle to existing phone */
export async function createCrmClientWithVehicle(
  db: Database,
  input: CreateClientInput
): Promise<CreateClientResult> {
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "phone_required" };

  const type = input.clientType ?? "person";
  if (type === "company" && !(input.companyName?.trim() || input.name.trim())) {
    return { ok: false, error: "company_required" };
  }

  const name =
    type === "company"
      ? (input.companyName?.trim() || input.name.trim())
      : input.name.trim();
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
    };
    applyClientFields(user, { ...input, name });
    if (plateKey.length >= 2) {
      user.passwordHash = await hashPassword(plateKey);
    }
    ensureReferralCode(user, db);
    db.users.push(user);
    createdUser = true;
  } else {
    applyClientFields(user, { ...input, name });
    if (plateKey.length >= 2 && !user.passwordHash) {
      user.passwordHash = await hashPassword(plateKey);
    }
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

  let vehicle = userVehicles.find((v) => !v.plate?.trim() || v.plate === "—");

  if (vehicle && plateKey.length >= 2) {
    vehicle.plate = displayPlate;
    if (input.make?.trim()) vehicle.make = input.make.trim();
    if (input.model?.trim()) vehicle.model = input.model.trim();
    if (input.vin?.trim()) vehicle.vin = input.vin.trim();
    if (input.mileage != null && input.mileage > 0) vehicle.mileage = input.mileage;
    return {
      ok: true,
      userId: user.id,
      vehicleId: vehicle.id,
      createdUser,
      createdVehicle: false,
      user,
    };
  }

  if (!vehicle || plateKey.length >= 2 || input.vin?.trim()) {
    vehicle = {
      ...emptyVehicleFields(user.id, displayPlate),
      make: input.make?.trim() || "—",
      model: input.model?.trim() || "—",
      vin: input.vin?.trim() || "",
      mileage: input.mileage ?? 0,
    };
    db.vehicles.push(vehicle);
    createdVehicle = true;
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
