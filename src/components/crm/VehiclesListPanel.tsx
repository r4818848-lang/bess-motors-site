"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Car, FileText, Trash2 } from "lucide-react";
import { AddVehicleModal } from "./AddVehicleModal";
import { useI18n } from "@/lib/i18n/context";
import { deleteVehicleFromDb, loadDb, saveDb } from "@/lib/store";
import { pullCrmFromCloud, pushCrmDelete } from "@/lib/cloud-crm-db";
import { useDbSync } from "@/hooks/useDbSync";
import { filterVehiclesList } from "@/lib/crm-search";
import { CrmSearchInput } from "./CrmSearchInput";
import { CrmListToolbar } from "./CrmListToolbar";
import { Button } from "@/components/ui/Button";

export function VehiclesListPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dbTick = useDbSync();
  void dbTick;

  const rows = useMemo(() => {
    const db = loadDb();
    return filterVehiclesList(db, query);
  }, [query, dbTick]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) setSelectedIds(new Set());
    else setSelectedIds(new Set(rows.map((r) => r.vehicle.id)));
  };

  const removeVehicle = async (vehicleId: string, label: string, orderCount: number) => {
    const msg =
      orderCount > 0
        ? `${c.confirmDeleteVehicleWithOrders}\n\n${label} · ${orderCount}`
        : `${c.confirmDeleteVehicle}\n\n${label}`;
    if (!confirm(msg)) return;
    setDeletingId(vehicleId);
    const fresh = loadDb();
    const next = deleteVehicleFromDb(fresh, vehicleId);
    saveDb(next);
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.delete(vehicleId);
      return s;
    });
    const ok = await pushCrmDelete(next);
    setDeletingId(null);
    if (!ok) {
      alert(c.syncFailed);
      await pullCrmFromCloud({ force: true });
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${c.confirmDeleteSelectedVehicles}\n\n${selectedIds.size}`)) return;
    setDeletingId("__bulk__");
    let fresh = loadDb();
    for (const id of selectedIds) {
      fresh = deleteVehicleFromDb(fresh, id);
    }
    saveDb(fresh);
    setSelectedIds(new Set());
    const ok = await pushCrmDelete(fresh);
    setDeletingId(null);
    if (!ok) {
      alert(c.syncFailed);
      await pullCrmFromCloud({ force: true });
    }
  };

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.vehicle.id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="crm-mw-btn-create text-xs py-2 inline-flex items-center gap-2"
          onClick={() => setVehicleModalOpen(true)}
        >
          <Plus size={16} /> {c.addNewVehicle}
        </button>
        <Link
          href="/crm?tab=clients"
          className="btn-outline text-xs py-2 inline-flex items-center gap-2"
        >
          <Plus size={16} /> {c.addNewClient}
        </Link>
      </div>

      <AddVehicleModal
        open={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        onCreated={() => setVehicleModalOpen(false)}
      />

      <CrmListToolbar
        showPriceToggle={false}
        actions={
          selectedIds.size > 0 ? (
            <Button
              variant="outline"
              className="text-red-400 border-red-400/50 text-xs"
              onClick={deleteSelected}
            >
              <Trash2 size={16} /> {c.deleteSelected} ({selectedIds.size})
            </Button>
          ) : null
        }
      >
        <CrmSearchInput
          value={query}
          onChange={setQuery}
          placeholder={c.searchClients}
          className="max-w-full"
        />
      </CrmListToolbar>

      <div className="crm-mw-card">
        <div className="table-scroll">
          <table className="crm-mw-table min-w-[760px]">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    aria-label={c.selectAll}
                  />
                </th>
                <th>{c.makeModel}</th>
                <th>{c.plateNumber}</th>
                <th>VIN</th>
                <th>{c.client}</th>
                <th>{c.year}</th>
                <th>{c.engine}</th>
                <th>{c.mileage}</th>
                <th>{c.workOrders}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-bm-muted py-8">
                    {c.noSearchResults}
                  </td>
                </tr>
              ) : (
                rows.map(({ vehicle, client, orderCount, lastOrderId }) => {
                  const label = `${vehicle.make} ${vehicle.model}${vehicle.plate ? ` · ${vehicle.plate}` : ""}`;
                  return (
                    <tr key={vehicle.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(vehicle.id)}
                          onChange={() => toggleSelect(vehicle.id)}
                          aria-label={label}
                        />
                      </td>
                      <td className="font-semibold">
                        <span className="inline-flex items-center gap-2">
                          <Car size={16} className="text-bm-red shrink-0" />
                          {vehicle.make} {vehicle.model}
                        </span>
                        {vehicle.color && (
                          <span className="block text-xs text-bm-muted mt-0.5">{vehicle.color}</span>
                        )}
                      </td>
                      <td className="font-mono text-sm text-bm-red">{vehicle.plate || "—"}</td>
                      <td className="font-mono text-xs text-bm-muted max-w-[140px] truncate">
                        {vehicle.vin || "—"}
                      </td>
                      <td>
                        <p className="text-sm font-semibold">{client?.name ?? "—"}</p>
                        <p className="font-mono text-[10px] text-bm-muted">{client?.phone ?? ""}</p>
                      </td>
                      <td className="text-sm">{vehicle.year || "—"}</td>
                      <td className="text-xs text-bm-muted">
                        {vehicle.engineVolume
                          ? `${vehicle.engineVolume} cm³`
                          : vehicle.engine || "—"}
                      </td>
                      <td className="text-sm font-mono">
                        {vehicle.mileage > 0 ? `${vehicle.mileage.toLocaleString()} km` : "—"}
                      </td>
                      <td className="font-mono text-sm">{orderCount}</td>
                      <td className="whitespace-nowrap space-y-1">
                        {client && (
                          <Link
                            href={`/crm/work-orders?create=1&client=${client.id}`}
                            className="block text-xs text-bm-red hover:underline font-semibold"
                          >
                            {c.createOrderForClient}
                          </Link>
                        )}
                        {lastOrderId && (
                          <Link
                            href={`/crm/work-orders?edit=${encodeURIComponent(lastOrderId)}`}
                            className="block text-xs text-bm-muted hover:text-bm-red"
                          >
                            <FileText size={12} className="inline mr-1" />
                            {c.workOrders}
                          </Link>
                        )}
                        <button
                          type="button"
                          disabled={deletingId !== null}
                          onClick={() => void removeVehicle(vehicle.id, label, orderCount)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 mt-1 disabled:opacity-50"
                        >
                          <Trash2 size={14} /> {c.deleteVehicle}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
