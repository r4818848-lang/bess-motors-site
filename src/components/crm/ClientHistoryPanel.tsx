"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
import { filterClientHistory } from "@/lib/crm-search";
import { calcClientTotal } from "@/lib/workorder-calc";
import { CrmSearchInput } from "./CrmSearchInput";
import { VehicleThumbnail } from "@/components/vehicle/VehicleThumbnail";

export function ClientHistoryPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const [query, setQuery] = useState("");
  const dbTick = useDbSync();
  void dbTick;

  const rows = useMemo(() => {
    const db = loadDb();
    return filterClientHistory(db, query);
  }, [query, dbTick]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase text-glow">{c.clientHistoryList}</h2>
        <p className="text-sm text-bm-muted mt-1">{c.clientHistoryHint}</p>
      </div>
      <CrmSearchInput value={query} onChange={setQuery} placeholder={c.searchClients} />
      <div className="glass-red rounded-xl overflow-hidden neon-border">
        <div className="table-scroll">
          <table className="dashboard-table min-w-[680px]">
            <thead>
              <tr>
                <th>{c.date}</th>
                <th>#</th>
                <th>{c.client}</th>
                <th>{c.vehicleColumn}</th>
                <th>{c.status}</th>
                <th>{c.total}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-bm-muted py-8">
                    {c.noSearchResults}
                  </td>
                </tr>
              ) : (
                rows.map(({ order, client, vehicle }) => (
                  <tr key={order.id} className="hover:bg-white/5 align-top">
                    <td className="text-xs whitespace-nowrap">
                      <span className="block">{order.createdAt.slice(0, 10)}</span>
                      {order.updatedAt !== order.createdAt && (
                        <span className="text-[10px] text-bm-muted">
                          {c.updated}: {order.updatedAt.slice(0, 10)}
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-bm-red">{order.number}</td>
                    <td>
                      <p className="font-semibold text-sm">{client?.name ?? "—"}</p>
                      <p className="font-mono text-[10px] text-bm-red">{client?.phone ?? ""}</p>
                    </td>
                    <td>
                      <VehicleThumbnail vehicle={vehicle} />
                    </td>
                    <td>
                      <span className="status-pill bg-bm-red/20 text-bm-red text-[10px]">
                        {t.repairStatus[order.status]}
                      </span>
                    </td>
                    <td className="font-mono">{calcClientTotal(order).toFixed(2)} zł</td>
                    <td>
                      <Link
                        href={`/crm/work-orders?edit=${encodeURIComponent(order.id)}`}
                        className="text-bm-red hover:text-white p-2 inline-flex"
                        title={w.editOrder}
                      >
                        <Pencil size={16} />
                      </Link>
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
