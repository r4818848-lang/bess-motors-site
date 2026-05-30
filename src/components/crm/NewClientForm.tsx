"use client";

import { useState } from "react";
import { UserPlus, Save, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb } from "@/lib/store";
import { createCrmClientWithVehicle } from "@/lib/crm-create-client";
import { Button } from "@/components/ui/Button";

interface NewClientFormProps {
  onCreated: (userId: string, vehicleId: string) => void;
  onCancel?: () => void;
  /** Compact layout for embedding in work order wizard */
  compact?: boolean;
}

export function NewClientForm({ onCreated, onCancel, compact }: NewClientFormProps) {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");
    setSaving(true);
    try {
      const db = loadDb();
      const result = await createCrmClientWithVehicle(db, {
        name,
        phone,
        plate,
        make,
        model,
        vin,
        mileage: mileage ? Number(mileage) : undefined,
      });
      if (!result.ok) {
        setError(
          result.error === "phone_required"
            ? c.phoneRequired
            : c.nameRequired
        );
        return;
      }
      saveDb(db);
      if (!result.createdUser) {
        setInfo(c.existingClientLinked);
      }
      onCreated(result.userId, result.vehicleId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={
        compact
          ? "space-y-4 rounded-xl border border-bm-red/30 bg-bm-card/40 p-4"
          : "glass-red rounded-xl p-6 neon-border space-y-4"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm uppercase text-bm-red flex items-center gap-2">
            <UserPlus size={16} /> {c.newClientTitle}
          </h3>
          {!compact && (
            <p className="text-xs text-bm-muted mt-1 max-w-lg">{c.newClientHint}</p>
          )}
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-bm-muted hover:text-white p-1"
            aria-label={t.common.cancel}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        <div>
          <label className="text-[10px] uppercase text-bm-muted">{w.clientName} *</label>
          <input
            className="input-premium mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jan Kowalski"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-bm-muted">{w.clientPhone} *</label>
          <input
            className="input-premium mt-1"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+48 791 257 229"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-bm-muted">{w.plate}</label>
          <input
            className="input-premium mt-1"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="WW 12345"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-bm-muted">{w.make}</label>
          <input
            className="input-premium mt-1"
            value={make}
            onChange={(e) => setMake(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-bm-muted">{w.model}</label>
          <input
            className="input-premium mt-1"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-bm-muted">VIN</label>
          <input
            className="input-premium mt-1 font-mono text-sm"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            maxLength={17}
          />
        </div>
        {!compact && (
          <div>
            <label className="text-[10px] uppercase text-bm-muted">{w.mileage}</label>
            <input
              className="input-premium mt-1"
              type="number"
              min={0}
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {info && (
        <p className="text-sm text-amber-300/90 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {info}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={submit} disabled={saving}>
          <Save size={16} /> {saving ? c.savingClient : c.createClient}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        )}
      </div>
    </div>
  );
}
