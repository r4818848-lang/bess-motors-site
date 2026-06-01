"use client";

import { useState, useEffect } from "react";
import { Car, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb } from "@/lib/store";
import { pushCrmSave } from "@/lib/cloud-crm-db";
import { createCrmVehicle } from "@/lib/crm-create-vehicle";
import { CrmModalShell } from "./CrmModalShell";
import { CrmFormField } from "./CrmFormField";
import { Button } from "@/components/ui/Button";

const FUEL_TYPES = ["petrol", "diesel", "lpg", "electric", "hybrid"] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (vehicleId: string, userId: string) => void;
  initialUserId?: string;
};

export function AddVehicleModal({ open, onClose, onCreated, initialUserId }: Props) {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;

  const [userId, setUserId] = useState(initialUserId ?? "");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [engineVolume, setEngineVolume] = useState("");
  const [powerKw, setPowerKw] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [mileage, setMileage] = useState("");
  const [firstReg, setFirstReg] = useState("");
  const [techInspection, setTechInspection] = useState("");
  const [insurance, setInsurance] = useState("");
  const [notes, setNotes] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && initialUserId) setUserId(initialUserId);
  }, [open, initialUserId]);

  const clients = open
    ? loadDb().users.filter((u) => u.role === "client")
    : [];

  const decodeVin = async () => {
    const v = vin.replace(/\s/g, "").toUpperCase();
    if (v.length !== 17) {
      setError(c.vinInvalid);
      return;
    }
    setVinLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/vin/decode?vin=${encodeURIComponent(v)}`);
      const data = await res.json();
      if (!data.found) {
        setError(c.vinNotFound);
        return;
      }
      if (data.make) setMake(data.make);
      if (data.model) setModel(data.model);
      if (data.year) setYear(String(data.year));
      if (data.color) setColor(data.color);
      if (data.engineVolume) setEngineVolume(String(data.engineVolume));
      if (data.fuelType) setFuelType(data.fuelType);
    } catch {
      setError(c.vinLookupFailed);
    } finally {
      setVinLoading(false);
    }
  };

  const submit = async () => {
    setError("");
    if (!userId) {
      setError(c.selectOwner);
      return;
    }
    setSaving(true);
    try {
      const db = loadDb();
      const result = createCrmVehicle(db, {
        userId,
        plate,
        vin,
        make,
        model,
        year,
        color,
        engineVolume,
        powerKw,
        fuelType,
        mileage: mileage ? Number(mileage) : undefined,
        firstRegistrationDate: firstReg || undefined,
        technicalInspectionExpiry: techInspection || undefined,
        insuranceExpiry: insurance || undefined,
        notes,
      });
      if (!result.ok) {
        setError(
          result.error === "owner_required"
            ? c.selectOwner
            : c.plateOrVinRequired
        );
        return;
      }
      saveDb(db);
      const ok = await pushCrmSave(db);
      if (!ok) {
        setError(c.syncFailed);
        onCreated(result.vehicleId, userId);
        return;
      }
      onCreated(result.vehicleId, userId);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrmModalShell
      open={open}
      onClose={onClose}
      wide
      title={c.newVehicleTitle}
      icon={<Car className="text-bm-red shrink-0" size={22} />}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? c.savingVehicle : c.saveVehicle}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CrmFormField label={c.currentOwner} required className="sm:col-span-2 lg:col-span-4">
          <select
            className="input-premium"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">—</option>
            {clients.map((u) => (
              <option key={u.id} value={u.id}>
                {u.clientType === "company" ? u.companyName || u.name : u.name} · {u.phone}
                {u.nip ? ` · NIP ${u.nip}` : ""}
              </option>
            ))}
          </select>
        </CrmFormField>

        <CrmFormField label={c.plateNumber}>
          <input
            className="input-premium font-mono"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
        </CrmFormField>

        <CrmFormField label="VIN">
          <div className="flex gap-2">
            <input
              className="input-premium flex-1 font-mono"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              maxLength={17}
            />
            <button
              type="button"
              className="btn-primary px-3 shrink-0"
              onClick={() => void decodeVin()}
              disabled={vinLoading}
              title={c.vinLookup}
            >
              <Search size={18} />
            </button>
          </div>
        </CrmFormField>

        <CrmFormField label={c.makeModel}>
          <input className="input-premium" value={make} onChange={(e) => setMake(e.target.value)} />
        </CrmFormField>
        <CrmFormField label={w.model}>
          <input className="input-premium" value={model} onChange={(e) => setModel(e.target.value)} />
        </CrmFormField>
        <CrmFormField label={c.year}>
          <input className="input-premium" value={year} onChange={(e) => setYear(e.target.value)} />
        </CrmFormField>
        <CrmFormField label={c.color}>
          <input
            className="input-premium"
            name="bm-vehicle-color"
            autoComplete="off"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </CrmFormField>
        <CrmFormField label={c.engine}>
          <div className="flex gap-2">
            <input
              className="input-premium flex-1"
              value={engineVolume}
              onChange={(e) => setEngineVolume(e.target.value)}
              placeholder="cm³"
            />
            <input
              className="input-premium w-20"
              value={powerKw}
              onChange={(e) => setPowerKw(e.target.value)}
              placeholder="kW"
            />
          </div>
        </CrmFormField>
        <CrmFormField label={c.fuelType}>
          <select
            className="input-premium"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
          >
            <option value="">—</option>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {c.fuelTypes[f] ?? f}
              </option>
            ))}
          </select>
        </CrmFormField>
        <CrmFormField label={c.mileage}>
          <input
            className="input-premium"
            type="number"
            min={0}
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
          />
        </CrmFormField>
        <CrmFormField label={c.firstRegistration}>
          <input
            type="date"
            className="input-premium"
            value={firstReg}
            onChange={(e) => setFirstReg(e.target.value)}
          />
        </CrmFormField>
        <CrmFormField label={c.techInspection}>
          <input
            type="date"
            className="input-premium"
            value={techInspection}
            onChange={(e) => setTechInspection(e.target.value)}
          />
        </CrmFormField>
        <CrmFormField label={c.insuranceExpiry}>
          <input
            type="date"
            className="input-premium"
            value={insurance}
            onChange={(e) => setInsurance(e.target.value)}
          />
        </CrmFormField>
        <CrmFormField label={c.vehicleDescription} className="sm:col-span-2 lg:col-span-4">
          <textarea
            className="input-premium min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CrmFormField>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </CrmModalShell>
  );
}
