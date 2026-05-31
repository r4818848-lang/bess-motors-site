"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb } from "@/lib/store";
import { useDbSync } from "@/hooks/useDbSync";
import { filterWorkOrdersByQuery } from "@/lib/crm-search";
import { filterClosedWorkOrders } from "@/lib/work-order-lifecycle";
import { calcClientTotal } from "@/lib/workorder-calc";
import { CrmSearchInput } from "./CrmSearchInput";
import { VehicleThumbnail } from "@/components/vehicle/VehicleThumbnail";

export function WorkOrderHistoryPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const [query, setQuery] = useState("");
  const dbTick = useDbSync();
  void dbTick;

  const rows = useMemo(() => {
    const db = loadDb();
    const closed = filterClosedWorkOrders(db.workOrders);
    const bySearch = filterWorkOrdersByQuery(db, closed, query);
    return bySearch.map((order) => ({
        order,
        client: db.users.find((u) => u.id === order.userId),
        vehicle: db.vehicles.find((v) => v.id === order.vehicleId),
      }));
  }, [query, dbTick]);

  const removeOrder = (orderId: string) => {
    if (!confirm(c.confirmDeleteOrderHistory)) return;
    const fresh = loadDb();
    fresh.workOrders = fresh.workOrders.filter((o) => o.id !== orderId);
    saveDb(fresh);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase text-glow">{c.orderHistoryList}</h2>
        <p className="text-sm text-bm-muted mt-1">{c.orderHistoryHint}</p>
      </div>
      <CrmSearchInput value={query} onChange={setQuery} placeholder={c.search} />
      <div className="glass-red rounded-xl overflow-hidden neon-border">
        <div className="table-scroll">
        <table className="dashboard-table min-w-[640px]">
          <thead>
            <tr>
              <th>#</th>
              <th>{c.status}</th>
              <th>{c.date}</th>
              <th>{c.client}</th>
              <th>{c.vehicleColumn}</th>
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
                    <td className="font-mono text-bm-red">{order.number}</td>
                    <td>
                      <span className="status-pill bg-bm-muted/20 text-bm-muted text-[10px]">
                        {t.repairStatus[order.status]}
                      </span>
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      <span className="block">{order.createdAt.slice(0, 10)}</span>
                      {order.updatedAt !== order.createdAt && (
                        <span className="text-[10px] text-bm-muted">
                          {c.updated}: {order.updatedAt.slice(0, 10)}
                        </span>
                      )}
                    </td>
                    <td>{client?.name ?? "—"}</td>
                    <td>
                      <VehicleThumbnail vehicle={vehicle} />
                    </td>
                    <td className="font-mono">{calcClientTotal(order).toFixed(2)} zł</td>
                    <td className="whitespace-nowrap">
                      <Link
                        href={`/crm/work-orders?edit=${encodeURIComponent(order.id)}`}
                        className="text-bm-red hover:text-white p-2 inline-flex"
                        title={w.editOrder}
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeOrder(order.id)}
                        className="text-red-400 hover:text-red-300 p-2 inline-flex"
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
    </div>
  );
}
