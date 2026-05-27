import type { Vehicle } from "@/lib/store";
import { enrichVehicleMedia } from "@/lib/vehicle-image";
import { decodeVinFromSources } from "@/lib/vin-decode-sources";
import { decodeVinPaint } from "@/lib/vin-paint";
import type { Database } from "@/lib/store";
import { cloudGetCrmStore, cloudPutCrmStore } from "@/lib/server/crm-cloud";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function normalizeVinInput(text: string): string {
  return text.replace(/\s/g, "").toUpperCase();
}

export async function decodeVinForClient(vin: string): Promise<{
  ok: boolean;
  found?: boolean;
  vehicle?: Partial<Vehicle>;
}> {
  const v = normalizeVinInput(vin);
  if (v.length !== 17) return { ok: false, found: false };
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) return { ok: false, found: false };

  const decoded = await decodeVinFromSources(v, { includeMeta: false });
  if (!decoded.found || !decoded.make) return { ok: true, found: false };

  const paint = decodeVinPaint(v, decoded.make);
  return {
    ok: true,
    found: true,
    vehicle: {
      vin: v,
      make: decoded.make ?? "",
      model: decoded.model ?? "",
      trim: decoded.trim ?? "",
      year: decoded.year ?? "",
      engine: decoded.engine ?? "",
      engineVolume: decoded.engineVolume ?? "",
      power: decoded.power ?? "",
      powerKw: decoded.powerKw ?? "",
      transmission: decoded.transmission ?? "",
      drivetrain: decoded.drivetrain ?? "",
      fuelType: decoded.fuelType ?? "",
      color: decoded.color || paint.color,
      colorHex: decoded.colorHex || paint.colorHex,
    },
  };
}

function findLinkedClient(db: Database, chatId: string) {
  return db.users.find(
    (u) => u.role === "client" && u.telegramChatId === String(chatId)
  );
}

export function formatVinPreview(v: Partial<Vehicle>): string {
  const lines = [
    "🚗 <b>Автомобиль по VIN</b>",
    "",
    v.vin ? `VIN: <code>${esc(v.vin)}</code>` : "",
    v.make || v.model ? `<b>${esc(`${v.make ?? ""} ${v.model ?? ""}`.trim())}</b>` : "",
    v.year ? `Год: ${esc(String(v.year))}` : "",
    v.engine ? `Двигатель: ${esc(String(v.engine))}` : "",
    v.engineVolume ? `Объём: ${esc(String(v.engineVolume))}` : "",
    v.transmission ? `КПП: ${esc(String(v.transmission))}` : "",
    v.drivetrain ? `Привод: ${esc(String(v.drivetrain))}` : "",
    v.fuelType ? `Топливо: ${esc(String(v.fuelType))}` : "",
    v.color ? `Цвет: ${esc(String(v.color))}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

export async function addVehicleByVinToLinkedClient(params: {
  chatId: string;
  vin: string;
  plate?: string;
}): Promise<{ ok: boolean; error?: string; vehicleId?: string }> {
  const snap = await cloudGetCrmStore();
  if (!snap?.doc) return { ok: false, error: "cloud_empty" };

  const db = structuredClone(snap.doc) as Database;
  const user = findLinkedClient(db, params.chatId);
  if (!user) return { ok: false, error: "not_linked" };

  const decoded = await decodeVinForClient(params.vin);
  if (!decoded.ok || !decoded.found || !decoded.vehicle?.vin) {
    return { ok: false, error: "vin_not_found" };
  }

  const vin = decoded.vehicle.vin;
  const duplicate = db.vehicles.some(
    (v) => v.userId === user.id && normalizeVinInput(v.vin) === vin
  );
  if (duplicate) return { ok: false, error: "duplicate" };

  const plate = (params.plate ?? "").trim() || `VIN-${vin.slice(-6)}`;
  const vehicle: Vehicle = enrichVehicleMedia({
    id: `v-${Date.now()}`,
    userId: user.id,
    plate,
    mileage: 0,
    vin,
    make: decoded.vehicle.make ?? "",
    model: decoded.vehicle.model ?? "",
    engine: decoded.vehicle.engine ?? "",
    trim: decoded.vehicle.trim ?? "",
    power: decoded.vehicle.power ?? "",
    powerKw: decoded.vehicle.powerKw ?? undefined,
    transmission: decoded.vehicle.transmission ?? "",
    year: decoded.vehicle.year ?? undefined,
    engineVolume: decoded.vehicle.engineVolume ?? undefined,
    drivetrain: decoded.vehicle.drivetrain ?? undefined,
    fuelType: decoded.vehicle.fuelType ?? undefined,
    color: decoded.vehicle.color ?? undefined,
    colorHex: decoded.vehicle.colorHex ?? undefined,
  }) as Vehicle;

  db.vehicles.push(vehicle);
  const put = await cloudPutCrmStore(db);
  if (!put.ok) return { ok: false, error: put.error ?? "cloud_error" };
  return { ok: true, vehicleId: vehicle.id };
}

