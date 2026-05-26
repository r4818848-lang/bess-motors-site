"use client";

import { useState } from "react";
import { Settings, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb, type MechanicProfile } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { DataBackupPanel } from "@/components/crm/DataBackupPanel";

export function SettingsPanel({ onUpdate }: { onUpdate: () => void }) {
  const { t } = useI18n();
  const w = t.wo;
  const db = loadDb();
  const [settings, setSettings] = useState({ ...db.settings });
  const [mechanics, setMechanics] = useState<MechanicProfile[]>(
    db.mechanics.map((m) => ({ ...m }))
  );

  const addMechanic = () => {
    setMechanics([
      ...mechanics,
      {
        id: `mech-${Date.now()}`,
        name: w.addMechanic,
        laborPercent: settings.defaultLaborPercent,
        partsPercent: settings.defaultPartsPercent,
        bonusPerOrder: 0,
      },
    ]);
  };

  const deleteMechanic = (id: string) => {
    if (mechanics.length <= 1) {
      alert(w.cannotDeleteLastMechanic);
      return;
    }
    if (!confirm(w.confirmDeleteMechanic)) return;
    setMechanics(mechanics.filter((m) => m.id !== id));
  };

  const save = () => {
    const fresh = loadDb();
    const removedIds = fresh.mechanics
      .filter((m) => !mechanics.some((n) => n.id === m.id))
      .map((m) => m.id);
    const fallbackId = mechanics[0]?.id ?? fresh.mechanics[0]?.id ?? "mech-1";

    for (const removedId of removedIds) {
      fresh.workOrders.forEach((o) => {
        if (o.mechanicId === removedId) o.mechanicId = fallbackId;
      });
      fresh.appointments.forEach((a) => {
        if (a.mechanicId === removedId) a.mechanicId = fallbackId;
      });
    }

    fresh.settings = settings;
    fresh.mechanics = mechanics.map((m) => ({
      ...m,
      name: m.name.trim() || w.addMechanic,
    }));
    saveDb(fresh);
    onUpdate();
  };

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl uppercase text-glow flex items-center gap-2">
        <Settings className="text-bm-red" /> {w.settingsTitle}
      </h2>

      <div className="glass-red rounded-xl p-6 neon-border grid md:grid-cols-2 gap-6">
        <h3 className="md:col-span-2 font-display text-sm uppercase text-bm-red">
          {w.defaultRates}
        </h3>
        <div>
          <label className="text-xs text-bm-muted uppercase">{w.laborPercentDefault}</label>
          <input
            type="number"
            min={0}
            max={100}
            className="input-premium mt-1"
            value={settings.defaultLaborPercent}
            onChange={(e) =>
              setSettings({ ...settings, defaultLaborPercent: Number(e.target.value) })
            }
          />
          <p className="text-[10px] text-bm-muted mt-1">{w.laborPercentHint}</p>
        </div>
        <div>
          <label className="text-xs text-bm-muted uppercase">{w.partsPercentDefault}</label>
          <input
            type="number"
            min={0}
            max={100}
            className="input-premium mt-1"
            value={settings.defaultPartsPercent}
            onChange={(e) =>
              setSettings({ ...settings, defaultPartsPercent: Number(e.target.value) })
            }
          />
          <p className="text-[10px] text-bm-muted mt-1">{w.partsPercentHint}</p>
        </div>
      </div>

      <div className="glass-red rounded-xl overflow-hidden neon-border">
        <div className="px-4 py-3 border-b border-bm-border bg-bm-red/10 flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-sm uppercase font-bold">{w.mechanicProfiles}</span>
          <Button type="button" variant="outline" className="text-xs py-1.5" onClick={addMechanic}>
            <Plus size={14} /> {w.addMechanic}
          </Button>
        </div>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>{t.crm.name}</th>
              <th>{w.laborPercent}</th>
              <th>{w.partsPercent}</th>
              <th>{w.bonus}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mechanics.map((m, i) => (
              <tr key={m.id}>
                <td>
                  <input
                    type="text"
                    className="input-premium py-1 text-sm min-w-[160px]"
                    value={m.name}
                    onChange={(e) => {
                      const next = [...mechanics];
                      next[i] = { ...m, name: e.target.value };
                      setMechanics(next);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input-premium w-16 py-1 text-sm"
                    value={m.laborPercent}
                    onChange={(e) => {
                      const next = [...mechanics];
                      next[i] = { ...m, laborPercent: Number(e.target.value) };
                      setMechanics(next);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input-premium w-16 py-1 text-sm"
                    value={m.partsPercent}
                    onChange={(e) => {
                      const next = [...mechanics];
                      next[i] = { ...m, partsPercent: Number(e.target.value) };
                      setMechanics(next);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="input-premium w-16 py-1 text-sm"
                    value={m.bonusPerOrder}
                    onChange={(e) => {
                      const next = [...mechanics];
                      next[i] = { ...m, bonusPerOrder: Number(e.target.value) };
                      setMechanics(next);
                    }}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => deleteMechanic(m.id)}
                    className="p-2 text-red-400 hover:text-red-300"
                    title={w.deleteMechanic}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DataBackupPanel onUpdate={onUpdate} />

      <Button onClick={save}>{t.common.save}</Button>
    </div>
  );
}
