"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { loadDb, saveDb } from "@/lib/store";
import { pullCrmFromCloud, pushCrmDelete } from "@/lib/cloud-crm-db";
import { useDbSync } from "@/hooks/useDbSync";
import { filterClientHistory } from "@/lib/crm-search";
import { displayOrderTotal } from "@/lib/crm-display-price";
import { useCrmDisplay } from "@/contexts/CrmDisplayContext";
import { CrmSearchInput } from "./CrmSearchInput";
import { CrmListToolbar } from "./CrmListToolbar";
import { VehicleThumbnail } from "@/components/vehicle/VehicleThumbnail";

export function ClientHistoryPanel() {
  const { t } = useI18n();
  const c = t.crm;
  const w = t.wo;
  const { priceMode } = useCrmDisplay();
  const [query, setQuery] = useState("");
  const dbTick = useDbSync();
  void dbTick;

  const rows = useMemo(() => {
    const db = loadDb();
    const vatRate = db.settings.vatRate ?? 23;
    return filterClientHistory(db, query).map((row) => ({
      ...row,
      total: displayOrderTotal(row.order, priceMode, vatRate),
    }));
  }, [query, dbTick, priceMode]);

  const removeOrder = async (orderId: string, number: string) => {
    if (!confirm(`${c.confirmDeleteOrderHistory}\n\n${number}`)) return;
    const fresh = loadDb();
    fresh.workOrders = fresh.workOrders.filter((o) => o.id !== orderId);
    saveDb(fresh, { skipCloudPush: true });
    const ok = await pushCrmDelete(fresh);
    if (!ok) {
      await pullCrmFromCloud({ force: true });
      return;
    }
  };

  return (
    <div className="space-y-5">
      <CrmListToolbar>
        <CrmSearchInput
          value={query}
          onChange={setQuery}
          placeholder={c.searchClients}
          className="max-w-full"
        />
      </CrmListToolbar>
      <div className="crm-mw-card">
        <div className="table-scroll">
          <table className="crm-mw-table min-w-[680px]">
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
                rows.map(({ order, client, vehicle, total }) => (
                  <tr key={order.id}>
                    <td className="text-xs whitespace-nowrap">
                      <span className="block">{order.createdAt.slice(0, 10)}</span>
                      {order.updatedAt !== order.createdAt && (
                        <span className="text-[10px] text-bm-muted">
                          {c.updated}: {order.updatedAt.slice(0, 10)}
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-bm-red font-semibold">{order.number}</td>
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
                    <td className="font-mono font-semibold">{total.toFixed(2)} zł</td>
                    <td className="whitespace-nowrap space-y-1">
                      <Link
                        href={`/crm/work-orders?edit=${encodeURIComponent(order.id)}`}
                        className="inline-flex text-bm-red hover:text-white p-1"
                        title={w.editOrder}
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeOrder(order.id, order.number)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} /> {t.common.delete}
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
