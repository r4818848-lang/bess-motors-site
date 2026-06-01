"use client";

import { useState, useCallback } from "react";
import { ScanLine, History } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb, type Vehicle, type User } from "@/lib/store";
import { pushCrmSave, scheduleCrmCloudPush } from "@/lib/cloud-crm-db";
import { decodeVin } from "@/lib/vin";
import { updateVehicleWithHistory, getVehicleHistory } from "@/lib/vehicle-history";
import { Button } from "@/components/ui/Button";

interface Props {
  userId: string;
  vehicleId: string;
  onVehicleId?: (id: string) => void;
}

export function VehicleClientEditor({ userId, vehicleId, onVehicleId }: Props) {
  const { t } = useI18n();
  const w = t.wo;
  const [tick, setTick] = useState(0);
  const [decoding, setDecoding] = useState(false);
  void tick;

  const db = loadDb();
  const user = db.users.find((u) => u.id === userId);
  const userVehicles = db.vehicles.filter((v) => v.userId === userId);
  let vehicle = db.vehicles.find((v) => v.id === vehicleId);

  const persist = useCallback(
    (patchUser?: Partial<User>, patchVehicle?: Partial<Vehicle>) => {
      const next = loadDb();
      if (patchUser && userId) {
        const u = next.users.find((x) => x.id === userId);
        if (u) Object.assign(u, patchUser);
      }
      if (patchVehicle && vehicleId) {
        updateVehicleWithHistory(next, vehicleId, patchVehicle, "Admin CRM");
      }
      saveDb(next);
      scheduleCrmCloudPush(next);
      setTick((n) => n + 1);
    },
    [userId, vehicleId]
  );

  const ensureVehicle = () => {
    if (vehicle) return vehicle.id;
    const next = loadDb();
    const v: Vehicle = {
      id: `v-${Date.now()}`,
      vin: "",
      plate: "",
      mileage: 0,
      make: "",
      model: "",
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
    next.vehicles.push(v);
    saveDb(next);
    void pushCrmSave(next);
    onVehicleId?.(v.id);
    setTick((n) => n + 1);
    return v.id;
  };

  if (!user) return null;

  const vid = vehicle?.id ?? vehicleId;
  vehicle = loadDb().vehicles.find((v) => v.id === vid);

  const history = vehicle ? getVehicleHistory(loadDb(), vehicle.id).slice(0, 8) : [];

  const onVinDecode = async (vin: string) => {
    if (vin.length !== 17) return;
    setDecoding(true);
    const result = await decodeVin(vin);
    setDecoding(false);
    if (!result.found) return;
    const id = vehicle?.id ?? ensureVehicle();
    persist(undefined, {
      vin,
      make: result.make || vehicle?.make,
      model: result.model || vehicle?.model,
      engine: result.engine || vehicle?.engine,
      engineVolume: result.engineVolume || vehicle?.engineVolume,
      trim: result.trim || vehicle?.trim,
      power: result.power || vehicle?.power,
      powerKw: result.powerKw || vehicle?.powerKw,
      transmission: result.transmission || vehicle?.transmission,
      drivetrain: result.drivetrain || vehicle?.drivetrain,
      fuelType: result.fuelType || vehicle?.fuelType,
      year: result.year || vehicle?.year,
    });
  };

  const field = (
    label: string,
    key: keyof Vehicle,
    type: "text" | "number" = "text"
  ) => (
    <div key={key}>
      <label className="text-[10px] uppercase text-bm-muted">{label}</label>
      <input
        type={type}
        className="input-premium mt-1 text-sm"
        value={
          type === "number"
            ? vehicle?.mileage ?? 0
            : String(vehicle?.[key] ?? "")
        }
        onChange={(e) => {
          const id = vehicle?.id ?? ensureVehicle();
          const val =
            type === "number" ? Number(e.target.value) : e.target.value;
          persist(undefined, { [key]: val } as Partial<Vehicle>);
        }}
        onBlur={() => setTick((n) => n + 1)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="glass-red rounded-xl p-5 neon-border">
        <h3 className="font-display text-sm uppercase text-bm-red mb-4">{w.clientData}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase text-bm-muted">{w.clientName}</label>
            <input
              className="input-premium mt-1 text-sm"
              value={user.name}
              onChange={(e) => persist({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-bm-muted">{w.clientPhone}</label>
            <input
              className="input-premium mt-1 text-sm font-mono"
              value={user.phone}
              onChange={(e) => persist({ phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="glass-red rounded-xl p-5 neon-border">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h3 className="font-display text-sm uppercase text-bm-red">{w.vehicleData}</h3>
          {!vehicle && (
            <Button variant="outline" className="text-xs" onClick={ensureVehicle}>
              {w.addVehicle}
            </Button>
          )}
        </div>

        {userVehicles.length > 1 && onVehicleId && (
          <div className="mb-4">
            <label className="text-[10px] uppercase text-bm-muted">{w.selectVehicle}</label>
            <select
              className="input-premium mt-1 text-sm"
              value={vehicleId}
              onChange={(e) => onVehicleId(e.target.value)}
            >
              {userVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} · {v.plate || v.vin || v.id}
                </option>
              ))}
            </select>
          </div>
        )}

        {vehicle && (
          <>
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <label className="text-[10px] uppercase text-bm-muted">VIN</label>
                <input
                  className="input-premium mt-1 text-sm font-mono uppercase"
                  value={vehicle.vin}
                  onChange={(e) => persist(undefined, { vin: e.target.value.toUpperCase() })}
                  onBlur={(e) => onVinDecode(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="mt-5 shrink-0"
                disabled={decoding || (vehicle.vin?.length ?? 0) !== 17}
                onClick={() => onVinDecode(vehicle.vin)}
              >
                <ScanLine size={16} />
                {decoding ? w.decodingVin : w.decodeVin}
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {field(w.plate, "plate")}
              {field(w.make, "make")}
              {field(w.model, "model")}
              {field(w.year, "year")}
              {field(w.engine, "engine")}
              {field(w.engineVolume, "engineVolume")}
              {field(w.power, "power")}
              {field(w.transmission, "transmission")}
              {field(w.drivetrain, "drivetrain")}
              {field(w.fuelType, "fuelType")}
              {field(w.color, "color")}
              {field(w.mileage, "mileage", "number")}
            </div>
            <div className="mt-3">
              <label className="text-[10px] uppercase text-bm-muted">{w.vehicleNotes}</label>
              <textarea
                className="input-premium mt-1 text-sm min-h-[72px]"
                value={vehicle.notes ?? ""}
                onChange={(e) => persist(undefined, { notes: e.target.value })}
              />
            </div>
            <p className="text-[10px] text-bm-muted mt-3">{w.autosaveHint}</p>
          </>
        )}
      </div>

      {history.length > 0 && (
        <div className="glass rounded-xl p-4 border border-bm-border/50">
          <h4 className="text-xs uppercase text-bm-muted flex items-center gap-2 mb-3">
            <History size={14} /> {w.vehicleHistory}
          </h4>
          <ul className="space-y-2 max-h-40 overflow-y-auto text-xs">
            {history.map((h) => (
              <li key={h.id} className="text-bm-muted border-b border-bm-border/30 pb-1">
                <span className="text-bm-red">{h.field}</span>: {h.oldValue || "—"} →{" "}
                {h.newValue || "—"}
                <span className="block text-[9px] opacity-60">
                  {new Date(h.changedAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
