"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Car, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
import { filterVehiclesList } from "@/lib/crm-search";
import { CrmSearchInput } from "./CrmSearchInput";

export function VehiclesListPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const [query, setQuery] = useState("");
  const dbTick = useDbSync();
  void dbTick;

  const rows = useMemo(() => {
    const db = loadDb();
    return filterVehiclesList(db, query);
  }, [query, dbTick]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl uppercase text-glow">{c.vehiclesList}</h2>
          <p className="text-sm text-bm-muted mt-1">{c.vehiclesListHint}</p>
        </div>
        <Link
          href="/crm?tab=clients"
          className="btn-outline text-xs py-2 inline-flex items-center gap-2"
        >
          <Plus size={16} /> {c.addNewClient}
        </Link>
      </div>

      <CrmSearchInput value={query} onChange={setQuery} placeholder={c.searchClients} />

      <div className="glass-red rounded-xl overflow-hidden neon-border">
        <div className="table-scroll">
          <table className="dashboard-table min-w-[720px]">
            <thead>
              <tr>
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
                  <td colSpan={9} className="text-center text-bm-muted py-8">
                    {c.noSearchResults}
                  </td>
                </tr>
              ) : (
                rows.map(({ vehicle, client, orderCount, lastOrderId }) => (
                  <tr key={vehicle.id} className="hover:bg-white/5 align-top">
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
                      {vehicle.engineVolume ? `${vehicle.engineVolume} cm³` : vehicle.engine || "—"}
                    </td>
                    <td className="text-sm font-mono">
                      {vehicle.mileage > 0 ? `${vehicle.mileage.toLocaleString()} km` : "—"}
                    </td>
                    <td className="font-mono text-sm">{orderCount}</td>
                    <td className="whitespace-nowrap space-y-1">
                      {client && (
                        <Link
                          href={`/crm/work-orders?create=1&client=${client.id}`}
                          className="block text-xs text-bm-red hover:underline"
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
