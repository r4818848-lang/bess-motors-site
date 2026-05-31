"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb } from "@/lib/store";
import { Trash2 } from "lucide-react";
import { useDbSync } from "@/hooks/useDbSync";
import { filterVehicleHistory } from "@/lib/crm-search";
import { CrmSearchInput } from "./CrmSearchInput";

export function VehicleHistoryPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const [query, setQuery] = useState("");
  const dbTick = useDbSync();
  void dbTick;

  const rows = useMemo(() => {
    const db = loadDb();
    return filterVehicleHistory(db, query);
  }, [query, dbTick]);

  const removeEntry = (entryId: string) => {
    if (!confirm(c.confirmDeleteVehicleHistory)) return;
    const fresh = loadDb();
    fresh.vehicleHistory = fresh.vehicleHistory.filter((e) => e.id !== entryId);
    saveDb(fresh);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl uppercase text-glow">{c.vehicleHistoryList}</h2>
      <CrmSearchInput value={query} onChange={setQuery} placeholder={c.search} />
      <div className="glass-red rounded-xl overflow-hidden neon-border">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>{c.date}</th>
              <th>{c.client}</th>
              <th>{c.vehicles}</th>
              <th>{c.field}</th>
              <th>{c.was}</th>
              <th>{c.became}</th>
              <th>{c.changedBy}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-bm-muted py-8">
                  {c.noSearchResults}
                </td>
              </tr>
            ) : (
              rows.map(({ entry, vehicle, client }) => (
                <tr key={entry.id} className="hover:bg-white/5 align-top">
                  <td className="text-xs whitespace-nowrap">
                    {new Date(entry.changedAt).toLocaleString()}
                  </td>
                  <td>
                    <p className="font-semibold text-sm">{client?.name ?? "—"}</p>
                    <p className="font-mono text-[10px] text-bm-red">{client?.phone ?? ""}</p>
                  </td>
                  <td className="text-sm">
                    {vehicle ? (
                      <>
                        {vehicle.make} {vehicle.model}
                        <span className="block font-mono text-[10px] text-bm-muted">
                          {vehicle.plate} · {vehicle.vin || "—"}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-xs uppercase text-bm-muted">{entry.field}</td>
                  <td className="text-xs text-bm-muted max-w-[120px] truncate">{entry.oldValue || "—"}</td>
                  <td className="text-xs max-w-[120px] truncate">{entry.newValue || "—"}</td>
                  <td className="text-xs">{entry.changedBy}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="text-red-400 hover:text-red-300 p-1 inline-flex"
                      title={t.common.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
