"use client";

import { useState } from "react";
import { Settings, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { normalizePhone } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { loadDb, saveDb, type MechanicProfile } from "@/lib/store";
import { pushCrmSave } from "@/lib/cloud-crm-db";
import { Button } from "@/components/ui/Button";
import { PriceNumberInput } from "@/components/ui/PriceNumberInput";
import { DataBackupPanel } from "@/components/crm/DataBackupPanel";
import { CrmEnvHealthPanel } from "@/components/crm/CrmEnvHealthPanel";

type MechRow = MechanicProfile & { phone: string; newPassword: string };

function loadMechanicRows(): MechRow[] {
  const db = loadDb();
  return db.mechanics.map((m) => ({
    ...m,
    phone: db.users.find((u) => u.id === m.id)?.phone ?? "",
    newPassword: "",
  }));
}

export function SettingsPanel({ onUpdate }: { onUpdate: () => void }) {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const db = loadDb();
  const [settings, setSettings] = useState({ ...db.settings });
  const [mechanics, setMechanics] = useState<MechRow[]>(loadMechanicRows);
  const [saving, setSaving] = useState(false);

  const addMechanic = () => {
    const id = `mech-${Date.now()}`;
    setMechanics([
      ...mechanics,
      {
        id,
        name: w.addMechanic,
        laborPercent: settings.defaultLaborPercent,
        partsPercent: settings.defaultPartsPercent,
        bonusPerOrder: 0,
        phone: "",
        newPassword: "1234",
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

  const save = async () => {
    setSaving(true);
    try {
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
        fresh.users = fresh.users.filter((u) => u.id !== removedId);
      }

      fresh.settings = settings;
      fresh.mechanics = mechanics.map(({ phone: _p, newPassword: _np, ...m }) => ({
        ...m,
        name: m.name.trim() || w.addMechanic,
      }));

      for (const row of mechanics) {
        const phone = normalizePhone(row.phone);
        let user = fresh.users.find((u) => u.id === row.id);
        if (!user) {
          user = {
            id: row.id,
            phone: phone || "+48000000000",
            name: row.name.trim() || w.addMechanic,
            role: "mechanic",
            createdAt: new Date().toISOString().slice(0, 10),
          };
          fresh.users.push(user);
        }
        user.name = row.name.trim() || w.addMechanic;
        if (phone) user.phone = phone;
        if (row.newPassword.trim()) {
          user.passwordHash = await hashPassword(row.newPassword.trim());
          delete user.password;
        } else if (!user.passwordHash && !user.password) {
          user.password = "1234";
        }
      }

      saveDb(fresh);
      const ok = await pushCrmSave(fresh);
      if (!ok) alert(c.syncFailed);
      setMechanics(loadMechanicRows());
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl uppercase text-glow flex items-center gap-2">
        <Settings className="text-bm-red" /> {w.settingsTitle}
      </h2>

      <CrmEnvHealthPanel />

      <div className="glass-red rounded-xl p-6 neon-border space-y-4">
        <h3 className="font-display text-sm uppercase text-bm-red">{w.automationTitle}</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoCreateWorkOrderFromBooking !== false}
            onChange={(e) =>
              setSettings({ ...settings, autoCreateWorkOrderFromBooking: e.target.checked })
            }
          />
          {w.autoWorkOrderFromBooking}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoConfirmWebBookings !== false}
            onChange={(e) =>
              setSettings({ ...settings, autoConfirmWebBookings: e.target.checked })
            }
          />
          {w.autoConfirmWebBookings}
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={!settings.automationDisabled}
            onChange={(e) =>
              setSettings({ ...settings, automationDisabled: !e.target.checked })
            }
          />
          {w.crmAutomationEnabled}
        </label>
        <div>
          <label className="text-xs text-bm-muted uppercase">{w.blockedSlotsLabel}</label>
          <textarea
            className="input-premium mt-1 w-full min-h-[72px] font-mono text-xs"
            value={(settings.blockedBookingSlots ?? []).join("\n")}
            onChange={(e) =>
              setSettings({
                ...settings,
                blockedBookingSlots: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder={w.blockedSlotsPlaceholder}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-bm-muted uppercase">{w.lunchBreakFrom}</label>
            <input
              type="time"
              className="input-premium mt-1"
              value={settings.lunchBreakStart ?? "13:00"}
              onChange={(e) => setSettings({ ...settings, lunchBreakStart: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-bm-muted uppercase">{w.lunchBreakTo}</label>
            <input
              type="time"
              className="input-premium mt-1"
              value={settings.lunchBreakEnd ?? "14:00"}
              onChange={(e) => setSettings({ ...settings, lunchBreakEnd: e.target.value })}
            />
          </div>
        </div>
      </div>

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
        <div className="overflow-x-auto">
          <table className="dashboard-table min-w-[720px]">
            <thead>
              <tr>
                <th>{t.crm.name}</th>
                <th>{t.cabinet.phone}</th>
                <th>{w.mechanicPassword}</th>
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
                      className="input-premium py-1 text-sm min-w-[140px]"
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
                      type="tel"
                      className="input-premium py-1 text-sm min-w-[130px]"
                      placeholder="+48..."
                      value={m.phone}
                      onChange={(e) => {
                        const next = [...mechanics];
                        next[i] = { ...m, phone: e.target.value };
                        setMechanics(next);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="input-premium py-1 text-sm min-w-[100px]"
                      placeholder={w.passwordKeepHint}
                      value={m.newPassword}
                      onChange={(e) => {
                        const next = [...mechanics];
                        next[i] = { ...m, newPassword: e.target.value };
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
                    <PriceNumberInput
                      className="input-premium w-16 py-1 text-sm"
                      min={0}
                      step={0.01}
                      value={m.bonusPerOrder}
                      onChange={(bonusPerOrder) => {
                        const next = [...mechanics];
                        next[i] = { ...m, bonusPerOrder };
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
        <p className="px-4 py-2 text-[10px] text-bm-muted">{w.mechanicLoginHint}</p>
      </div>

      <DataBackupPanel onUpdate={onUpdate} />

      <Button onClick={() => void save()} disabled={saving}>
        {saving ? t.common.loading : t.common.save}
      </Button>
    </div>
  );
}
