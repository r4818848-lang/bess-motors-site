"use client";

import { useMemo, useState } from "react";
import { X, Plus, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { normalizePlateKey } from "@/lib/auth";
import { buildFleetFinance } from "@/lib/client-fleet-finance";
import { FLEET_CLIENT_TAG, isFleetPortalUser, setFleetClientTag } from "@/lib/client-fleet-access";
import { sliceForClient } from "@/lib/client-sign";
import { loadDb, saveDb, type User, type Vehicle } from "@/lib/store";
import { pushCrmSave, scheduleCrmCloudPush } from "@/lib/cloud-crm-db";
import { useDbSync } from "@/hooks/useDbSync";
import { calcClientTotal } from "@/lib/workorder-calc";
import { Button } from "@/components/ui/Button";

type Props = {
  userId: string | null;
  onClose: () => void;
};

export function ClientFleetModal({ userId, onClose }: Props) {
  const { t } = useI18n();
  const f = t.crm.fleet;
  const dbTick = useDbSync();
  const [newPlate, setNewPlate] = useState("");
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");

  const snapshot = useMemo(() => {
    void dbTick;
    const db = loadDb();
    const user = userId ? db.users.find((u) => u.id === userId) : undefined;
    if (!user || user.role !== "client") return null;
    const slice = sliceForClient(db, user.id);
    if (!slice) return null;
    const finance = buildFleetFinance(slice);
    return { user, slice, finance };
  }, [userId, dbTick]);

  if (!userId || !snapshot) return null;

  const { user, slice, finance } = snapshot;
  const fleetTagActive = isFleetPortalUser(user);

  const toggleFleetTag = () => {
    const next = loadDb();
    const u = next.users.find((x) => x.id === user.id);
    if (!u) return;
    setFleetClientTag(u, !fleetTagActive);
    saveDb(next);
    void pushCrmSave(next);
  };

  const addVehicle = () => {
    const plate = newPlate.trim();
    if (!plate) return;
    const key = normalizePlateKey(plate);
    const next = loadDb();
    const exists = next.vehicles.find(
      (v) => v.userId === user.id && normalizePlateKey(v.plate) === key
    );
    if (exists) {
      alert(f.plateExists);
      return;
    }
    const v: Vehicle = {
      id: `v-${Date.now()}`,
      vin: "",
      plate,
      mileage: 0,
      make: newMake.trim(),
      model: newModel.trim(),
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
      userId: user.id,
    };
    next.vehicles.push(v);
    saveDb(next);
    void pushCrmSave(next);
    setNewPlate("");
    setNewMake("");
    setNewModel("");
  };

  const reassignOrphanOrders = () => {
    const next = loadDb();
    const plates = next.vehicles.filter((v) => v.userId === user.id);
    if (plates.length === 0) return;
    const defaultV = plates[0];
    let n = 0;
    for (const o of next.workOrders) {
      if (o.userId !== user.id) continue;
      if (o.vehicleId && plates.some((v) => v.id === o.vehicleId)) continue;
      o.vehicleId = defaultV.id;
      n += 1;
    }
    if (n > 0) {
      saveDb(next);
      void pushCrmSave(next);
      alert(f.linkedOrders(n));
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="crm-mw-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-bm-dark">{f.title}</h2>
            <p className="text-sm text-bm-muted mt-1">
              {user.name} · <span className="font-mono text-bm-red">{user.phone}</span>
            </p>
            <p className="text-xs mt-1 flex items-center gap-1">
              <MessageCircle size={14} />
              {user.telegramChatId ? (
                <span className="text-emerald-700">{f.telegramOk}</span>
              ) : (
                <span className="text-amber-700">{f.telegramNo}</span>
              )}
            </p>
            <div className="mt-3 rounded-lg border border-slate-200 p-3 text-left">
              <p className="text-xs font-semibold text-bm-dark">{f.fleetTagLabel}</p>
              <p className="text-[11px] text-bm-muted mt-1">{f.fleetTagHint}</p>
              <button
                type="button"
                onClick={toggleFleetTag}
                className={`mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg ${
                  fleetTagActive
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-slate-100 text-bm-muted"
                }`}
              >
                {fleetTagActive ? f.fleetTagOn : f.fleetTagOff}
              </button>
              {fleetTagActive ? (
                <span className="ml-2 text-[10px] uppercase text-bm-red font-mono">
                  {FLEET_CLIENT_TAG}
                </span>
              ) : null}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-bm-muted hover:text-bm-dark">
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-bm-muted text-xs">{f.total}</div>
            <div className="font-mono font-bold">{finance.grandTotal.toFixed(2)} zł</div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3">
            <div className="text-bm-muted text-xs">{f.paid}</div>
            <div className="font-mono font-bold text-emerald-800">
              {finance.grandPaid.toFixed(2)} zł
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <div className="text-bm-muted text-xs">{f.unpaid}</div>
            <div className="font-mono font-bold text-amber-900">
              {finance.grandUnpaid.toFixed(2)} zł
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-sm mb-2">{f.vehicles} ({slice.vehicles.length})</h3>
        <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {slice.vehicles.length === 0 ? (
            <li className="text-sm text-bm-muted">{f.noVehicles}</li>
          ) : (
            finance.vehicles.map((row) => (
              <li
                key={row.vehicleId}
                className="flex justify-between gap-2 text-sm border-b border-slate-100 pb-2"
              >
                <span>
                  <b className="font-mono">{row.plate}</b> · {row.makeModel}
                  <span className="block text-xs text-bm-muted">
                    {f.orders}: {row.orderCount}
                  </span>
                </span>
                <span className="text-right font-mono whitespace-nowrap">
                  {row.unpaidTotal > 0 ? (
                    <span className="text-amber-800 font-semibold">
                      {row.unpaidTotal.toFixed(2)} zł
                    </span>
                  ) : (
                    <span className="text-emerald-700">✓</span>
                  )}
                </span>
              </li>
            ))
          )}
        </ul>

        <div className="border-t pt-4 space-y-2">
          <h3 className="font-semibold text-sm">{f.addVehicle}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              className="crm-input"
              placeholder={f.platePlaceholder}
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value)}
            />
            <input
              className="crm-input"
              placeholder={f.makePlaceholder}
              value={newMake}
              onChange={(e) => setNewMake(e.target.value)}
            />
            <input
              className="crm-input"
              placeholder={f.modelPlaceholder}
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={addVehicle} className="inline-flex items-center gap-1">
              <Plus size={16} /> {f.addBtn}
            </Button>
            <Button type="button" variant="outline" onClick={reassignOrphanOrders}>
              {f.linkOrphanOrders}
            </Button>
          </div>
          <p className="text-xs text-bm-muted">{f.hint}</p>
        </div>

        <h3 className="font-semibold text-sm mt-4 mb-2">{f.unpaidOrders}</h3>
        <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
          {slice.workOrders.filter((o) => o.paymentStatus !== "paid").length === 0 ? (
            <li className="text-bm-muted">{f.allPaid}</li>
          ) : (
            slice.workOrders
              .filter((o) => o.paymentStatus !== "paid")
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((o) => {
                const v = slice.vehicles.find((x) => x.id === o.vehicleId);
                return (
                  <li key={o.id} className="flex justify-between gap-2">
                    <span>
                      {o.number} · {v?.plate ?? "—"}
                    </span>
                    <span className="font-mono text-amber-800">
                      {calcClientTotal(o).toFixed(2)} zł
                    </span>
                  </li>
                );
              })
          )}
        </ul>
      </div>
    </div>
  );
}
